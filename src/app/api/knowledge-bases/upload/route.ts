import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getTenantContext } from '../../../../lib/tenant';
import { createTenantDB } from '../../../../lib/db';
import { DocumentProcessor, ProcessedDocument as _ProcessedDocument, DocumentChunk as _DocumentChunk } from '../../../../lib/document-processor';
import { createAIService as _createAIService } from '../../../../lib/ai';
import { embeddingsService as _embeddingsService } from '../../../../lib/embeddings';
import { vectorDB as _vectorDB } from '../../../../lib/vector-db';

// Helper function to get file type from filename
function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const extensionMap: Record<string, string> = {
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'html': 'text/html',
    'htm': 'text/html',
    'md': 'text/markdown',
    'json': 'application/json'
  };
  return extensionMap[extension || ''] || 'text/plain';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    const formData = await request.formData();
    const action = formData.get('action') as string | null;

    // If no action is specified but files are present, treat as document upload
    const files = formData.getAll('files') as File[];
    const knowledgeBaseId = formData.get('knowledgeBaseId') as string | null;

    // Auto-detect action: if files and knowledgeBaseId are present, it's a document upload
    const isDocumentUpload = (!action && files.length > 0 && knowledgeBaseId) || action === 'upload_documents';

    if (action === 'create_knowledge_base') {
      // Handle knowledge base creation
      const kbData = JSON.parse(formData.get('data') as string);
      
      const knowledgeBase = await db.createKnowledgeBase({
        name: kbData.name,
        description: kbData.description,
        botId: kbData.botId,
      });

      return NextResponse.json({
        success: true,
        id: knowledgeBase.id,
        message: 'Knowledge base created successfully'
      });
    }

    if (isDocumentUpload) {
      // Handle document upload
      const kbId = knowledgeBaseId || formData.get('knowledgeBaseId') as string;
      const uploadFiles = files.length > 0 ? files : (formData.getAll('files') as File[]);
      const _chunkSize = parseInt(formData.get('chunkSize') as string) || 1000;
      const _overlap = parseInt(formData.get('overlap') as string) || 200;

      if (!kbId || uploadFiles.length === 0) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Verify knowledge base exists and user has access
      const knowledgeBases = await db.getKnowledgeBases();
      const knowledgeBase = knowledgeBases.find((kb: { id: string }) => kb.id === kbId);
      if (!knowledgeBase) {
        return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
      }

      const results = [];
      const errors = [];

      for (const file of uploadFiles) {
        try {
          // Check if file type is supported
          const fileType = file.type || getFileTypeFromName(file.name);
          console.log(`Processing file: ${file.name}, type: ${fileType}`);
          
          // Get the normalized document type
          const normalizedType = DocumentProcessor.getDocumentType(fileType);
          console.log(`Normalized type: ${normalizedType}`);
          
          // Check if this type is supported
          const supportedTypes = DocumentProcessor.getSupportedFileTypes();
          console.log(`Supported types: ${supportedTypes.join(', ')}`);
          
          if (!supportedTypes.includes(normalizedType)) {
            throw new Error(`File type ${fileType} (${normalizedType}) is not supported. Supported types: ${supportedTypes.join(', ')}`);
          }

          console.log(`File type ${fileType} is supported as ${normalizedType}`);

          // Process the file
          const buffer = Buffer.from(await file.arrayBuffer());
          const processedDoc = await DocumentProcessor.processDocument(
            buffer,
            file.name,
            fileType
          );

          // Create document record
          console.log(`[Upload] Creating document "${file.name}" for KB ${kbId}`);
          const document = await db.addDocument({
            title: file.name,
            content: processedDoc.content,
            type: processedDoc.type,
            knowledgeBaseId: kbId,
          });
          console.log(`[Upload] Document created: ${document.id}, status: ${document.status || 'NOT SET'}`);
          
          // Verify document was created and can be retrieved
          const verifyDoc = await db.getDocumentsByKnowledgeBase(kbId);
          console.log(`[Upload] Verification: Found ${verifyDoc.length} documents in KB ${kbId} after creating document`);

          // For now, skip complex AI processing to avoid errors
          // TODO: Re-enable when embeddings and vector DB are fully configured
          /*
          // Create AI-ready document chunks
          const chunks = DocumentProcessor.createAIChunks(
            processedDoc.content,
            document.id,
            knowledgeBaseId,
            tenant.id,
            processedDoc.type,
            chunkSize,
            overlap
          );

          // Generate embeddings for chunks
          const embeddings = await embeddingsService.generateEmbeddings(chunks);

          // Store chunks and embeddings in vector database
          await vectorDB.storeDocumentChunks(chunks, embeddings.embeddings);
          */

          // Create notification for successful document upload
          try {
            if (session?.user?.id) {
              const preferences = await db.getNotificationPreferences(session.user.id);
              const kbPref = preferences.find(p => p.category === 'kb');
              
              if (!kbPref || kbPref.inAppEnabled) {
                await db.createNotification({
                  userId: session.user.id,
                  type: 'KB',
                  title: 'Document uploaded',
                  message: `Document "${file.name}" has been successfully uploaded to ${knowledgeBase.name}`,
                  category: 'kb',
                  priority: 'LOW',
                  actionUrl: `/dashboard/knowledge-bases/${kbId}`,
                  metadata: {
                    documentId: document.id,
                    documentTitle: file.name,
                    knowledgeBaseId: kbId,
                    knowledgeBaseName: knowledgeBase.name,
                  },
                });
              }
            }
          } catch (notifError) {
            console.error('Failed to create document upload notification:', notifError);
          }

          results.push({
            fileName: file.name,
            documentId: document.id,
            status: 'success',
            chunks: 1, // Simplified for now
            embeddings: 0, // Simplified for now
            cost: 0 // Simplified for now
          });

        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          
          // Create notification for failed document processing
          try {
            if (session?.user?.id) {
              const preferences = await db.getNotificationPreferences(session.user.id);
              const kbPref = preferences.find(p => p.category === 'kb');
              
              if (!kbPref || kbPref.inAppEnabled) {
                await db.createNotification({
                  userId: session.user.id,
                  type: 'KB',
                  title: 'Document processing failed',
                  message: `Failed to process document "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
                  category: 'kb',
                  priority: 'HIGH',
                  actionUrl: `/dashboard/knowledge-bases/${kbId}`,
                  metadata: {
                    fileName: file.name,
                    knowledgeBaseId: kbId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  },
                });
              }
            }
          } catch (notifError) {
            console.error('Failed to create document error notification:', notifError);
          }
          
          errors.push({
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Note: AI processing for embeddings would be implemented here
      // For now, documents are stored without embeddings

      return NextResponse.json({
        success: true,
        results,
        errors,
        totalProcessed: results.length,
        totalErrors: errors.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Knowledge base upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get('knowledgeBaseId');

    if (!knowledgeBaseId) {
      return NextResponse.json({ error: 'Knowledge base ID required' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    const knowledgeBases = await db.getKnowledgeBases();
    const knowledgeBase = knowledgeBases.find((kb: { id: string }) => kb.id === knowledgeBaseId);
    
    if (!knowledgeBase) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Note: These methods don't exist in TenantDB yet
    // const documents = await db.getDocumentsByKnowledgeBase(knowledgeBaseId);
    // const stats = await db.getKnowledgeBaseStats(knowledgeBaseId);

    return NextResponse.json({
      knowledgeBase,
      documents: [], // Placeholder until method is implemented
      stats: {} // Placeholder until method is implemented
    });

  } catch (error) {
    console.error('Knowledge base fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 