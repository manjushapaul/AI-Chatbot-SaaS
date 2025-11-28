import OpenAI from 'openai';
import { DocumentChunk } from './vector-db';

export interface EmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
  cost: number;
}

export class EmbeddingsService {
  private openai: OpenAI;
  private model: string;
  private batchSize: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });

    this.model = 'text-embedding-3-small';
    this.batchSize = 100; // OpenAI allows up to 100 texts per request
  }

  /**
   * Generate embeddings for document chunks
   */
  async generateEmbeddings(chunks: DocumentChunk[]): Promise<EmbeddingResult> {
    try {
      const embeddings: number[][] = [];
      let totalTokens = 0;
      let totalCost = 0;

      // Process chunks in batches
      for (let i = 0; i < chunks.length; i += this.batchSize) {
        const batch = chunks.slice(i, i + this.batchSize);
        const texts = batch.map(chunk => chunk.content);

        console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(chunks.length / this.batchSize)}`);

        const response = await this.openai.embeddings.create({
          model: this.model,
          input: texts,
          encoding_format: 'float',
        });

        // Extract embeddings
        const batchEmbeddings = response.data.map(item => item.embedding);
        embeddings.push(...batchEmbeddings);

        // Calculate tokens and cost
        const batchTokens = response.usage.total_tokens;
        totalTokens += batchTokens;
        totalCost += this.calculateCost(batchTokens);

        // Rate limiting - wait between batches
        if (i + this.batchSize < chunks.length) {
          await this.delay(100); // 100ms delay between batches
        }
      }

      console.log(`Generated ${embeddings.length} embeddings with ${totalTokens} tokens (cost: $${totalCost.toFixed(4)})`);

      return {
        embeddings,
        totalTokens,
        cost: totalCost,
      };
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateSingleEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating single embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cost based on tokens used
   * OpenAI text-embedding-3-small: $0.00002 per 1K tokens
   */
  private calculateCost(tokens: number): number {
    const costPer1KTokens = 0.00002;
    return (tokens / 1000) * costPer1KTokens;
  }

  /**
   * Delay function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate text length for embeddings
   * OpenAI has a limit of 8192 tokens per text
   */
  validateTextLength(text: string): boolean {
    // Rough estimation: 1 token ≈ 4 characters
    const estimatedTokens = text.length / 4;
    return estimatedTokens <= 8000; // Leave some buffer
  }

  /**
   * Truncate text if it's too long for embeddings
   */
  truncateText(text: string, maxTokens: number = 8000): string {
    if (this.validateTextLength(text)) {
      return text;
    }

    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;
    return text.substring(0, maxChars) + '...';
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      name: this.model,
      maxTokens: 8192,
      dimensions: 1536,
      costPer1KTokens: 0.00002,
    };
  }
}

// Export singleton instance
export const embeddingsService = new EmbeddingsService(); 