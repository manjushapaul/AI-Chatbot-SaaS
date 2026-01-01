'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Plus, FileText, MessageSquare, Bot, Upload, X, Eye } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useTheme } from '@/contexts/ThemeContext';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  botId: string;
  bots?: {
    id: string;
    name: string;
    description?: string;
  };
  bot?: {
    id: string;
    name: string;
    description?: string;
  };
  documents: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category?: string;
    createdAt: string;
  }>;
}

export default function KnowledgeBaseDetailPage() {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string; title: string; type: string; content: string; createdAt: string | Date; [key: string]: unknown } | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const lastFetchTime = useRef<number>(0);

  const knowledgeBaseId = params.id as string;

  // Fetch knowledge base details
  const fetchKnowledgeBase = async (force = false) => {
    // Prevent too frequent refreshes (throttle to at least 500ms apart)
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 500) {
      console.log('[KB Detail] Skipping fetch - too soon since last fetch');
      return;
    }
    lastFetchTime.current = now;

    try {
      setIsLoading(true);
      setError('');
      
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = force ? `?t=${Date.now()}` : '';
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}${cacheBuster}`, {
        cache: 'no-store', // Always fetch fresh data
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(`[KB Detail] Fetched KB "${result.data.name}": ${result.data.documents?.length || 0} documents`);
          setKnowledgeBase(result.data);
        } else {
          setError(result.error || 'Failed to fetch knowledge base');
        }
      } else {
        setError('Failed to fetch knowledge base');
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
      setError('Failed to fetch knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (knowledgeBaseId) {
      fetchKnowledgeBase(true); // Force fetch on mount
    }
  }, [knowledgeBaseId]);

  // Refresh data when page becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && knowledgeBaseId) {
        console.log('[KB Detail] Page became visible, refreshing data...');
        fetchKnowledgeBase();
      }
    };

    const handleFocus = () => {
      if (knowledgeBaseId) {
        console.log('[KB Detail] Window focused, refreshing data...');
        fetchKnowledgeBase(true); // Force refresh on focus
      }
    };

    // Use router events to detect navigation
    const handleRouteChange = () => {
      if (knowledgeBaseId) {
        console.log('[KB Detail] Route changed, refreshing data...');
        // Small delay to ensure route is fully loaded
        setTimeout(() => {
          fetchKnowledgeBase(true); // Force refresh on route change
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [knowledgeBaseId]);

  // Expose refresh function for manual refresh (e.g., from child components)
  useEffect(() => {
    // Store refresh function in window for potential cross-component access
    (window as { refreshKB?: () => void }).refreshKB = fetchKnowledgeBase;
    
    return () => {
      delete (window as { refreshKB?: () => void }).refreshKB;
    };
  }, [knowledgeBaseId]);

  const handleDeleteKnowledgeBase = async () => {
    if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone and will also delete all associated documents and FAQs.')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Knowledge base deleted successfully!');
        setTimeout(() => {
          router.push('/dashboard/knowledge-bases');
        }, 1500);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete knowledge base');
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      setError('Failed to delete knowledge base');
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
        fetchKnowledgeBase();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading knowledge base...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !knowledgeBase) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/knowledge-bases"
            className="text-accent-soft hover:underline text-sm"
          >
            ← Back to Knowledge Bases
          </Link>
        </div>
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-4">Knowledge Base Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">The knowledge base you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/dashboard/knowledge-bases"
            className="rounded-full bg-accent-soft px-5 py-2 text-sm font-medium text-white shadow hover:bg-accent-soft/80 transition-colors"
          >
            Back to Knowledge Bases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/knowledge-bases"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{knowledgeBase.name}</h1>
            <p className="text-sm text-gray-500">{knowledgeBase.description || 'No description provided'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/dashboard/knowledge-bases/${knowledgeBaseId}/edit`}
            className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4 text-gray-600" />
            <span>Edit</span>
          </Link>
          <button
            onClick={handleDeleteKnowledgeBase}
            className="rounded-full bg-amber-50 text-amber-600 border border-amber-100 px-4 py-2 text-sm hover:bg-amber-100 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4 text-amber-600" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
        <StatCard
          icon={<Bot className="w-4 h-4 text-gray-600" />}
          title="Connected Bot"
          value={(knowledgeBase.bots || knowledgeBase.bot)?.name || 'No bot connected'}
          link={(knowledgeBase.bots || knowledgeBase.bot) ? {
            href: `/dashboard/bots/${(knowledgeBase.bots || knowledgeBase.bot)?.id}`,
            text: 'View bot'
          } : undefined}
        />
        <StatCard
          icon={<FileText className="w-4 h-4 text-gray-600" />}
          title="Documents"
          value={knowledgeBase.documents.length}
          link={{
            href: `/dashboard/knowledge-bases/${knowledgeBaseId}/documents`,
            text: knowledgeBase.documents.length > 0 ? 'View all' : 'Upload documents'
          }}
        />
        <StatCard
          icon={<MessageSquare className="w-4 h-4 text-gray-600" />}
          title="FAQs"
          value={knowledgeBase.faqs.length}
          link={{
            href: `/dashboard/knowledge-bases/${knowledgeBaseId}/faqs`,
            text: 'Manage FAQs'
          }}
        />
      </div>

      {/* Documents Section */}
      <SectionCard
        title={
          <div className="flex items-center justify-between w-full">
            <span>Documents</span>
            {knowledgeBase.documents.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({knowledgeBase.documents.length} {knowledgeBase.documents.length === 1 ? 'document' : 'documents'})
              </span>
            )}
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            {knowledgeBase.documents.length > 0 && (
              <Link
                href={`/dashboard/knowledge-bases/${knowledgeBaseId}/documents`}
                className="rounded-full px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 shadow transition-all hover:shadow-md hover:scale-[1.02] flex items-center gap-2"
              >
                <Eye className="w-3 h-3" />
                <span>View All</span>
              </Link>
            )}
            <Link
              href={`/dashboard/knowledge-bases/${knowledgeBaseId}/documents`}
              className={`rounded-full px-4 py-2 text-xs font-medium text-white shadow transition-all hover:shadow-lg hover:scale-[1.02] flex items-center gap-2 ${
                theme === 'dark' 
                  ? 'bg-[#563517e6] hover:bg-[#563517b3]' 
                  : 'bg-accent-soft hover:bg-accent-soft/80'
              }`}
            >
              <Upload className="w-3 h-3 text-white" />
              <span>Upload Document</span>
            </Link>
          </div>
        }
      >
        {knowledgeBase.documents.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No documents yet"
            description="Upload documents to train your bot with this knowledge base."
            action={{
              href: `/dashboard/knowledge-bases/${knowledgeBaseId}/documents`,
              text: 'Upload First Document',
              variant: 'primary'
            }}
          />
        ) : (
          <div className="space-y-3">
            {/* Show first 5 documents, with link to view all if more */}
            {knowledgeBase.documents.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-gray-200 hover:bg-white/80 transition-colors group">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 p-2 bg-accent-soft/10 rounded-lg">
                    <FileText className="w-5 h-5 text-accent-soft" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-accent-soft transition-colors">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc.type} • Added {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button 
                    onClick={() => handleViewDocument(doc.id)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1.5"
                    title="View document content"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button 
                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors flex items-center gap-1.5"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {/* Show "View All Documents" link if there are more than 5 */}
            {knowledgeBase.documents.length > 5 && (
              <div className="pt-2 border-t border-gray-200">
                <Link
                  href={`/dashboard/knowledge-bases/${knowledgeBaseId}/documents`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-accent-soft hover:text-accent-soft/80 transition-colors py-2"
                >
                  <span>View all {knowledgeBase.documents.length} documents</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            )}
            
            {/* Always show link to documents page for full management */}
            {knowledgeBase.documents.length <= 5 && (
              <div className="pt-2 border-t border-gray-200">
                <Link
                  href={`/dashboard/knowledge-bases/${knowledgeBaseId}/documents`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-accent-soft hover:text-accent-soft/80 transition-colors py-2"
                >
                  <span>View and manage all documents</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* FAQs Section */}
      <SectionCard
        title="Frequently Asked Questions"
        action={
          <Link
            href={`/dashboard/knowledge-bases/${knowledgeBaseId}/faqs`}
            className={`rounded-full px-4 py-2 text-sm font-medium text-white shadow transition-all hover:shadow-lg hover:scale-[1.02] flex items-center gap-2 ${
              theme === 'dark' 
                ? 'bg-[#563517e6] hover:bg-[#563517b3]' 
                : 'bg-accent-soft hover:bg-accent-soft/80'
            }`}
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add FAQ</span>
          </Link>
        }
      >
        {knowledgeBase.faqs.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-6 h-6" />}
            title="No FAQs yet"
            description="Add frequently asked questions to help your bot provide better answers."
            action={{
              href: `/dashboard/knowledge-bases/${knowledgeBaseId}/faqs`,
              text: 'Add First FAQ',
              variant: 'primary'
            }}
          />
        ) : (
          <div className="space-y-3">
            {knowledgeBase.faqs.map((faq) => (
              <div key={faq.id} className="border border-gray-200 rounded-xl p-4 bg-white/60">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Q: {faq.question}</h4>
                    <p className="text-sm text-gray-600 mb-2">A: {faq.answer}</p>
                    {faq.category && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mt-2">
                        {faq.category}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Added {new Date(faq.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <Link
                      href={`/dashboard/knowledge-bases/${knowledgeBaseId}/faqs?edit=${faq.id}`}
                      className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
                    >
                      Edit
                    </Link>
                    <button className="text-xs text-red-600 hover:text-red-800 hover:underline">
                      Delete
                    </button>
                  </div>
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
              {selectedDocument.type === 'JSON' ? (
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedDocument.content), null, 2);
                      } catch (e) {
                        return `Invalid JSON format:\n\n${selectedDocument.content}`;
                      }
                    })()}
                  </code>
                </pre>
              ) : selectedDocument.type === 'MARKDOWN' ? (
                  <div className="whitespace-pre-wrap font-mono bg-gray-100 p-4 rounded-lg text-xs">
                    {selectedDocument.content}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-sm text-gray-800">{selectedDocument.content}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
