import * as mammoth from 'mammoth';

// Import pdf-parse more safely to avoid hardcoded path issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
let pdf: { (data: Buffer): Promise<{ text: string; [key: string]: unknown }> } | null;
try {
  // Try dynamic import first
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  pdf = require('pdf-parse');
} catch (error) {
  console.warn('PDF parsing library not available:', error);
  pdf = null;
}

// Temporarily disable PDF support to debug the issue
pdf = null;
console.log('PDF support temporarily disabled for debugging');

export interface ProcessedDocument {
  content: string;
  type: 'PDF' | 'DOCX' | 'TXT' | 'HTML' | 'MARKDOWN' | 'JSON';
  metadata: {
    pages?: number;
    wordCount: number;
    charCount: number;
    extractedAt: string;
  };
}

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    sourceDocument: string;
    documentId: string;
    knowledgeBaseId: string;
    tenantId: string;
    documentType: string;
    createdAt: string;
  };
}

export class DocumentProcessor {
  /**
   * Process different document types and extract text content
   */
  static async processDocument(
    buffer: Buffer,
    fileName: string,
    fileType: string
  ): Promise<ProcessedDocument> {
    const type = this.getDocumentType(fileType);
    
    let content = '';
    let metadata: {
      pages?: number;
      wordCount: number;
      charCount: number;
      extractedAt: string;
    } = {
      wordCount: 0,
      charCount: 0,
      extractedAt: new Date().toISOString()
    };

    try {
      switch (type) {
        case 'PDF':
          if (!pdf) {
            throw new Error('PDF parsing library is not available. Please install it.');
          }
          try {
            const pdfData = await pdf.default(buffer);
            content = pdfData.text;
            metadata = {
              pages: pdfData.numpages,
              wordCount: content.split(/\s+/).length,
              charCount: content.length,
              extractedAt: new Date().toISOString()
            };
          } catch (pdfError) {
            console.error('PDF parsing error:', pdfError);
            throw new Error(`Failed to parse PDF file: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF error'}`);
          }
          break;

        case 'DOCX':
          const docxResult = await mammoth.extractRawText({ buffer });
          content = docxResult.value;
          metadata = {
            wordCount: content.split(/\s+/).length,
            charCount: content.length,
            extractedAt: new Date().toISOString()
          };
          break;

        case 'TXT':
        case 'HTML':
        case 'MARKDOWN':
          content = buffer.toString('utf-8');
          metadata = {
            wordCount: content.split(/\s+/).length,
            charCount: content.length,
            extractedAt: new Date().toISOString()
          };
          break;

        case 'JSON':
          const jsonData = JSON.parse(buffer.toString('utf-8'));
          content = this.extractTextFromJSON(jsonData);
          metadata = {
            wordCount: content.split(/\s+/).length,
            charCount: content.length,
            extractedAt: new Date().toISOString()
          };
          break;

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      return {
        content: content.trim(),
        type,
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to process document ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split document content into chunks for AI processing
   */
  static chunkDocument(
    content: string,
    chunkSize: number = 1000,
    overlap: number = 200
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);
    let currentChunk = '';
    let startIndex = 0;
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + word;

      if (potentialChunk.length > chunkSize && currentChunk) {
        // Create chunk
        chunks.push({
          id: `chunk_${chunkIndex}`,
          content: currentChunk.trim(),
          startIndex,
          endIndex: i - 1,
                  metadata: {
          chunkIndex,
          totalChunks: 0, // Will be updated after all chunks are created
          sourceDocument: 'unknown',
          documentId: '', // Will be set by createAIChunks
          knowledgeBaseId: '', // Will be set by createAIChunks
          tenantId: '', // Will be set by createAIChunks
          documentType: '', // Will be set by createAIChunks
          createdAt: '', // Will be set by createAIChunks
        }
        });

        // Calculate overlap start position
        const overlapWords = currentChunk.split(/\s+/).slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + word;
        startIndex = i - overlapWords.length;
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        startIndex,
        endIndex: words.length - 1,
        metadata: {
          chunkIndex,
          totalChunks: 0,
          sourceDocument: 'unknown',
          documentId: '', // Will be set by createAIChunks
          knowledgeBaseId: '', // Will be set by createAIChunks
          tenantId: '', // Will be set by createAIChunks
          documentType: '', // Will be set by createAIChunks
          createdAt: '', // Will be set by createAIChunks
        }
      });
    }

    // Update total chunks count
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Extract meaningful text from JSON objects
   */
  private static extractTextFromJSON(obj: unknown, depth: number = 0): string {
    if (depth > 10) return ''; // Prevent infinite recursion
    
    if (typeof obj === 'string') {
      return obj;
    } else if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.extractTextFromJSON(item, depth + 1)).join(' ');
    } else if (obj && typeof obj === 'object') {
      const textParts: string[] = [];
      
      // Prioritize common text fields
      const priorityFields = ['text', 'content', 'description', 'title', 'name', 'body'];
      const remainingFields: string[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        if (priorityFields.includes(key)) {
          textParts.push(this.extractTextFromJSON(value, depth + 1));
        } else {
          remainingFields.push(key);
        }
      }
      
      // Add remaining fields
      for (const field of remainingFields) {
        const objRecord = obj as Record<string, unknown>;
        textParts.push(this.extractTextFromJSON(objRecord[field], depth + 1));
      }
      
      return textParts.join(' ');
    }
    
    return '';
  }

  /**
   * Determine document type from MIME type or file extension
   */
  static getDocumentType(fileType: string): 'PDF' | 'DOCX' | 'TXT' | 'HTML' | 'MARKDOWN' | 'JSON' {
    const typeMap: Record<string, 'PDF' | 'DOCX' | 'TXT' | 'HTML' | 'MARKDOWN' | 'JSON'> = {
      'application/pdf': 'PDF',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'text/plain': 'TXT',
      'text/html': 'HTML',
      'text/markdown': 'MARKDOWN',
      'application/json': 'JSON',
      '.pdf': 'PDF',
      '.docx': 'DOCX',
      '.txt': 'TXT',
      '.html': 'HTML',
      '.htm': 'HTML',
      '.md': 'MARKDOWN',
      '.json': 'JSON'
    };

    const normalizedInput = fileType.toLowerCase();
    const result = typeMap[normalizedInput] || 'TXT';
    
    console.log(`getDocumentType: "${fileType}" → "${normalizedInput}" → "${result}"`);
    
    return result;
  }

  /**
   * Clean and normalize text content
   */
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .replace(/\t+/g, ' ') // Replace tabs with spaces
      .trim();
  }

  /**
   * Calculate document statistics
   */
  static calculateStats(content: string) {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(para => para.trim().length > 0);

    return {
      characters: content.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      averageWordsPerSentence: words.length / Math.max(sentences.length, 1),
      averageWordsPerParagraph: words.length / Math.max(paragraphs.length, 1)
    };
  }

  /**
   * Create AI-ready document chunks with metadata
   */
  static createAIChunks(
    content: string,
    documentId: string,
    knowledgeBaseId: string,
    tenantId: string,
    documentType: string,
    chunkSize: number = 1000,
    overlap: number = 200
  ): DocumentChunk[] {
    const chunks = this.chunkDocument(content, chunkSize, overlap);
    
    return chunks.map((chunk, index) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        documentId,
        knowledgeBaseId,
        tenantId,
        documentType,
        createdAt: new Date().toISOString(),
      }
    }));
  }

  /**
   * Clean and prepare text for AI processing
   */
  static prepareForAI(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
      .trim();
  }

  /**
   * Check if PDF processing is available
   */
  static isPDFProcessingAvailable(): boolean {
    const result = pdf !== null;
    console.log(`isPDFProcessingAvailable: ${result} (pdf: ${pdf ? 'loaded' : 'null'})`);
    return result;
  }

  /**
   * Get supported file types
   */
  static getSupportedFileTypes(): string[] {
    // Always return basic supported types for now
    const types = ['TXT', 'HTML', 'MARKDOWN', 'JSON', 'DOCX'];
    
    console.log(`getSupportedFileTypes: ${types.join(', ')}`);
    
    return types;
  }

  /**
   * Check if a file type is supported
   */
  static isFileTypeSupported(fileType: string): boolean {
    const normalizedType = this.getDocumentType(fileType);
    return this.getSupportedFileTypes().includes(normalizedType);
  }
} 