/**
 * Semantic Search Engine Module
 * Uses Transformers.js and HNSW for local semantic search
 */

import { pipeline, env } from '@fugood/transformers';
import { HNSW } from 'hnsw-lite';
import * as RNFS from 'react-native-fs';
import { join } from 'path';

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
  distance: number; // Note: hnsw-lite returns IDs, we might not get distance directly from query() if it only returns IDs.
  // Wait, checking hnsw-lite types: query(queryVector: number[], nClosest?: number): string[];
  // It returns string[] (IDs). It DOES NOT return distances.
  // This is a limitation. We might need to calculate distance manually if needed, 
  // or just return results without distance score for now.
  // Or we can check if there's a method to get distance.
  // For now, I will set distance to 0 or calculate it if possible.
  score: number;
}

export interface SemanticSearchOptions {
  modelName?: string;
  dbPath?: string;
  space?: 'cosine' | 'l2' | 'ip'; // hnsw-lite supports 'cosine', 'l2', 'euclidean'
  maxElements?: number; // Not used in hnsw-lite constructor directly, but useful for limits
  efConstruction?: number; // Not used in hnsw-lite
  m?: number; // Mapped to maxEdges
  maxLayers?: number; // New option for hnsw-lite
}

interface BookmarkMapping {
  title: string;
  page_number: number;
  bookmark_id: string;
}

export class SemanticSearchEngine {
  private modelName: string;
  private dbPath: string;
  private space: string;
  private maxElements: number;
  private m: number;
  private maxLayers: number;

  private extractor: any;
  private index: HNSW | null = null;
  private documents: Map<string, Document> = new Map(); // Changed key to string (ID)
  private dimension: number = 384; // Default for all-MiniLM-L6-v2
  private numElements: number = 0;
  private bookmarkMap: Map<string, BookmarkMapping> = new Map();
  private initialized: boolean = false;

  constructor(options: SemanticSearchOptions = {}) {
    this.modelName = options.modelName || 'Xenova/all-MiniLM-L6-v2';
    // Use DocumentDirectoryPath for React Native
    this.dbPath = options.dbPath || RNFS.DocumentDirectoryPath + '/vector_db';
    this.space = options.space || 'cosine';
    this.maxElements = options.maxElements || 10000;
    this.m = options.m || 16;
    this.maxLayers = options.maxLayers || 3;
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

    // Initialize HNSW index
    // hnsw-lite constructor(maxLayers, maxEdges, distanceFunction)
    // Initialize HNSW index
    // hnsw-lite constructor(maxLayers, maxEdges, distanceFunction)
    const distanceMetric = this.space === 'l2' ? 'euclideanDistance' : 'cosineSimilarity';
    this.index = new HNSW(this.maxLayers, this.m, distanceMetric);

    // Generate embeddings and add to index
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      // process.stdout.write is not available in RN, use console.log occasionally or just log start/end
      if (i % 10 === 0) console.log(`Processing: ${i + 1}/${documents.length}`);

      const embedding = await this.generateEmbedding(doc.text);

      // Update dimension from first embedding
      if (i === 0) {
        this.dimension = embedding.length;
      }

      // Add to index
      this.index.add(doc.id, embedding);
      this.documents.set(doc.id, doc);
    }

    this.numElements = documents.length;

    // Save index and documents
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

    if (!this.index || this.numElements === 0) {
      // Try to load from disk
      const indexPath = this.dbPath + '/index.dat';
      const exists = await RNFS.exists(indexPath);
      if (exists) {
        await this.loadIndex();
      } else {
        throw new Error('No index found. Please index documents first.');
      }
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Search in index
    // hnsw-lite query returns string[] (IDs)
    const resultIds = this.index!.query(queryEmbedding, Math.min(topK, this.numElements));

    // Format results
    const results: SearchResult[] = [];
    for (const id of resultIds) {
      const doc = this.documents.get(id);

      if (doc) {
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
          distance: 0, // hnsw-lite doesn't return distance
          score: 0, // Cannot calculate score without distance
        });
      }
    }

    return results;
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    const indexPath = this.dbPath + '/index.dat';
    const docsPath = this.dbPath + '/documents.json';
    const metaPath = this.dbPath + '/metadata.json';

    // Save HNSW index
    const indexJson = this.index!.toJSON();
    await RNFS.writeFile(indexPath, JSON.stringify(indexJson), 'utf8');

    // Save documents
    const docsArray = Array.from(this.documents.entries());
    await RNFS.writeFile(docsPath, JSON.stringify(docsArray, null, 2), 'utf8');

    // Save metadata
    const metadata = {
      dimension: this.dimension,
      numElements: this.numElements,
      space: this.space,
      modelName: this.modelName,
    };
    await RNFS.writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8');

    console.log(`Index saved to ${this.dbPath}`);
  }

  /**
   * Load index from disk
   */
  private async loadIndex(): Promise<void> {
    const indexPath = this.dbPath + '/index.dat';
    const docsPath = this.dbPath + '/documents.json';
    const metaPath = this.dbPath + '/metadata.json';

    const indexExists = await RNFS.exists(indexPath);
    const docsExists = await RNFS.exists(docsPath);
    const metaExists = await RNFS.exists(metaPath);

    if (!indexExists || !docsExists || !metaExists) {
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
    this.numElements = metadata.numElements;
    this.space = metadata.space;

    // Load HNSW index
    const indexContent = await RNFS.readFile(indexPath, 'utf8');
    const indexJson = JSON.parse(indexContent);
    this.index = HNSW.rebuildFromJSON(indexJson);

    // Load documents
    const docsContent = await RNFS.readFile(docsPath, 'utf8');
    const docsArray = JSON.parse(docsContent);
    this.documents = new Map(docsArray);

    console.log(`Loaded index with ${this.numElements} documents.`);
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
    if (this.numElements === 0) {
      const metaPath = this.dbPath + '/metadata.json';
      const exists = await RNFS.exists(metaPath);
      if (exists) {
        const metaContent = await RNFS.readFile(metaPath, 'utf8');
        const metadata = JSON.parse(metaContent);
        return {
          documentCount: metadata.numElements || 0,
          dimension: metadata.dimension || this.dimension,
          modelName: metadata.modelName || this.modelName,
          dbPath: this.dbPath,
        };
      }
    }

    return {
      documentCount: this.numElements,
      dimension: this.dimension,
      modelName: this.modelName,
      dbPath: this.dbPath,
    };
  }

  /**
   * Clear index
   */
  clearIndex(): void {
    this.index = null;
    this.documents.clear();
    this.numElements = 0;
    console.log('Index cleared.');
  }
}
