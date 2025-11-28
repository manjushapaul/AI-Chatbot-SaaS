'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Loader2 } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { KnowledgeBaseCard } from '@/components/dashboard/KnowledgeBaseCard';
import { typography, spacing } from '@/lib/design-tokens';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  bot: {
    name: string;
  };
  documents: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export default function KnowledgeBasesPage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch knowledge bases from API
  const fetchKnowledgeBases = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/knowledge-bases');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setKnowledgeBases(result.data);
        } else {
          setError(result.error || 'Failed to fetch knowledge bases');
        }
      } else {
        setError('Failed to fetch knowledge bases');
      }
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      setError('Failed to fetch knowledge bases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  const handleDeleteKnowledgeBase = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-bases/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setKnowledgeBases(prev => prev.filter(kb => kb.id !== id));
        setSuccess('Knowledge base deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete knowledge base');
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      alert('Failed to delete knowledge base');
    }
  };

  if (isLoading) {
    return (
      <AppPage>
        <div className={spacing.pageBlock}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={typography.pageTitle}>Knowledge Bases</h1>
              <p className={typography.pageSubtitle}>Loading knowledge bases...</p>
            </div>
            <Link
              href="/dashboard/knowledge-bases/create"
              className="bg-accent-soft text-white px-4 py-2 rounded-full hover:bg-accent-soft/80 transition-colors flex items-center space-x-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Knowledge Base</span>
            </Link>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <span className={`ml-2 ${typography.pageSubtitle}`}>Loading knowledge bases...</span>
          </div>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={typography.pageTitle}>Knowledge Bases</h1>
            <p className={typography.pageSubtitle}>Manage your bot&apos;s knowledge and training data</p>
          </div>
          <Link
            href="/dashboard/knowledge-bases/create"
            className="bg-accent-soft text-white hover:bg-accent-soft/80 rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Knowledge Base</span>
          </Link>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Knowledge Bases List */}
        {knowledgeBases.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className={`text-lg font-medium text-gray-900 mb-2`}>No knowledge bases yet</h3>
            <p className={`${typography.pageSubtitle} mb-6`}>
              Create your first knowledge base to start training your bots with custom information.
            </p>
            <Link
              href="/dashboard/knowledge-bases/create"
              className="bg-accent-soft text-white px-4 py-2 rounded-full hover:bg-accent-soft/80 transition-colors inline-flex items-center space-x-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Your First Knowledge Base</span>
            </Link>
          </div>
        ) : (
          <div className={spacing.list}>
            {knowledgeBases.map((kb) => (
              <KnowledgeBaseCard
                key={kb.id}
                id={kb.id}
                name={kb.name}
                description={kb.description}
                status={kb.status}
                linkedBots={kb.bot.name}
                documentCount={kb.documents.length}
                onDelete={handleDeleteKnowledgeBase}
              />
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}
