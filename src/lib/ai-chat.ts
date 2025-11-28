import OpenAI from 'openai';
import { createAIService } from './ai';
import { vectorDB, SearchResult } from './vector-db';
import { embeddingsService } from './embeddings';

export interface ChatContext {
  conversationId: string;
  botId: string;
  tenantId: string;
  knowledgeBaseId: string;
  maxContextLength: number;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  context: {
    sources: Array<{
      documentId: string;
      title: string;
      content: string;
      score: number;
    }>;
    tokensUsed: number;
    cost: number;
  };
}

export class AIChatService {
  private openai: OpenAI;
  private aiService: any;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });

    // Initialize AI service with a placeholder tenant ID
    // This will be updated when the service is used
    this.aiService = null;
  }

  /**
   * Generate AI response with knowledge base context
   */
  async chat(
    userMessage: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    try {
      // Generate embedding for user message
      const userEmbedding = await embeddingsService.generateSingleEmbedding(userMessage);

      // Search for relevant context from knowledge base
      const relevantChunks = await vectorDB.searchSimilarChunks(
        userEmbedding,
        context.knowledgeBaseId,
        context.tenantId,
        5, // top 5 most relevant chunks
        { documentId: { $exists: true } }
      );

      // Build context from relevant chunks
      const contextText = this.buildContextFromChunks(relevantChunks, context.maxContextLength);

      // Create system prompt with context
      const systemPrompt = this.createSystemPrompt(contextText);

      // Generate AI response
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: context.temperature,
        max_tokens: context.maxTokens,
        stream: false,
      });

      const aiMessage = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      // Calculate tokens and cost
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokensUsed);

      // Extract source information
      const sources = this.extractSources(relevantChunks);

      return {
        message: aiMessage,
        context: {
          sources,
          tokensUsed,
          cost,
        },
      };
    } catch (error) {
      console.error('Error in AI chat service:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Build context string from relevant document chunks
   */
  private buildContextFromChunks(chunks: SearchResult[], maxLength: number): string {
    let context = '';
    let currentLength = 0;

    for (const chunk of chunks) {
      const chunkText = `Document: ${chunk.metadata.sourceDocument}\nContent: ${chunk.content}\n\n`;
      const chunkLength = chunkText.length;

      if (currentLength + chunkLength <= maxLength) {
        context += chunkText;
        currentLength += chunkLength;
      } else {
        break;
      }
    }

    return context.trim();
  }

  /**
   * Create system prompt with knowledge base context
   */
  private createSystemPrompt(context: string): string {
    return `You are a helpful AI assistant with access to a knowledge base. Use the following context to provide accurate and helpful responses to user questions.

If the user's question can be answered using the provided context, use that information. If not, acknowledge that you don't have the specific information and offer to help with what you can.

Context from knowledge base:
${context}

Instructions:
1. Answer questions based on the provided context when possible
2. Be helpful and informative
3. If you don't have specific information, say so clearly
4. Keep responses concise but thorough
5. Always be polite and professional

Remember: You have access to the knowledge base context above. Use it to provide accurate information.`;
  }

  /**
   * Extract source information from search results
   */
  private extractSources(chunks: SearchResult[]): Array<{
    documentId: string;
    title: string;
    content: string;
    score: number;
  }> {
    return chunks.map(chunk => ({
      documentId: chunk.metadata.documentId,
      title: chunk.metadata.sourceDocument,
      content: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
      score: chunk.score,
    }));
  }

  /**
   * Calculate cost based on tokens used
   * GPT-3.5-turbo: $0.002 per 1K tokens
   */
  private calculateCost(tokens: number): number {
    const costPer1KTokens = 0.002;
    return (tokens / 1000) * costPer1KTokens;
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      // This would typically fetch from your database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Generate follow-up questions based on context
   */
  async generateFollowUpQuestions(
    userMessage: string,
    context: ChatContext
  ): Promise<string[]> {
    try {
      const prompt = `Based on the user's message: "${userMessage}", suggest 3 relevant follow-up questions that would help clarify or expand on their request. Make the questions specific and actionable.

Format your response as a simple list, one question per line.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates relevant follow-up questions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '';
      return content.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  /**
   * Analyze user intent and categorize the question
   */
  async analyzeUserIntent(userMessage: string): Promise<{
    intent: string;
    confidence: number;
    category: string;
  }> {
    try {
      const prompt = `Analyze the user's message and categorize it. Respond with a JSON object containing:
- intent: The main purpose of the message (e.g., "information_request", "problem_solving", "general_chat")
- confidence: A number between 0 and 1 indicating confidence in the classification
- category: A broad category (e.g., "support", "sales", "technical", "general")

User message: "${userMessage}"`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an AI that analyzes user intent. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 100,
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '{}';
      try {
        return JSON.parse(content);
      } catch {
        return {
          intent: 'general_chat',
          confidence: 0.5,
          category: 'general',
        };
      }
    } catch (error) {
      console.error('Error analyzing user intent:', error);
      return {
        intent: 'general_chat',
        confidence: 0.5,
        category: 'general',
      };
    }
  }
}

// Export singleton instance
export const aiChatService = new AIChatService(); 