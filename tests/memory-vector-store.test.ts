import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryVectorStore, Document } from '../src/memory-vector-store';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: class OpenAI {
      embeddings = {
        create: vi.fn().mockImplementation(({ input }: { input: string }) => {
          // Generate a simple deterministic "embedding" based on text length and content
          // For testing purposes only
          const embedding = new Array(1536).fill(0).map((_, i) => {
            return (input.charCodeAt(i % input.length) / 255 + i / 1536) / 2;
          });

          return Promise.resolve({
            data: [{ embedding }],
          });
        }),
      };
    },
  };
});

describe('MemoryVectorStore', () => {
  let store: MemoryVectorStore;

  beforeEach(() => {
    store = new MemoryVectorStore({
      apiKey: 'test-api-key',
    });
  });

  describe('Constructor', () => {
    it('should create a new instance with default config', () => {
      expect(store).toBeInstanceOf(MemoryVectorStore);
    });

    it('should throw error if no API key is provided', () => {
      // Clear env variable
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => new MemoryVectorStore()).toThrow('OpenAI API key is required');

      // Restore env variable
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    it('should use OPENAI_API_KEY from environment if no config provided', () => {
      process.env.OPENAI_API_KEY = 'env-api-key';
      const envStore = new MemoryVectorStore();
      expect(envStore).toBeInstanceOf(MemoryVectorStore);
    });
  });

  describe('Document Management', () => {
    it('should add a document with embedding', async () => {
      const doc = {
        id: 'doc1',
        content: 'This is a test document',
        metadata: { source: 'test' },
      };

      const result = await store.addDocument(doc);

      expect(result.id).toBe('doc1');
      expect(result.content).toBe('This is a test document');
      expect(result.embedding).toBeDefined();
      expect(result.embedding).toHaveLength(1536);
      expect(store.size()).toBe(1);
    });

    it('should add multiple documents', async () => {
      const docs = [
        { id: 'doc1', content: 'First document' },
        { id: 'doc2', content: 'Second document' },
        { id: 'doc3', content: 'Third document' },
      ];

      const results = await store.addDocuments(docs);

      expect(results).toHaveLength(3);
      expect(store.size()).toBe(3);
      results.forEach((doc) => {
        expect(doc.embedding).toBeDefined();
      });
    });

    it('should retrieve a document by ID', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'Test content',
      });

      const doc = store.getDocument('doc1');
      expect(doc).toBeDefined();
      expect(doc?.id).toBe('doc1');
      expect(doc?.content).toBe('Test content');
    });

    it('should return undefined for non-existent document', () => {
      const doc = store.getDocument('non-existent');
      expect(doc).toBeUndefined();
    });

    it('should get all documents', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'First' },
        { id: 'doc2', content: 'Second' },
      ]);

      const allDocs = store.getAllDocuments();
      expect(allDocs).toHaveLength(2);
    });

    it('should delete a document', async () => {
      await store.addDocument({ id: 'doc1', content: 'Test' });
      expect(store.size()).toBe(1);

      const deleted = store.deleteDocument('doc1');
      expect(deleted).toBe(true);
      expect(store.size()).toBe(0);
    });

    it('should return false when deleting non-existent document', () => {
      const deleted = store.deleteDocument('non-existent');
      expect(deleted).toBe(false);
    });

    it('should clear all documents', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'First' },
        { id: 'doc2', content: 'Second' },
      ]);

      expect(store.size()).toBe(2);
      store.clear();
      expect(store.size()).toBe(0);
    });
  });

  describe('Similarity Search', () => {
    beforeEach(async () => {
      // Add test documents
      await store.addDocuments([
        {
          id: 'doc1',
          content: 'The quick brown fox jumps over the lazy dog',
          metadata: { category: 'animals' },
        },
        {
          id: 'doc2',
          content: 'A fast brown fox leaps over a sleepy dog',
          metadata: { category: 'animals' },
        },
        {
          id: 'doc3',
          content: 'TypeScript is a typed superset of JavaScript',
          metadata: { category: 'programming' },
        },
        {
          id: 'doc4',
          content: 'Python is a high-level programming language',
          metadata: { category: 'programming' },
        },
      ]);
    });

    it('should perform similarity search', async () => {
      const results = await store.similaritySearch('fox jumping', { topK: 2 });

      expect(results).toHaveLength(2);
      expect(results[0].document).toBeDefined();
      expect(results[0].score).toBeGreaterThanOrEqual(-1);
      expect(results[0].score).toBeLessThanOrEqual(1);

      // Results should be sorted by score descending
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    });

    it('should respect topK parameter', async () => {
      const results = await store.similaritySearch('programming', { topK: 1 });
      expect(results).toHaveLength(1);
    });

    it('should filter by threshold', async () => {
      const results = await store.similaritySearch('dog', {
        topK: 10,
        threshold: 0.9,
      });

      results.forEach((result) => {
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should apply custom filter', async () => {
      const results = await store.similaritySearch('language', {
        topK: 10,
        filter: (doc) => doc.metadata?.category === 'programming',
      });

      results.forEach((result) => {
        expect(result.document.metadata?.category).toBe('programming');
      });
    });

    it('should return empty array for empty store', async () => {
      store.clear();
      const results = await store.similaritySearch('test');
      expect(results).toHaveLength(0);
    });

    it('should handle similarity search by vector', async () => {
      const doc = store.getDocument('doc1');
      expect(doc?.embedding).toBeDefined();

      if (doc?.embedding) {
        const results = store.similaritySearchByVector(doc.embedding, { topK: 2 });

        expect(results).toHaveLength(2);
        // The first result should be the same document (perfect match)
        expect(results[0].document.id).toBe('doc1');
        expect(results[0].score).toBeCloseTo(1.0, 5);
      }
    });

    it('should throw error for vector dimension mismatch', () => {
      const invalidEmbedding = new Array(100).fill(0.5);

      expect(() => {
        store.similaritySearchByVector(invalidEmbedding);
      }).toThrow('Embedding dimension mismatch');
    });
  });

  describe('Import/Export', () => {
    it('should export documents', async () => {
      await store.addDocuments([
        { id: 'doc1', content: 'First' },
        { id: 'doc2', content: 'Second' },
      ]);

      const exported = store.export();
      expect(exported).toHaveLength(2);
      exported.forEach((doc) => {
        expect(doc.embedding).toBeDefined();
      });
    });

    it('should import documents', async () => {
      // First, create and export some documents
      const originalStore = new MemoryVectorStore({ apiKey: 'test-api-key' });
      await originalStore.addDocuments([
        { id: 'doc1', content: 'First' },
        { id: 'doc2', content: 'Second' },
      ]);

      const exported = originalStore.export();

      // Import into a new store
      const newStore = new MemoryVectorStore({ apiKey: 'test-api-key' });
      newStore.import(exported);

      expect(newStore.size()).toBe(2);
      expect(newStore.getDocument('doc1')).toBeDefined();
      expect(newStore.getDocument('doc2')).toBeDefined();
    });

    it('should throw error when importing document without embedding', () => {
      const invalidDoc: Document = {
        id: 'doc1',
        content: 'Test',
        // No embedding
      };

      expect(() => {
        store.import([invalidDoc]);
      }).toThrow('must have an embedding for import');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const doc = await store.addDocument({
        id: 'empty',
        content: '',
      });

      expect(doc.embedding).toBeDefined();
    });

    it('should handle very long content', async () => {
      const longContent = 'a'.repeat(10000);
      const doc = await store.addDocument({
        id: 'long',
        content: longContent,
      });

      expect(doc.embedding).toBeDefined();
    });

    it('should handle special characters', async () => {
      const doc = await store.addDocument({
        id: 'special',
        content: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      });

      expect(doc.embedding).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const doc = await store.addDocument({
        id: 'unicode',
        content: '你好世界 🌍 مرحبا بالعالم',
      });

      expect(doc.embedding).toBeDefined();
    });

    it('should handle document update (same ID)', async () => {
      await store.addDocument({
        id: 'doc1',
        content: 'Original content',
      });

      await store.addDocument({
        id: 'doc1',
        content: 'Updated content',
      });

      expect(store.size()).toBe(1);
      const doc = store.getDocument('doc1');
      expect(doc?.content).toBe('Updated content');
    });
  });
});
