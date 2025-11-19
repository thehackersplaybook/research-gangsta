import { MemoryVectorStore } from '../src/memory-vector-store.js';

/**
 * Example usage of MemoryVectorStore
 *
 * This demonstrates how to:
 * 1. Initialize the vector store
 * 2. Add documents
 * 3. Perform similarity searches
 * 4. Use filters and thresholds
 * 5. Export and import data
 */
async function main() {
  console.log('🚀 MemoryVectorStore Example\n');

  // Initialize the store (requires OPENAI_API_KEY env variable)
  const store = new MemoryVectorStore({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('📝 Adding documents...');

  // Add documents about different topics
  await store.addDocuments([
    {
      id: '1',
      content: 'The quick brown fox jumps over the lazy dog. This is a classic pangram used in typography.',
      metadata: { category: 'language', type: 'pangram' },
    },
    {
      id: '2',
      content: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
      metadata: { category: 'programming', language: 'typescript' },
    },
    {
      id: '3',
      content: 'Python is an interpreted, high-level programming language known for its simplicity.',
      metadata: { category: 'programming', language: 'python' },
    },
    {
      id: '4',
      content: 'Machine learning is a subset of artificial intelligence that enables systems to learn from data.',
      metadata: { category: 'ai', topic: 'machine-learning' },
    },
    {
      id: '5',
      content: 'Deep learning uses neural networks with multiple layers to model complex patterns in data.',
      metadata: { category: 'ai', topic: 'deep-learning' },
    },
    {
      id: '6',
      content: 'The Great Barrier Reef is the world\'s largest coral reef system, located in Australia.',
      metadata: { category: 'nature', location: 'australia' },
    },
  ]);

  console.log(`✅ Added ${store.size()} documents\n`);

  // Example 1: Basic similarity search
  console.log('🔍 Example 1: Basic similarity search');
  console.log('Query: "programming languages"');
  const results1 = await store.similaritySearch('programming languages', { topK: 3 });
  console.log('Top 3 results:');
  results1.forEach((result, index) => {
    console.log(`  ${index + 1}. [Score: ${result.score.toFixed(4)}] ${result.document.content.substring(0, 60)}...`);
  });
  console.log();

  // Example 2: Search with threshold
  console.log('🔍 Example 2: Search with similarity threshold');
  console.log('Query: "artificial intelligence"');
  const results2 = await store.similaritySearch('artificial intelligence', {
    topK: 10,
    threshold: 0.7, // Only return results with similarity > 0.7
  });
  console.log(`Results with similarity > 0.7: ${results2.length}`);
  results2.forEach((result, index) => {
    console.log(`  ${index + 1}. [Score: ${result.score.toFixed(4)}] ${result.document.content.substring(0, 60)}...`);
  });
  console.log();

  // Example 3: Search with metadata filter
  console.log('🔍 Example 3: Search with metadata filter');
  console.log('Query: "learning" (filtered to programming category)');
  const results3 = await store.similaritySearch('learning', {
    topK: 5,
    filter: (doc) => doc.metadata?.category === 'programming',
  });
  console.log('Programming-related results:');
  results3.forEach((result, index) => {
    console.log(`  ${index + 1}. [Score: ${result.score.toFixed(4)}] ${result.document.content.substring(0, 60)}...`);
  });
  console.log();

  // Example 4: Get a specific document
  console.log('📄 Example 4: Retrieve specific document');
  const doc = store.getDocument('2');
  if (doc) {
    console.log(`Document ID: ${doc.id}`);
    console.log(`Content: ${doc.content}`);
    console.log(`Metadata:`, doc.metadata);
  }
  console.log();

  // Example 5: Search by vector
  console.log('🔍 Example 5: Similarity search by vector');
  const referenceDoc = store.getDocument('4');
  if (referenceDoc?.embedding) {
    console.log(`Finding documents similar to: "${referenceDoc.content.substring(0, 50)}..."`);
    const results5 = store.similaritySearchByVector(referenceDoc.embedding, { topK: 3 });
    console.log('Similar documents:');
    results5.forEach((result, index) => {
      console.log(`  ${index + 1}. [Score: ${result.score.toFixed(4)}] ${result.document.content.substring(0, 60)}...`);
    });
  }
  console.log();

  // Example 6: Export and import
  console.log('💾 Example 6: Export and import data');
  const exported = store.export();
  console.log(`Exported ${exported.length} documents`);

  // Create a new store and import the data
  const newStore = new MemoryVectorStore({ apiKey: process.env.OPENAI_API_KEY });
  newStore.import(exported);
  console.log(`Imported into new store: ${newStore.size()} documents`);

  // Verify the import worked
  const testQuery = await newStore.similaritySearch('programming', { topK: 1 });
  console.log(`Test query on imported data: "${testQuery[0]?.document.content.substring(0, 50)}..."`);
  console.log();

  // Example 7: Document management
  console.log('🗑️  Example 7: Document management');
  console.log(`Before deletion: ${store.size()} documents`);
  store.deleteDocument('6');
  console.log(`After deleting document 6: ${store.size()} documents`);

  // Update a document (adding with same ID)
  await store.addDocument({
    id: '1',
    content: 'Updated content: The quick brown fox is a well-known English pangram.',
    metadata: { category: 'language', type: 'pangram', updated: true },
  });
  const updatedDoc = store.getDocument('1');
  console.log(`Updated document 1: ${updatedDoc?.content.substring(0, 50)}...`);
  console.log();

  console.log('✨ Example complete!');
}

// Run the example
main().catch(console.error);
