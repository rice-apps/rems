/**
 * Semantic Search Engine Module
 * Uses Transformers.js and Orama for local semantic search
 */

import { pipeline, env } from '@fugood/transformers';
import { create, insert, search, save, load, type Orama, type TypedDocument } from '@orama/orama';
import * as RNFS from 'react-native-fs';

export interface Document {
  id: string;
  text: string;
  source: string;
  nodeIndex: number;
  xpath?: string;
  tagName?: string;
  bookmark?: string | null;
}

// Disable remote models if you want to use only local cache
env.allowRemoteModels = true;
env.allowLocalModels = true;

export interface SearchResult {
  id: string;
  text: string;
  metadata: {
    source: string;
    nodeIndex: number;
    xpath?: string;
    tagName?: string;
    bookmark?: string | null;
    title?: string;
    pageNumber?: number;
  };
  distance: number;
  score: number;
}

export interface SemanticSearchOptions {
  modelName?: string;
  dbPath?: string;
}

interface BookmarkMapping {
  title: string;
  page_number: number;
  bookmark_id: string;
}

// Define Orama schema
const schema = {
  id: 'string',
  text: 'string',
  source: 'string',
  nodeIndex: 'number',
  xpath: 'string',
  tagName: 'string',
  bookmark: 'string',
  embedding: 'vector[384]', // Assuming 384 dimension for all-MiniLM-L6-v2
} as const;

type SearchDocument = TypedDocument<Orama<typeof schema>>;

export class SemanticSearchEngine {
  private modelName: string;
  private dbPath: string;

  private extractor: any;
  private db: Orama<typeof schema> | null = null;
  private dimension: number = 384; // Default for all-MiniLM-L6-v2
  private bookmarkMap: Map<string, BookmarkMapping> = new Map();
  private initialized: boolean = false;

  constructor(options: SemanticSearchOptions = {}) {
    this.modelName = options.modelName || 'Xenova/all-MiniLM-L6-v2';
    // Use DocumentDirectoryPath for React Native
    this.dbPath = options.dbPath || RNFS.DocumentDirectoryPath + '/vector_db';
  }

  /**
   * Initialize the model and load resources
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(`Loading model: ${this.modelName}...`);
    this.extractor = await pipeline('feature-extraction', this.modelName);
    console.log('Model loaded successfully.');

    // Ensure DB directory exists
    const exists = await RNFS.exists(this.dbPath);
    if (!exists) {
      await RNFS.mkdir(this.dbPath);
    }

    // Load bookmark mapping
    await this.loadBookmarkMapping();

    this.initialized = true;
  }

  /**
   * Load bookmark to title/page mapping
   */
  private async loadBookmarkMapping(): Promise<void> {
    const mappingPath = this.dbPath + '/title_page.json';
    const exists = await RNFS.exists(mappingPath);
    if (exists) {
      try {
        const content = await RNFS.readFile(mappingPath, 'utf8');
        const mappingData: BookmarkMapping[] = JSON.parse(content);
        mappingData.forEach(item => {
          this.bookmarkMap.set(item.bookmark_id, item);
        });
      } catch (error) {
        console.warn('Warning: Could not load bookmark mapping from title_page.json');
      }
    }
  }

  /**
   * Generate embeddings for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data);
  }

  /**
   * Index documents
   */
  async indexDocuments(documents: Document[]): Promise<void> {
    if (!this.extractor) {
      await this.initialize();
    }

    if (documents.length === 0) {
      console.log('No documents to index.');
      return;
    }

    console.log(`Indexing ${documents.length} documents...`);

    // Initialize Orama DB
    this.db = await create({
      schema,
    });

    // Generate embeddings and add to index
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (i % 10 === 0) console.log(`Processing: ${i + 1}/${documents.length}`);

      const embedding = await this.generateEmbedding(doc.text);

      // Update dimension from first embedding if needed (Orama schema is fixed though)
      if (i === 0) {
        this.dimension = embedding.length;
      }

      await insert(this.db, {
        id: doc.id,
        text: doc.text,
        source: doc.source,
        nodeIndex: doc.nodeIndex,
        xpath: doc.xpath || '',
        tagName: doc.tagName || '',
        bookmark: doc.bookmark || '',
        embedding: embedding,
      });
    }

    // Save index
    await this.saveIndex();

    console.log(`Successfully indexed ${documents.length} documents.`);
  }

  /**
   * Search for similar documents
   */
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.extractor) {
      await this.initialize();
    }

    if (!this.db) {
      // Try to load from disk
      const indexPath = this.dbPath + '/index.json';
      const exists = await RNFS.exists(indexPath);
      if (exists) {
        await this.loadIndex();
      } else {
        throw new Error('No index found. Please index documents first.');
      }
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Search in Orama
    const searchResult = await search(this.db!, {
      mode: 'vector',
      vector: {
        value: queryEmbedding,
        property: 'embedding',
      },
      similarity: 0.8, // Adjust threshold as needed
      limit: topK,
      includeVectors: false,
    });

    // Format results
    const results: SearchResult[] = [];
    for (const hit of searchResult.hits) {
      const doc = hit.document as SearchDocument;

      // Get title and page number from bookmark mapping
      let title: string | undefined;
      let pageNumber: number | undefined;
      if (doc.bookmark) {
        const bookmarkInfo = this.bookmarkMap.get(doc.bookmark);
        if (bookmarkInfo) {
          title = bookmarkInfo.title;
          pageNumber = bookmarkInfo.page_number;
        }
      }

      results.push({
        id: doc.id,
        text: doc.text,
        metadata: {
          source: doc.source,
          nodeIndex: doc.nodeIndex,
          xpath: doc.xpath,
          tagName: doc.tagName,
          bookmark: doc.bookmark,
          title,
          pageNumber,
        },
        distance: 1 - hit.score, // Orama returns similarity score (cosine), distance is 1 - similarity
        score: hit.score,
      });
    }

    return results;
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    const indexPath = this.dbPath + '/index.json';
    const metaPath = this.dbPath + '/metadata.json';

    if (!this.db) return;

    // Save Orama index
    const indexData = await save(this.db);
    await RNFS.writeFile(indexPath, JSON.stringify(indexData), 'utf8');

    // Save metadata
    const metadata = {
      dimension: this.dimension,
      modelName: this.modelName,
    };
    await RNFS.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8');

    console.log(`Index saved to ${this.dbPath}`);
  }

  /**
   * Load index from disk
   */
  private async loadIndex(): Promise<void> {
    const indexPath = this.dbPath + '/index.json';
    const metaPath = this.dbPath + '/metadata.json';

    const indexExists = await RNFS.exists(indexPath);
    const metaExists = await RNFS.exists(metaPath);

    if (!indexExists || !metaExists) {
      throw new Error('Index files not found. Please index documents first.');
    }

    // Load metadata
    const metaContent = await RNFS.readFile(metaPath, 'utf8');
    const metadata = JSON.parse(metaContent);

    // Validate model compatibility
    if (metadata.modelName && metadata.modelName !== this.modelName) {
      console.warn(`Warning: Index was created with model '${metadata.modelName}' but you're using '${this.modelName}'. This may cause errors. Consider reindexing with --clear.`);
    }

    this.dimension = metadata.dimension;

    // Load Orama index
    const indexContent = await RNFS.readFile(indexPath, 'utf8');
    const indexData = JSON.parse(indexContent);
    this.db = await create({ schema });
    await load(this.db, indexData);

    console.log(`Loaded index.`);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    documentCount: number;
    dimension: number;
    modelName: string;
    dbPath: string;
  }> {
    // Try to load from disk if not already loaded
    if (!this.db) {
      try {
        await this.loadIndex();
      } catch (e) {
        // Ignore if index doesn't exist
      }
    }

    // Orama doesn't expose document count directly in a simple property, 
    // but we can search for everything or just rely on metadata if we saved it.
    // For simplicity, let's assume we can get it from search or just return 0 if not loaded.
    // Actually, we can just count hits from a match-all search if needed, but that's expensive.
    // Let's just return 0 for now or update metadata to include count.

    return {
      documentCount: 0, // TODO: Store document count in metadata
      dimension: this.dimension,
      modelName: this.modelName,
      dbPath: this.dbPath,
    };
  }

  /**
   * Clear index
   */
  clearIndex(): void {
    this.db = null;
    console.log('Index cleared.');
  }
}
