'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  ArrowLeft,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { UploadCard } from '@/components/dashboard/UploadCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { typography, spacing } from '@/lib/design-tokens';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  content?: string;
}

export default function KnowledgeBaseDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const knowledgeBaseId = params.id as string;

  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Fetch knowledge base details
  const fetchKnowledgeBase = async () => {
    try {
      console.log('[KB Documents Page] Fetching knowledge base:', knowledgeBaseId);
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}`);
      console.log('[KB Documents Page] Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[KB Documents Page] Response data:', result);
        if (result.success) {
          setKnowledgeBase(result.data);
        } else {
          const errorMsg = result.error || 'Failed to fetch knowledge base';
          console.error('[KB Documents Page] API error:', errorMsg);
          setError(errorMsg);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = errorData.error || `Failed to fetch knowledge base (${response.status})`;
        console.error('[KB Documents Page] HTTP error:', response.status, errorMsg);
        setError(errorMsg);
      }
    } catch (error) {
      console.error('[KB Documents Page] Error fetching knowledge base:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch knowledge base. Please try again.');
    }
  };

  // Fetch documents for this knowledge base
  const fetchDocuments = async () => {
    try {
      console.log('[KB Documents Page] Fetching documents for KB:', knowledgeBaseId);
      // Add cache-busting parameter
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/documents${cacheBuster}`, {
        cache: 'no-store', // Always fetch fresh data
      });
      console.log('[KB Documents Page] Documents response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[KB Documents Page] Documents response:', result);
        if (result.success) {
          const docs = result.data || [];
          console.log(`[KB Documents Page] Setting ${docs.length} documents`);
          setDocuments(docs);
        } else {
          console.warn('[KB Documents Page] Documents fetch returned error:', result.error);
          // Don't set error here, just log it - documents might be empty
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[KB Documents Page] Documents HTTP error:', response.status, errorData);
        // Don't set error here, just log it - documents list can be empty
      }
    } catch (error) {
      console.error('[KB Documents Page] Error fetching documents:', error);
      // Don't set error here, just log it - documents list can be empty
    }
  };

  useEffect(() => {
    if (knowledgeBaseId) {
      console.log('[KB Documents Page] Component mounted, KB ID:', knowledgeBaseId);
      setIsLoading(true);
      setError('');
      Promise.all([fetchKnowledgeBase(), fetchDocuments()]).finally(() => {
        setIsLoading(false);
      });
    } else {
      console.error('[KB Documents Page] No knowledge base ID in params');
      setError('Knowledge base ID is missing. Please navigate from a knowledge base page.');
      setIsLoading(false);
    }
  }, [knowledgeBaseId]);

  // Handle file selection - store files but don't upload yet
  const handleFileSelect = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    const files = Array.from(fileList);
    setSelectedFiles(prev => {
      // Avoid duplicates by checking file name and size
      const existingNames = new Set(prev.map(f => `${f.name}-${f.size}`));
      const newFiles = files.filter(f => !existingNames.has(`${f.name}-${f.size}`));
      return [...prev, ...newFiles];
    });
    setError('');
    setSuccess('');
  }, []);

  // Remove a selected file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Save/Upload the selected files
  const handleSaveDocuments = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      // Add all selected files
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      formData.append('knowledgeBaseId', knowledgeBaseId);

      const response = await fetch('/api/knowledge-bases/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess(`Successfully uploaded ${selectedFiles.length} document(s)!`);
          // Clear selected files
          setSelectedFiles([]);
          
          // Wait a moment for the database to be fully updated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Refresh documents list with cache busting
          await fetchDocuments();
          
          // Trigger refresh on the detail page if it's open
          if (typeof window !== 'undefined' && (window as { refreshKB?: () => void }).refreshKB) {
            // Wait a bit more before triggering refresh
            setTimeout(() => {
              (window as unknown as { refreshKB: () => void }).refreshKB();
            }, 500);
          }
          
          // Also trigger a router refresh to ensure Next.js cache is updated
          router.refresh();
        } else {
          setError(result.error || 'Failed to upload documents');
        }
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedDocument(result.data);
          setIsDocumentModalOpen(true);
        } else {
          setError(result.error || 'Failed to fetch document');
        }
      } else {
        setError('Failed to fetch document');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Failed to fetch document');
    }
  };

  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${documentTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Document deleted successfully!');
        await fetchDocuments();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'TRAINED':
        return 'text-emerald-600 bg-emerald-50';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50';
      case 'ERROR':
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <AppPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-soft mx-auto mb-4"></div>
            <p className={typography.body}>Loading...</p>
          </div>
        </div>
      </AppPage>
    );
  }

  if (error && !knowledgeBase) {
    return (
      <AppPage>
        <div className="text-center py-12">
          <p className={`${typography.body} text-red-600 mb-4`}>{error}</p>
          <Link
            href="/dashboard/knowledge-bases"
            className="inline-flex items-center text-accent-soft hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Bases
          </Link>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div>
          <Link
            href={`/dashboard/knowledge-bases/${knowledgeBaseId}`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors mb-4"
            onClick={() => {
              // Trigger refresh on the detail page when navigating back
              setTimeout(() => {
          if (typeof window !== 'undefined' && (window as unknown as { refreshKB?: () => void }).refreshKB) {
            (window as unknown as { refreshKB: () => void }).refreshKB();
          }
                router.refresh();
              }, 100);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to &quot;{knowledgeBase?.name || 'Knowledge Base'}&quot;
          </Link>
          <div>
            <h1 className={typography.pageTitle}>Upload Documents</h1>
            <p className={typography.pageSubtitle}>
              Add or manage documents for this knowledge base
            </p>
            {knowledgeBase && (
              <p className={`${typography.helperTextLarge} mt-2`}>
                These documents will be used to train the &quot;{knowledgeBase.name}&quot; knowledge base.
              </p>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Section */}
        <SectionCard title="Upload Documents">
          {isUploading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-soft mx-auto mb-4" />
                <p className={typography.body}>Uploading documents...</p>
              </div>
            </div>
          ) : (
            <>
              <UploadCard
                icon={<Upload className="w-6 h-6" />}
                headline="Drop files here or click to upload"
                helperText="Supported formats:DOCX, TXT, HTML, MARKDOWN, JSON. Maximum file size: 10MB per file."
                onFileSelect={handleFileSelect}
                accept=".docx,.txt,.html,.md,.json"
                multiple={true}
                useLargeTypography={true}
              />
              
              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Selected Files ({selectedFiles.length})
                    </h3>
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 p-2 bg-accent-soft/10 rounded-lg">
                            <FileText className="w-4 h-4 text-accent-soft" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="flex-shrink-0 ml-3 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedFiles([])}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDocuments}
                      disabled={isUploading}
                      className="px-6 py-2 text-sm font-medium text-white bg-accent-soft rounded-lg hover:bg-accent-soft/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Save Documents</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Existing Documents List */}
        <SectionCard title="Existing Documents">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={typography.body}>No documents uploaded yet</p>
              <p className={typography.helperTextLarge}>Upload your first document above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-gray-200 hover:bg-white/80 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">{doc.type}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          Updated {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button 
                      onClick={() => handleViewDocument(doc.id)}
                      className="text-xs text-gray-600 hover:text-gray-900 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button 
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Document Viewer Modal */}
        {isDocumentModalOpen && selectedDocument && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/60 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{selectedDocument.title}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span>Type: {selectedDocument.type}</span>
                      <span>Status: {selectedDocument.status}</span>
                      <span>Added: {new Date(selectedDocument.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDocumentModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="prose max-w-none">
                  {selectedDocument.type === 'JSON' && selectedDocument.content ? (
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                      <code>{JSON.stringify(JSON.parse(selectedDocument.content), null, 2)}</code>
                    </pre>
                  ) : selectedDocument.type === 'MARKDOWN' && selectedDocument.content ? (
                    <div className="whitespace-pre-wrap font-mono bg-gray-100 p-4 rounded-lg text-xs">
                      {selectedDocument.content}
                    </div>
                  ) : selectedDocument.content ? (
                    <div className="whitespace-pre-wrap text-sm text-gray-800">{selectedDocument.content}</div>
                  ) : (
                    <p className={typography.body}>Document content not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}

