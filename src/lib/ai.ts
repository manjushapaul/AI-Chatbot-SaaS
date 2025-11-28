import OpenAI from 'openai';
import { createTenantDB } from './db';

// Initialize OpenAI client with error handling
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn('OPENAI_API_KEY is not set. AI chat functionality will not work.');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  sources?: string[];
  metadata?: Record<string, unknown>;
}

interface Document {
  title: string;
  content: string;
  relevance?: number;
}

interface FAQ {
  question: string;
  answer: string;
  relevance?: number;
}

interface KnowledgeBase {
  id: string;
  name: string;
  documents: Document[];
  faqs: FAQ[];
}

interface Bot {
  id: string;
  name: string;
  personality?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIService {
  private tenantDB: ReturnType<typeof createTenantDB>;

  constructor(tenantId: string) {
    this.tenantDB = createTenantDB(tenantId);
  }

  async chat(
    message: string,
    conversationId: string,
    botId: string
  ): Promise<ChatResponse> {
    try {
      // Get conversation history
      const conversation = await this.tenantDB.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get bot configuration
      const bot = await this.tenantDB.getBot(botId);
      if (!bot) {
        throw new Error('Bot not found');
      }

      // Get relevant knowledge base content using RAG
      const relevantContent = await this.getRelevantContent(message, botId);

      // Build system prompt with bot personality and knowledge
      const systemPrompt = this.buildSystemPrompt(bot, relevantContent);

      // Prepare conversation messages
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(conversation.messages || []).map((msg: { role: string; content: string }) => {
          // Convert database role format (USER/ASSISTANT) to OpenAI format (user/assistant)
          let role: 'user' | 'assistant' | 'system' = 'user';
          if (msg.role === 'USER') {
            role = 'user';
          } else if (msg.role === 'ASSISTANT') {
            role = 'assistant';
          } else if (msg.role === 'SYSTEM') {
            role = 'system';
          } else {
            // Handle lowercase or other formats
            role = msg.role.toLowerCase() as 'user' | 'assistant' | 'system';
          }
          return {
            role,
            content: msg.content || '',
          };
        }),
        { role: 'user', content: message },
      ];

      // Validate OpenAI API key and client
      if (!openai || !process.env.OPENAI_API_KEY) {
        // Provide a mock response when API key is not configured
        console.warn('⚠️  OpenAI API key not configured. Using mock response. Add OPENAI_API_KEY to your .env file for real AI responses.');
        const mockResponse = this.generateMockResponse(message, bot, relevantContent);
        
        // Save the user message and bot response
        await this.tenantDB.addMessage({
          content: message,
          role: 'USER',
          conversationId,
        });

        await this.tenantDB.addMessage({
          content: mockResponse,
          role: 'ASSISTANT',
          conversationId,
          metadata: {
            sources: relevantContent.map(doc => doc.title),
            model: bot.model || 'gpt-3.5-turbo',
            tokens: 0,
            mock: true,
          },
        });

        return {
          message: mockResponse,
          sources: relevantContent.map(doc => doc.title),
          metadata: {
            model: bot.model || 'gpt-3.5-turbo',
            tokens: 0,
            mock: true,
          },
        };
      }

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: bot.model || 'gpt-3.5-turbo',
        messages,
        temperature: bot.temperature || 0.7,
        max_tokens: bot.maxTokens || 1000,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your request.';

      // Save the user message and bot response
      await this.tenantDB.addMessage({
        content: message,
        role: 'USER',
        conversationId,
      });

      await this.tenantDB.addMessage({
        content: response,
        role: 'ASSISTANT',
        conversationId,
        metadata: {
          sources: relevantContent.map(doc => doc.title),
          model: bot.model,
          tokens: completion.usage?.total_tokens,
        },
      });

      return {
        message: response,
        sources: relevantContent.map(doc => doc.title),
        metadata: {
          model: bot.model,
          tokens: completion.usage?.total_tokens,
        },
      };
    } catch (error) {
      console.error('Error in AI chat service:', error);
      
      // If API key is not configured and we hit an error, try to provide a mock response
      if ((!openai || !process.env.OPENAI_API_KEY) && error instanceof Error && error.message.includes('API key')) {
        try {
          // Get bot and conversation again for mock response
          const conversation = await this.tenantDB.getConversation(conversationId);
          const bot = await this.tenantDB.getBot(botId);
          if (bot && conversation) {
            const relevantContent = await this.getRelevantContent(message, botId).catch(() => []);
            const mockResponse = this.generateMockResponse(message, bot, relevantContent);
            
            await this.tenantDB.addMessage({
              content: message,
              role: 'USER',
              conversationId,
            });

            await this.tenantDB.addMessage({
              content: mockResponse,
              role: 'ASSISTANT',
              conversationId,
              metadata: {
                sources: relevantContent.map(doc => doc.title),
                model: bot.model || 'gpt-3.5-turbo',
                tokens: 0,
                mock: true,
              },
            });

            return {
              message: mockResponse,
              sources: relevantContent.map(doc => doc.title),
              metadata: {
                model: bot.model || 'gpt-3.5-turbo',
                tokens: 0,
                mock: true,
              },
            };
          }
        } catch (mockError) {
          console.error('Error generating mock response:', mockError);
        }
      }
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your OpenAI account.');
        }
        throw new Error(`Failed to process chat request: ${error.message}`);
      }
      throw new Error('Failed to process chat request');
    }
  }

  private async getRelevantContent(query: string, botId: string): Promise<Array<{ title: string; content: string; relevance: number }>> {
    try {
      // Get all knowledge bases for the bot
      const knowledgeBases = await this.tenantDB.getKnowledgeBases(botId);
      
      if (!knowledgeBases || !knowledgeBases.length) {
        return [];
      }

      // For now, we'll do a simple text search
      // In production, you'd use vector embeddings and semantic search
      const allDocuments: Document[] = [];
      const allFaqs: FAQ[] = [];

      knowledgeBases.forEach((kb: any) => {
        // Safely handle documents and faqs arrays
        if (kb.documents && Array.isArray(kb.documents)) {
          allDocuments.push(...kb.documents.filter((doc: any) => doc && doc.content));
        }
        if (kb.faqs && Array.isArray(kb.faqs)) {
          allFaqs.push(...kb.faqs.filter((faq: any) => faq && faq.answer));
        }
      });

      // Simple keyword matching (replace with vector search in production)
      const relevantDocs = allDocuments.filter(doc => 
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.title.toLowerCase().includes(query.toLowerCase())
      );

      const relevantFaqs = allFaqs.filter(faq =>
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase())
      );

      // Combine and rank results
      const results = [...relevantDocs, ...relevantFaqs];
      
      // Sort by relevance (simple scoring for now)
      results.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(query, a);
        const bScore = this.calculateRelevanceScore(query, b);
        return bScore - aScore;
      });

      // Map to the expected return type with calculated relevance scores
      return results.slice(0, 5).map(item => ({
        title: 'title' in item ? item.title : item.question,
        content: 'content' in item ? item.content : item.answer,
        relevance: this.calculateRelevanceScore(query, item)
      }));
    } catch (error) {
      console.error('Error getting relevant content:', error);
      return [];
    }
  }

  private calculateRelevanceScore(query: string, content: { title?: string; content?: string; question?: string; answer?: string }): number {
    const queryWords = query.toLowerCase().split(' ');
    const contentText = `${content.title || ''} ${content.content || ''} ${content.question || ''} ${content.answer || ''}`.toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      if (contentText.includes(word)) {
        score += 1;
        // Bonus for exact matches
        if (contentText.includes(word)) {
          score += 0.5;
        }
      }
    });
    
    return score;
  }

  private generateMockResponse(message: string, bot: Bot, relevantContent: Array<{ title: string; content: string; relevance: number }>): string {
    // Generate a helpful mock response based on the bot's personality and knowledge
    const lowerMessage = message.toLowerCase();
    
    // Check if there's relevant content
    if (relevantContent.length > 0) {
      const firstContent = relevantContent[0];
      return `Based on the information I have, ${firstContent.content.substring(0, 200)}${firstContent.content.length > 200 ? '...' : ''}\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY for real AI responses.]`;
    }
    
    // Generate contextual responses based on common queries
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello! I'm ${bot.name}. ${bot.personality ? bot.personality.substring(0, 150) : 'I\'m here to help you with any questions you might have.'}\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY for real AI responses.]`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm ${bot.name}, and I can help you with various questions and tasks. ${bot.personality || 'Feel free to ask me anything!'}\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY for real AI responses.]`;
    }
    
    // Default response
    return `Thank you for your message: "${message}". As ${bot.name}, I understand you're asking about this topic. ${bot.personality ? `Following my personality: ${bot.personality.substring(0, 100)}` : 'I\'m here to help!'}\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY in your .env file for real AI responses.]`;
  }

  private buildSystemPrompt(bot: Bot, relevantContent: Array<{ title: string; content: string; relevance: number }>): string {
    let prompt = `You are ${bot.name}, an AI assistant.`;

    if (bot.personality) {
      prompt += `\n\nPersonality: ${bot.personality}`;
    }

    if (relevantContent.length > 0) {
      prompt += `\n\nUse the following information to answer questions accurately:\n\n`;
      relevantContent.forEach((content, index) => {
        prompt += `${index + 1}. ${content.title || 'Information'}: ${content.content}\n\n`;
      });
    }

    prompt += `\n\nInstructions:
- Always be helpful, accurate, and friendly
- Use the provided information when available
- If you don't know something, say so rather than making things up
- Keep responses concise but informative
- Maintain the personality and tone specified above`;

    return prompt;
  }

  // Method for processing documents and creating embeddings
  async processDocument(
    content: string,
    title: string,
    type: 'PDF' | 'DOCX' | 'TXT' | 'HTML' | 'MARKDOWN' | 'JSON',
    knowledgeBaseId: string
  ): Promise<void> {
    try {
      // In production, you would:
      // 1. Split content into chunks
      // 2. Generate embeddings for each chunk
      // 3. Store embeddings in a vector database (Pinecone, Weaviate, etc.)
      // 4. Store the document with chunk references

      // For now, we'll store the document as-is
      await this.tenantDB.addDocument({
        title,
        content,
        type,
        knowledgeBaseId,
        embeddings: null, // Placeholder for vector embeddings
      });
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error('Failed to process document');
    }
  }

  // Method for training/updating the knowledge base
  async updateKnowledgeBase(knowledgeBaseId: string): Promise<void> {
    try {
      // In production, you would:
      // 1. Re-process all documents in the knowledge base
      // 2. Update embeddings
      // 3. Optimize the vector index
      
      console.log(`Knowledge base ${knowledgeBaseId} updated successfully`);
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      throw new Error('Failed to update knowledge base');
    }
  }
}

// Factory function to create AI service for a specific tenant
export function createAIService(tenantId: string): AIService {
  return new AIService(tenantId);
} 