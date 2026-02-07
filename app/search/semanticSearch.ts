/**
 * Semantic Search Engine Module
 * Uses Transformers.js and HNSW for local semantic search
 */

import { pipeline, env } from '@fugood/transformers';
import { SimpleVectorIndex } from './simpleVectorIndex';

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
  private index: SimpleVectorIndex | null = null;
  private documents: Map<string, Document> = new Map(); // Changed key to string (ID)
  private dimension: number = 384; // Default for all-MiniLM-L6-v2
  private numElements: number = 0;
  private bookmarkMap: Map<string, BookmarkMapping> = new Map();
  private initialized: boolean = false;

  constructor(options: SemanticSearchOptions = {}) {
    this.modelName = options.modelName || 'Xenova/all-MiniLM-L6-v2';
    // Use assets/dbindex for the database path
    this.dbPath = options.dbPath || 'assets/dbindex';
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

    // Load bookmark mapping
    await this.loadBookmarkMapping();

    this.initialized = true;
  }

  /**
   * Load bookmark to title/page mapping
   */
  private async loadBookmarkMapping(): Promise<void> {
    try {
      const mappingData: BookmarkMapping[] = require('../../assets/dbindex/title_page.json');
      mappingData.forEach(item => {
        this.bookmarkMap.set(item.bookmark_id, item);
      });
    } catch (error) {
      console.warn('Warning: Could not load bookmark mapping from title_page.json');
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

    // Initialize SimpleVectorIndex
    const distanceMetric = this.space === 'l2' ? 'euclideanDistance' : 'cosineSimilarity';
    this.index = new SimpleVectorIndex(this.maxLayers, this.m, distanceMetric);

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
      try {
        await this.loadIndex();
      } catch {
        throw new Error('No index found. Please index documents first.');
      }
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Search in index with distances
    const searchResults = this.index!.queryWithDistances(queryEmbedding, Math.min(topK, this.numElements));

    // Format results
    const results: SearchResult[] = [];
    for (const result of searchResults) {
      const doc = this.documents.get(result.id);

      if (doc) {
        // Get title and page number from bookmark mapping
        let title: string | undefined;
        let pageNumber: number | undefined;
        if (doc.bookmark && this.bookmarkMap.has(doc.bookmark)) {
          const bookmarkInfo = this.bookmarkMap.get(doc.bookmark);
          if (bookmarkInfo) {
            title = bookmarkInfo.title;
            pageNumber = bookmarkInfo.page_number;
          }
        } else {
          // Try to match by text content if no bookmark field
          // This is a fallback - ideally documents should have bookmark fields
          console.debug('Document missing bookmark field:', doc.id);
        }

        // For cosine similarity, distance is the similarity (higher is better)
        // For euclidean, distance is the distance (lower is better)
        // We'll use the distance value directly and convert to score
        const score = this.space === 'l2'
          ? 1 / (1 + result.distance) // Convert euclidean distance to score (0-1, higher is better)
          : result.distance; // Cosine similarity is already a score (0-1, higher is better)

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
          distance: result.distance,
          score: score,
        });
      }
    }
    
    return results;
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    console.log('Note: Saving to assets is not supported. Index is loaded from bundled assets.');
    // Index is read-only from assets, no saving needed
  }

  /**
   * Load index from disk
   */
  private async loadIndex(): Promise<void> {
    try {
      // Load metadata
      const metadata = require('../../assets/dbindex/metadata.json');

      // Validate model compatibility
      if (metadata.modelName && metadata.modelName !== this.modelName) {
        console.warn(`Warning: Index was created with model '${metadata.modelName}' but you're using '${this.modelName}'. This may cause errors. Consider reindexing with --clear.`);
      }

      this.dimension = metadata.dimension;
      this.numElements = metadata.numElements;
      this.space = metadata.space;

      // Load SimpleVectorIndex
      const embeddingsArray = require('../../assets/dbindex/embeddings.json');
      console.log('Loaded embeddings.json array with', embeddingsArray.length, 'entries');

      // Convert array format to IndexData format
      const distanceMetric: 'cosineSimilarity' | 'euclideanDistance' =
        this.space === 'l2' ? 'euclideanDistance' : 'cosineSimilarity';
      const vectors = embeddingsArray.map(([id, vector]: [string, number[]]) => ({ id, vector }));
      const indexData = {
        vectors,
        distanceFunction: distanceMetric,
      };

      this.index = SimpleVectorIndex.rebuildFromJSON(indexData);

      // Load documents
      const docsArray = require('../../assets/dbindex/documents.json');
      this.documents = new Map(docsArray);

      console.log(`Loaded index with ${this.numElements} documents.`);
    } catch (error) {
      throw new Error('Index files not found. Please ensure assets/dbindex contains the required files.');
    }
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
      try {
        const metadata = require('../../assets/dbindex/metadata.json');
        return {
          documentCount: metadata.numElements || 0,
          dimension: metadata.dimension || this.dimension,
          modelName: metadata.modelName || this.modelName,
          dbPath: this.dbPath,
        };
      } catch {
        // Metadata not found, return defaults
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
