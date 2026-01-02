import { Pinecone } from '@pinecone-database/pinecone';

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    documentId: string;
    knowledgeBaseId: string;
    tenantId: string;
    chunkIndex: number;
    totalChunks: number;
    sourceDocument: string;
    documentType: string;
    createdAt: string;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: DocumentChunk['metadata'];
}

export class VectorDB {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;
    
    if (!apiKey || !environment) {
      throw new Error('Pinecone API key and environment are required');
    }

    this.pinecone = new Pinecone({
      apiKey,
    });

    this.indexName = process.env.PINECONE_INDEX_NAME || 'ai-chatbot-embeddings';
  }

  /**
   * Initialize the Pinecone index
   */
  async initializeIndex() {
    try {
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some((index) => {
        const indexWithName = index as { name?: string };
        return indexWithName.name === this.indexName;
      }) || false;

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        await this.waitForIndex();
      }

      return this.pinecone.index(this.indexName);
    } catch (error) {
      console.error('Error initializing Pinecone index:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready
   */
  private async waitForIndex() {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const index = this.pinecone.index(this.indexName);
        const stats = await index.describeIndexStats();
        
        if (stats.totalRecordCount !== undefined) {
          console.log('Pinecone index is ready');
          return;
        }
      } catch (_error) {
        // Index not ready yet
      }

      attempts++;
      console.log(`Waiting for index to be ready... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Pinecone index failed to initialize within timeout');
  }

  /**
   * Store document chunks with embeddings
   */
  async storeDocumentChunks(
    chunks: DocumentChunk[],
    embeddings: number[][]
  ): Promise<void> {
    try {
      const index = await this.initializeIndex();
      
      const vectors = chunks.map((chunk, i) => ({
        id: chunk.id,
        values: embeddings[i],
        metadata: chunk.metadata
      }));

      // Upsert vectors in batches
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }

      console.log(`Stored ${vectors.length} document chunks in Pinecone`);
    } catch (error) {
      console.error('Error storing document chunks:', error);
      throw error;
    }
  }

  /**
   * Search for similar document chunks
   */
  async searchSimilarChunks(
    queryEmbedding: number[],
    knowledgeBaseId: string,
    tenantId: string,
    topK: number = 5,
    filter?: Record<string, unknown>
  ): Promise<SearchResult[]> {
    try {
      const index = await this.initializeIndex();
      
      const searchResults = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: {
          knowledgeBaseId,
          tenantId,
          ...filter
        }
      });

      return searchResults.matches.map(match => ({
        id: match.id,
        score: match.score || 0,
        content: String(match.metadata?.content || ''),
        metadata: match.metadata as DocumentChunk['metadata']
      }));
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      throw error;
    }
  }

  /**
   * Delete document chunks by document ID
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    try {
      const index = await this.initializeIndex();
      
      // Get all chunks for the document
      const queryResponse = await index.query({
        vector: new Array(1536).fill(0), // Dummy vector
        topK: 10000,
        includeMetadata: true,
        filter: { documentId }
      });

      // Delete chunks
      const chunkIds = queryResponse.matches.map(match => match.id);
      if (chunkIds.length > 0) {
        await index.deleteMany(chunkIds);
        console.log(`Deleted ${chunkIds.length} chunks for document ${documentId}`);
      }
    } catch (error) {
      console.error('Error deleting document chunks:', error);
      throw error;
    }
  }

  /**
   * Delete all chunks for a knowledge base
   */
  async deleteKnowledgeBaseChunks(knowledgeBaseId: string): Promise<void> {
    try {
      const index = await this.initializeIndex();
      
      // Get all chunks for the knowledge base
      const queryResponse = await index.query({
        vector: new Array(1536).fill(0), // Dummy vector
        topK: 10000,
        includeMetadata: true,
        filter: { knowledgeBaseId }
      });

      // Delete chunks
      const chunkIds = queryResponse.matches.map(match => match.id);
      if (chunkIds.length > 0) {
        await index.deleteMany(chunkIds);
        console.log(`Deleted ${chunkIds.length} chunks for knowledge base ${knowledgeBaseId}`);
      }
    } catch (error) {
      console.error('Error deleting knowledge base chunks:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<{ totalVectors?: number; indexName?: string; [key: string]: unknown }> {
    try {
      const index = await this.initializeIndex();
      return await index.describeIndexStats();
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vectorDB = new VectorDB(); 