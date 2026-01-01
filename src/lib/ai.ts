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
  config?: {
    systemPrompt?: string;
    [key: string]: unknown;
  };
}

export class AIService {
  private tenantDB: ReturnType<typeof createTenantDB>;
  // GPT-3.5-turbo context limit
  private readonly MAX_CONTEXT_TOKENS = 16385;
  // Reserve tokens for system prompt overhead and response
  private readonly RESERVED_TOKENS = 2000;
  // Rough estimate: ~4 characters per token
  private readonly CHARS_PER_TOKEN = 4;

  constructor(tenantId: string) {
    this.tenantDB = createTenantDB(tenantId);
  }

  /**
   * Estimate token count from text (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token, with some overhead for formatting
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Truncate text to fit within token limit
   */
  private truncateToTokens(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    // Truncate to approximately maxTokens
    const maxChars = maxTokens * this.CHARS_PER_TOKEN;
    return text.substring(0, maxChars) + '...';
  }

  async chat(
    message: string,
    conversationId: string,
    botId: string
  ): Promise<ChatResponse> {
    let adjustedMaxTokens = 1000; // Default value
    
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
      console.log(`[AIService.chat] Retrieved ${relevantContent.length} relevant content items for query: "${message}"`);
      
      if (relevantContent.length === 0) {
        console.warn(`[AIService.chat] No relevant content found for bot ${botId}. Checking knowledge bases...`);
        const allKBs = await this.tenantDB.getKnowledgeBases(botId);
        console.log(`[AIService.chat] Bot ${botId} has ${allKBs?.length || 0} knowledge bases`);
        if (allKBs && allKBs.length > 0) {
          allKBs.forEach((kb: { id: string; name: string; documents?: unknown[]; faqs?: unknown[] }) => {
            console.log(`[AIService.chat] KB "${kb.name}" (${kb.id}): ${kb.documents?.length || 0} docs, ${kb.faqs?.length || 0} FAQs`);
          });
        }
      }

      // Build system prompt with bot personality and knowledge
      // Extract only the fields needed for Bot interface
      const botForPrompt: Bot = {
        id: bot.id,
        name: bot.name,
        personality: bot.personality || undefined,
        model: bot.model || undefined,
        temperature: bot.temperature || undefined,
        maxTokens: bot.maxTokens || undefined,
        config: bot.config ? (bot.config as { systemPrompt?: string; [key: string]: unknown }) : undefined,
      };
      let systemPrompt = this.buildSystemPrompt(botForPrompt, relevantContent);
      
      // Get conversation history and prepare messages
      const conversationMessages = (conversation.messages || []).map((msg: { role: string; content: string }) => {
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
      });

      // Calculate available tokens for messages
      const requestedMaxTokens = bot.maxTokens || 1000;
      const userMessageTokens = this.estimateTokens(message);
      
      // Reserve tokens for: system prompt, user message, maxTokens for response, and overhead
      const availableTokensForHistory = this.MAX_CONTEXT_TOKENS - this.RESERVED_TOKENS - requestedMaxTokens - userMessageTokens;
      
      // Truncate system prompt if needed (limit to ~4000 tokens)
      const systemPromptTokens = this.estimateTokens(systemPrompt);
      const maxSystemPromptTokens = 4000;
      if (systemPromptTokens > maxSystemPromptTokens) {
        systemPrompt = this.truncateToTokens(systemPrompt, maxSystemPromptTokens);
        console.warn(`System prompt truncated from ${systemPromptTokens} to ~${maxSystemPromptTokens} tokens`);
      }
      
      // Truncate conversation history if needed
      const truncatedHistory: ChatMessage[] = [];
      let historyTokens = 0;
      
      // Process messages in reverse order (most recent first) to keep recent context
      const reversedMessages = [...conversationMessages].reverse();
      for (const msg of reversedMessages) {
        const msgTokens = this.estimateTokens(msg.content);
        if (historyTokens + msgTokens <= availableTokensForHistory) {
          truncatedHistory.unshift(msg); // Add to beginning to maintain order
          historyTokens += msgTokens;
        } else {
          // If we can't fit this message, stop
          break;
        }
      }
      
      if (conversationMessages.length > truncatedHistory.length) {
        console.warn(`Conversation history truncated from ${conversationMessages.length} to ${truncatedHistory.length} messages`);
      }

      // Calculate actual available tokens for response
      const systemTokens = this.estimateTokens(systemPrompt);
      const historyTokensTotal = truncatedHistory.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
      const totalInputTokens = systemTokens + historyTokensTotal + userMessageTokens;
      const availableForResponse = this.MAX_CONTEXT_TOKENS - totalInputTokens - 100; // 100 token buffer
      
      // Adjust maxTokens to fit within context limit
      adjustedMaxTokens = Math.min(requestedMaxTokens, Math.max(100, availableForResponse));
      
      if (adjustedMaxTokens < requestedMaxTokens) {
        console.warn(`Max tokens adjusted from ${requestedMaxTokens} to ${adjustedMaxTokens} to fit within context limit`);
      }

      // Prepare final messages array
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...truncatedHistory,
        { role: 'user', content: message },
      ];

      // Validate OpenAI API key and client
      if (!openai || !process.env.OPENAI_API_KEY) {
        // Provide a mock response when API key is not configured
        console.warn('⚠️  OpenAI API key not configured. Using mock response. Add OPENAI_API_KEY to your .env file for real AI responses.');
        const botForMock: Bot = {
          id: bot.id,
          name: bot.name,
          personality: bot.personality || undefined,
          model: bot.model || undefined,
          temperature: bot.temperature || undefined,
          maxTokens: bot.maxTokens || undefined,
          config: bot.config ? (bot.config as { systemPrompt?: string; [key: string]: unknown }) : undefined,
        };
        const mockResponse = this.generateMockResponse(message, botForMock, relevantContent);
        
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

      // Call OpenAI API with adjusted maxTokens
      const completion = await openai.chat.completions.create({
        model: bot.model || 'gpt-3.5-turbo',
        messages,
        temperature: bot.temperature || 0.7,
        max_tokens: adjustedMaxTokens,
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
            const botForMock: Bot = {
              id: bot.id,
              name: bot.name,
              personality: bot.personality || undefined,
              model: bot.model || undefined,
              temperature: bot.temperature || undefined,
              maxTokens: bot.maxTokens || undefined,
              config: bot.config ? (bot.config as { systemPrompt?: string; [key: string]: unknown }) : undefined,
            };
            const mockResponse = this.generateMockResponse(message, botForMock, relevantContent);
            
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
      console.log(`[getRelevantContent] Searching for: "${query}" in bot: ${botId}`);
      
      // Get all knowledge bases for the bot
      const knowledgeBases = await this.tenantDB.getKnowledgeBases(botId);
      
      console.log(`[getRelevantContent] Found ${knowledgeBases?.length || 0} knowledge bases for bot ${botId}`);
      
      if (!knowledgeBases || !knowledgeBases.length) {
        console.warn(`[getRelevantContent] No knowledge bases found for bot ${botId}`);
        return [];
      }

      // Collect all documents and FAQs from all knowledge bases
      const allDocuments: Document[] = [];
      const allFaqs: FAQ[] = [];

      knowledgeBases.forEach((kb: { 
        id: string;
        name: string;
        documents?: Array<{ 
          id?: string;
          title?: string;
          content?: string; 
          status?: string;
          [key: string]: unknown 
        }>; 
        faqs?: Array<{ 
          id?: string;
          question?: string;
          answer?: string; 
          status?: string;
          [key: string]: unknown 
        }>; 
        [key: string]: unknown 
      }) => {
        console.log(`[getRelevantContent] KB "${kb.name}" (${kb.id}): ${kb.documents?.length || 0} docs, ${kb.faqs?.length || 0} FAQs`);
        
        // Safely handle documents - only include ACTIVE documents with content
        if (kb.documents && Array.isArray(kb.documents)) {
          const activeDocs = kb.documents.filter((doc: { 
            content?: string; 
            status?: string;
            [key: string]: unknown 
          }) => {
            const hasContent = doc && doc.content && doc.content.trim().length > 0;
            const isActive = doc.status === 'ACTIVE' || doc.status === undefined; // Default to active if status not set
            if (!hasContent) {
              console.warn(`[getRelevantContent] Document ${doc.id || 'unknown'} has no content`);
            }
            return hasContent && isActive;
          });
          allDocuments.push(...activeDocs as Document[]);
          console.log(`[getRelevantContent] Added ${activeDocs.length} active documents from KB "${kb.name}"`);
        }
        
        // Safely handle FAQs - only include ACTIVE FAQs with answers
        if (kb.faqs && Array.isArray(kb.faqs)) {
          const activeFaqs = kb.faqs.filter((faq: { 
            answer?: string; 
            status?: string;
            [key: string]: unknown 
          }) => {
            const hasAnswer = faq && faq.answer && faq.answer.trim().length > 0;
            const isActive = faq.status === 'ACTIVE' || faq.status === undefined;
            return hasAnswer && isActive;
          });
          allFaqs.push(...activeFaqs as FAQ[]);
          console.log(`[getRelevantContent] Added ${activeFaqs.length} active FAQs from KB "${kb.name}"`);
        }
      });

      console.log(`[getRelevantContent] Total: ${allDocuments.length} documents, ${allFaqs.length} FAQs`);

      // Normalize query for better matching (remove special chars, handle variations)
      const normalizedQuery = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
      
      const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0);

      // Improved search: check for keyword matches, partial matches, and related terms
      const relevantDocs = allDocuments.filter(doc => {
        if (!doc.content || !doc.title) return false;
        
        const docText = `${doc.title} ${doc.content}`.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ');
        
        // Check if any query word appears in the document
        return queryWords.some(word => {
          if (word.length < 2) return false;
          return docText.includes(word) || 
                 doc.title.toLowerCase().includes(word);
        });
      });

      const relevantFaqs = allFaqs.filter(faq => {
        if (!faq.question || !faq.answer) return false;
        
        const faqText = `${faq.question} ${faq.answer}`.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ');
        
        return queryWords.some(word => {
          if (word.length < 2) return false;
          return faqText.includes(word);
        });
      });

      console.log(`[getRelevantContent] Found ${relevantDocs.length} relevant docs, ${relevantFaqs.length} relevant FAQs`);

      // If no exact matches, return all content (fallback) - at least give the bot something to work with
      const results = relevantDocs.length > 0 || relevantFaqs.length > 0
        ? [...relevantDocs, ...relevantFaqs]
        : [...allDocuments.slice(0, 3), ...allFaqs.slice(0, 2)]; // Fallback: return first few items
      
      // Sort by relevance score
      results.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(normalizedQuery, a);
        const bScore = this.calculateRelevanceScore(normalizedQuery, b);
        return bScore - aScore;
      });

      const finalResults = results.slice(0, 5).map(item => ({
        title: 'title' in item ? (item.title || 'Untitled') : (item.question || 'FAQ'),
        content: 'content' in item ? (item.content || '') : (item.answer || ''),
        relevance: this.calculateRelevanceScore(normalizedQuery, item)
      }));

      console.log(`[getRelevantContent] Returning ${finalResults.length} results`);
      return finalResults;
    } catch (error) {
      console.error('[getRelevantContent] Error getting relevant content:', error);
      if (error instanceof Error) {
        console.error('[getRelevantContent] Error details:', error.message, error.stack);
      }
      return [];
    }
  }

  private calculateRelevanceScore(query: string, content: { title?: string; content?: string; question?: string; answer?: string }): number {
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 0);
    const contentText = `${content.title || ''} ${content.content || ''} ${content.question || ''} ${content.answer || ''}`
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ');
    
    let score = 0;
    queryWords.forEach(word => {
      if (word.length < 2) return;
      
      // Check title first (higher weight)
      const titleText = (content.title || '').toLowerCase();
      if (titleText.includes(word)) {
        score += 3; // Title matches are very important
      }
      
      // Check question (for FAQs)
      const questionText = (content.question || '').toLowerCase();
      if (questionText.includes(word)) {
        score += 2; // Question matches are important
      }
      
      // Check content/answer
      if (contentText.includes(word)) {
        score += 1;
        
        // Bonus for multiple occurrences
        const occurrences = (contentText.match(new RegExp(word, 'g')) || []).length;
        if (occurrences > 1) {
          score += 0.5 * (occurrences - 1);
        }
      }
    });
    
    return score;
  }

  private generateMockResponse(message: string, bot: Bot, relevantContent: Array<{ title: string; content: string; relevance: number }>): string {
    // Generate a helpful mock response based on the bot's personality and knowledge
    const lowerMessage = message.toLowerCase();
    
    // Check if there's relevant content from knowledge base
    if (relevantContent.length > 0) {
      const firstContent = relevantContent[0];
      return `Based on the information in my knowledge base: ${firstContent.content.substring(0, 200)}${firstContent.content.length > 200 ? '...' : ''}\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY for real AI responses.]`;
    }
    
    // If no knowledge base content, inform user we can only answer based on KB
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello! I'm ${bot.name}. I can only answer questions based on the information in my knowledge base. Currently, I don't have any information available.\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY for real AI responses.]`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm ${bot.name}. I can only answer questions based on the information in my knowledge base. Currently, I don't have any information available.\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY for real AI responses.]`;
    }
    
    // Default response - only answer from knowledge base
    return `I can only answer questions based on the information in my knowledge base. I don't have information about that topic.\n\n[Note: This is a mock response. Please configure OPENAI_API_KEY in your .env file for real AI responses.]`;
  }

  private buildSystemPrompt(bot: Bot, relevantContent: Array<{ title: string; content: string; relevance: number }>): string {
    let prompt = `You are ${bot.name}, an AI assistant.`;

    if (bot.personality) {
      prompt += `\n\nPersonality: ${bot.personality}`;
    }

    // Check if bot has a custom system prompt in config
    if (bot.config?.systemPrompt) {
      prompt += `\n\n${bot.config.systemPrompt}`;
    }

    if (relevantContent.length > 0) {
      prompt += `\n\nIMPORTANT: You MUST ONLY use the following information from the Knowledge Base to answer questions. Do NOT use any information outside of what is provided below:\n\n`;
      relevantContent.forEach((content, index) => {
        prompt += `${index + 1}. ${content.title || 'Information'}: ${content.content}\n\n`;
      });
      
      prompt += `\n\nCRITICAL RULES:
- You MUST ONLY answer questions based on the information provided above from the Knowledge Base (FAQs and documents)
- If a question cannot be answered using the provided information, politely decline and say: "I can only answer questions based on the information in my knowledge base. I don't have information about that topic."
- DO NOT make up information, speculate, or use knowledge from outside the provided content
- DO NOT answer questions about topics not covered in the Knowledge Base
- If the provided information doesn't contain enough detail to answer a question, say so clearly
- Keep responses concise but informative
- Maintain the personality and tone specified above`;
    } else {
      // No knowledge base content available
      prompt += `\n\nIMPORTANT: You do not have access to any Knowledge Base content. You should politely inform users that you can only answer questions based on information in your knowledge base, and currently no information is available.`;
    }

    return prompt;
  }

  // Method for processing documents and creating embeddings
  async processDocument(
    content: string,
    title: string,
    type: 'DOCX' | 'TXT' | 'HTML' | 'MARKDOWN' | 'JSON',
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
        embeddings: undefined, // Placeholder for vector embeddings
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