import OpenAI from 'openai';

/**
 * Configuration options for MemoryVectorStore
 */
export interface MemoryVectorStoreConfig {
  /**
   * OpenAI API key for generating embeddings
   */
  apiKey?: string;

  /**
   * OpenAI embedding model to use
   * @default "text-embedding-3-small"
   */
  embeddingModel?: string;

  /**
   * Dimension of the embedding vectors (depends on the model)
   * @default 1536 for text-embedding-3-small
   */
  dimension?: number;
}

/**
 * Represents a document stored in the vector store
 */
export interface Document {
  /**
   * Unique identifier for the document
   */
  id: string;

  /**
   * The text content of the document
   */
  content: string;

  /**
   * Optional metadata associated with the document
   */
  metadata?: Record<string, any>;

  /**
   * The embedding vector for this document
   */
  embedding?: number[];
}

/**
 * Result from a similarity search
 */
export interface SearchResult {
  /**
   * The matching document
   */
  document: Document;

  /**
   * Similarity score (cosine similarity, range: -1 to 1, higher is more similar)
   */
  score: number;
}

/**
 * In-memory vector store using OpenAI embeddings for similarity search
 */
export class MemoryVectorStore {
  private openai: OpenAI;
  private documents: Map<string, Document>;
  private embeddingModel: string;
  private dimension: number;

  /**
   * Creates a new MemoryVectorStore instance
   * @param config - Configuration options
   */
  constructor(config: MemoryVectorStoreConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key is required. Provide it via config or OPENAI_API_KEY environment variable.');
    }

    this.openai = new OpenAI({ apiKey });
    this.documents = new Map();
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
    this.dimension = config.dimension || 1536;
  }

  /**
   * Generates an embedding vector for the given text
   * @param text - The text to embed
   * @returns The embedding vector
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculates cosine similarity between two vectors
   * @param a - First vector
   * @param b - Second vector
   * @returns Cosine similarity score (-1 to 1)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Adds a document to the vector store
   * @param document - The document to add (without embedding)
   * @returns The document with its generated embedding
   */
  async addDocument(document: Omit<Document, 'embedding'>): Promise<Document> {
    const embedding = await this.generateEmbedding(document.content);

    const fullDocument: Document = {
      ...document,
      embedding,
    };

    this.documents.set(document.id, fullDocument);
    return fullDocument;
  }

  /**
   * Adds multiple documents to the vector store
   * @param documents - Array of documents to add
   * @returns Array of documents with their generated embeddings
   */
  async addDocuments(documents: Omit<Document, 'embedding'>[]): Promise<Document[]> {
    const results: Document[] = [];

    // Process documents sequentially to avoid rate limits
    for (const doc of documents) {
      const result = await this.addDocument(doc);
      results.push(result);
    }

    return results;
  }

  /**
   * Retrieves a document by its ID
   * @param id - The document ID
   * @returns The document, or undefined if not found
   */
  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  /**
   * Retrieves all documents in the store
   * @returns Array of all documents
   */
  getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Deletes a document from the store
   * @param id - The document ID to delete
   * @returns True if the document was deleted, false if it didn't exist
   */
  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Clears all documents from the store
   */
  clear(): void {
    this.documents.clear();
  }

  /**
   * Gets the number of documents in the store
   * @returns The count of documents
   */
  size(): number {
    return this.documents.size;
  }

  /**
   * Performs similarity search to find documents similar to the query
   * @param query - The search query text
   * @param options - Search options
   * @returns Array of search results sorted by similarity (highest first)
   */
  async similaritySearch(
    query: string,
    options: {
      /**
       * Maximum number of results to return
       * @default 5
       */
      topK?: number;

      /**
       * Minimum similarity score threshold (0 to 1)
       * @default 0
       */
      threshold?: number;

      /**
       * Optional filter function to filter documents before similarity comparison
       */
      filter?: (doc: Document) => boolean;
    } = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, threshold = 0, filter } = options;

    if (this.documents.size === 0) {
      return [];
    }

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Calculate similarity scores for all documents
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      // Apply filter if provided
      if (filter && !filter(doc)) {
        continue;
      }

      if (!doc.embedding) {
        console.warn(`Document ${doc.id} has no embedding, skipping`);
        continue;
      }

      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);

      // Only include results above the threshold
      if (score >= threshold) {
        results.push({
          document: doc,
          score,
        });
      }
    }

    // Sort by score (descending) and take top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Performs similarity search using a pre-computed embedding vector
   * @param embedding - The embedding vector to search with
   * @param options - Search options
   * @returns Array of search results sorted by similarity (highest first)
   */
  similaritySearchByVector(
    embedding: number[],
    options: {
      topK?: number;
      threshold?: number;
      filter?: (doc: Document) => boolean;
    } = {}
  ): SearchResult[] {
    const { topK = 5, threshold = 0, filter } = options;

    if (this.documents.size === 0) {
      return [];
    }

    if (embedding.length !== this.dimension) {
      throw new Error(`Embedding dimension mismatch: expected ${this.dimension}, got ${embedding.length}`);
    }

    // Calculate similarity scores for all documents
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (filter && !filter(doc)) {
        continue;
      }

      if (!doc.embedding) {
        console.warn(`Document ${doc.id} has no embedding, skipping`);
        continue;
      }

      const score = this.cosineSimilarity(embedding, doc.embedding);

      if (score >= threshold) {
        results.push({
          document: doc,
          score,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Exports all documents (useful for persistence)
   * @returns Array of all documents
   */
  export(): Document[] {
    return this.getAllDocuments();
  }

  /**
   * Imports documents into the store (useful for loading from persistence)
   * @param documents - Array of documents with embeddings to import
   */
  import(documents: Document[]): void {
    for (const doc of documents) {
      if (!doc.embedding) {
        throw new Error(`Document ${doc.id} must have an embedding for import`);
      }
      this.documents.set(doc.id, doc);
    }
  }
}
