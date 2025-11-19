# MemoryVectorStore

A production-grade, in-house vector store library using OpenAI embeddings for semantic similarity search.

## Features

- **Simple API**: Easy-to-use interface for document management and similarity search
- **OpenAI Embeddings**: Leverages OpenAI's powerful text-embedding models
- **Cosine Similarity**: Efficient similarity computation using cosine similarity
- **Filtering & Thresholds**: Advanced search with metadata filters and similarity thresholds
- **Import/Export**: Persist and restore your vector store data
- **TypeScript**: Full type safety and excellent IDE support
- **Production Ready**: Comprehensive test coverage and error handling

## Installation

The library is already included in this project. If you need to install dependencies:

```bash
npm install
```

## Usage

### Basic Example

```typescript
import { MemoryVectorStore } from './src/memory-vector-store';

// Initialize the store
const store = new MemoryVectorStore({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add documents
await store.addDocuments([
  {
    id: '1',
    content: 'TypeScript is a typed superset of JavaScript',
    metadata: { category: 'programming' },
  },
  {
    id: '2',
    content: 'Python is a high-level programming language',
    metadata: { category: 'programming' },
  },
]);

// Perform similarity search
const results = await store.similaritySearch('coding languages', {
  topK: 5,
  threshold: 0.7,
});

results.forEach(result => {
  console.log(`[${result.score.toFixed(4)}] ${result.document.content}`);
});
```

### Configuration

```typescript
const store = new MemoryVectorStore({
  apiKey: 'your-openai-api-key', // Optional if OPENAI_API_KEY env var is set
  embeddingModel: 'text-embedding-3-small', // Default model
  dimension: 1536, // Embedding dimension (default for text-embedding-3-small)
});
```

### Adding Documents

```typescript
// Add a single document
const doc = await store.addDocument({
  id: 'doc1',
  content: 'Your document content here',
  metadata: { source: 'example', tags: ['important'] },
});

// Add multiple documents
const docs = await store.addDocuments([
  { id: '1', content: 'First document' },
  { id: '2', content: 'Second document' },
  { id: '3', content: 'Third document' },
]);
```

### Similarity Search

```typescript
// Basic search
const results = await store.similaritySearch('your query', { topK: 5 });

// Search with threshold
const filteredResults = await store.similaritySearch('your query', {
  topK: 10,
  threshold: 0.8, // Only return results with similarity > 0.8
});

// Search with metadata filter
const categoryResults = await store.similaritySearch('your query', {
  topK: 5,
  filter: (doc) => doc.metadata?.category === 'programming',
});

// Search by embedding vector
const embedding = [/* your embedding vector */];
const vectorResults = store.similaritySearchByVector(embedding, {
  topK: 5,
});
```

### Document Management

```typescript
// Get a document by ID
const doc = store.getDocument('doc1');

// Get all documents
const allDocs = store.getAllDocuments();

// Delete a document
store.deleteDocument('doc1');

// Clear all documents
store.clear();

// Get document count
const count = store.size();
```

### Import/Export

```typescript
// Export all documents (useful for persistence)
const exported = store.export();
await fs.promises.writeFile('store.json', JSON.stringify(exported));

// Import documents (useful for loading from persistence)
const data = JSON.parse(await fs.promises.readFile('store.json', 'utf-8'));
store.import(data);
```

## API Reference

### `MemoryVectorStore`

#### Constructor

```typescript
constructor(config?: MemoryVectorStoreConfig)
```

#### Methods

##### `addDocument(document: Omit<Document, 'embedding'>): Promise<Document>`
Adds a single document to the store and generates its embedding.

##### `addDocuments(documents: Omit<Document, 'embedding'>[]): Promise<Document[]>`
Adds multiple documents to the store.

##### `getDocument(id: string): Document | undefined`
Retrieves a document by its ID.

##### `getAllDocuments(): Document[]`
Returns all documents in the store.

##### `deleteDocument(id: string): boolean`
Deletes a document by ID. Returns `true` if deleted, `false` if not found.

##### `clear(): void`
Removes all documents from the store.

##### `size(): number`
Returns the number of documents in the store.

##### `similaritySearch(query: string, options?): Promise<SearchResult[]>`
Performs similarity search using a text query.

Options:
- `topK?: number` - Maximum number of results (default: 5)
- `threshold?: number` - Minimum similarity score (default: 0)
- `filter?: (doc: Document) => boolean` - Custom filter function

##### `similaritySearchByVector(embedding: number[], options?): SearchResult[]`
Performs similarity search using an embedding vector.

##### `export(): Document[]`
Exports all documents with their embeddings.

##### `import(documents: Document[]): void`
Imports documents with embeddings.

### Types

#### `Document`
```typescript
interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}
```

#### `SearchResult`
```typescript
interface SearchResult {
  document: Document;
  score: number; // Cosine similarity: -1 to 1 (higher is more similar)
}
```

#### `MemoryVectorStoreConfig`
```typescript
interface MemoryVectorStoreConfig {
  apiKey?: string;
  embeddingModel?: string;
  dimension?: number;
}
```

## Examples

See the `examples/memory-vector-store-example.ts` file for a comprehensive example demonstrating all features.

Run the example:
```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your-api-key-here

# Run the example
npm run dev -- examples/memory-vector-store-example.ts
```

## Testing

The library includes comprehensive tests covering all functionality:

```bash
npm test
```

## Advanced Usage

### Custom Embedding Models

You can use different OpenAI embedding models:

```typescript
const store = new MemoryVectorStore({
  embeddingModel: 'text-embedding-3-large',
  dimension: 3072, // text-embedding-3-large uses 3072 dimensions
});
```

### Batch Processing

For better rate limit handling, documents are processed sequentially in `addDocuments()`. For production use with many documents, consider implementing:

- Rate limiting with exponential backoff
- Batch API calls
- Progress tracking
- Error recovery

### Persistence

While this is an in-memory store, you can persist data using the export/import methods:

```typescript
// Save to disk
const data = store.export();
await fs.promises.writeFile('store.json', JSON.stringify(data));

// Load from disk
const data = JSON.parse(await fs.promises.readFile('store.json', 'utf-8'));
const store = new MemoryVectorStore({ apiKey: process.env.OPENAI_API_KEY });
store.import(data);
```

## Performance Considerations

- **Memory**: All documents and embeddings are stored in memory
- **Search**: O(n) complexity for similarity search (where n = number of documents)
- **Embedding Generation**: Limited by OpenAI API rate limits

For production use with large datasets (>10,000 documents), consider:
- Implementing approximate nearest neighbor (ANN) search
- Using external vector databases (Pinecone, Weaviate, etc.)
- Adding caching layers
- Implementing sharding/partitioning strategies

## Error Handling

The library throws errors for:
- Missing OpenAI API key
- Failed embedding generation
- Vector dimension mismatches
- Invalid import data

Always wrap operations in try-catch blocks:

```typescript
try {
  await store.addDocument({ id: '1', content: 'Test' });
} catch (error) {
  console.error('Failed to add document:', error);
}
```

## License

ISC

## Contributing

This is an in-house library for the research-gangsta project.
