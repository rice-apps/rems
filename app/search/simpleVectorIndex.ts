/**
 * Simple Vector Index
 * A lightweight alternative to HNSW for small to medium-sized vector collections
 * Uses brute-force search with distance calculations
 */

export type DistanceFunction = 'cosineSimilarity' | 'euclideanDistance';

interface VectorEntry {
  id: string;
  vector: number[];
}

interface IndexData {
  vectors: VectorEntry[];
  distanceFunction: DistanceFunction;
}

export class SimpleVectorIndex {
  private vectors: VectorEntry[] = [];
  private distanceFunction: DistanceFunction;

  constructor(
    maxLayers: number, // Ignored - kept for API compatibility
    maxEdges: number, // Ignored - kept for API compatibility
    distanceFunction: DistanceFunction
  ) {
    this.distanceFunction = distanceFunction;
  }

  /**
   * Add a vector to the index
   */
  add(id: string, vector: number[]): void {
    this.vectors.push({ id, vector });
  }

  /**
   * Query for nearest neighbors
   * Returns array of IDs sorted by similarity
   */
  query(queryVector: number[], k: number): string[] {
    if (!this.vectors || this.vectors.length === 0) {
      console.warn('SimpleVectorIndex: vectors is', this.vectors);
      return [];
    }

    // Calculate distances for all vectors
    const distances = this.vectors.map(entry => ({
      id: entry.id,
      distance: this.calculateDistance(queryVector, entry.vector),
    }));

    // Sort by distance (ascending for euclidean, descending for cosine)
    if (this.distanceFunction === 'euclideanDistance') {
      distances.sort((a, b) => a.distance - b.distance);
    } else {
      // Cosine similarity: higher is better
      distances.sort((a, b) => b.distance - a.distance);
    }

    // Return top k IDs
    return distances.slice(0, k).map(d => d.id);
  }

  /**
   * Query for nearest neighbors with distances
   * Returns array of results with IDs and distances
   */
  queryWithDistances(queryVector: number[], k: number): { id: string; distance: number }[] {
    if (!this.vectors || this.vectors.length === 0) {
      console.warn('SimpleVectorIndex: vectors is', this.vectors);
      return [];
    }

    // Calculate distances for all vectors
    const distances = this.vectors.map(entry => ({
      id: entry.id,
      distance: this.calculateDistance(queryVector, entry.vector),
    }));

    // Sort by distance (ascending for euclidean, descending for cosine)
    if (this.distanceFunction === 'euclideanDistance') {
      distances.sort((a, b) => a.distance - b.distance);
    } else {
      // Cosine similarity: higher is better
      distances.sort((a, b) => b.distance - a.distance);
    }

    // Return top k results with distances
    return distances.slice(0, k);
  }

  /**
   * Calculate distance between two vectors
   */
  private calculateDistance(vec1: number[], vec2: number[]): number {
    if (this.distanceFunction === 'euclideanDistance') {
      return this.euclideanDistance(vec1, vec2);
    } else {
      return this.cosineSimilarity(vec1, vec2);
    }
  }

  /**
   * Euclidean distance
   */
  private euclideanDistance(vec1: number[], vec2: number[]): number {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      const diff = vec1[i] - vec2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Cosine similarity
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): IndexData {
    return {
      vectors: this.vectors,
      distanceFunction: this.distanceFunction,
    };
  }

  /**
   * Deserialize from JSON
   */
  static rebuildFromJSON(data: IndexData): SimpleVectorIndex {
    // Create instance with dummy parameters (they're not used anyway)
    const index = new SimpleVectorIndex(0, 0, data.distanceFunction);
    index.vectors = data.vectors || [];

    // Log for debugging
    console.log(`SimpleVectorIndex loaded with ${index.vectors.length} vectors`);

    return index;
  }
}
