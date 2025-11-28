'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Bot, BookOpen } from 'lucide-react';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  bot: {
    id: string;
    name: string;
    description?: string;
  };
}

export default function EditKnowledgeBasePage() {
  const params = useParams();
  const router = useRouter();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const knowledgeBaseId = params.id as string;

  // Fetch knowledge base details
  const fetchKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setKnowledgeBase(result.data);
          setFormData({
            name: result.data.name,
            description: result.data.description || ''
          });
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
      fetchKnowledgeBase();
    }
  }, [knowledgeBaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Redirect back to the knowledge base detail page
          router.push(`/dashboard/knowledge-bases/${knowledgeBaseId}`);
        } else {
          setError(result.error || 'Failed to update knowledge base');
        }
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update knowledge base');
      }
    } catch (error) {
      console.error('Error updating knowledge base:', error);
      setError('Failed to update knowledge base');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  if (error && !knowledgeBase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/dashboard/knowledge-bases"
            className="text-accent-strong hover:underline"
          >
            ← Back to Knowledge Bases
          </Link>
        </div>
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Knowledge Base Not Found</h1>
          <p className="text-gray-600 mb-6">The knowledge base you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/dashboard/knowledge-bases"
            className="bg-accent-strong text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors"
          >
            Back to Knowledge Bases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          href={`/dashboard/knowledge-bases/${knowledgeBaseId}`}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Knowledge Base</h1>
          <p className="text-gray-600">Update your knowledge base information</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Bot Information (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Bot className="w-5 h-5 text-accent-strong" />
              <h3 className="font-medium text-gray-900">Connected Bot</h3>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">{knowledgeBase.bot.name}</p>
            <p className="text-sm text-gray-600">
              {knowledgeBase.bot.description || 'No description'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Note: You cannot change which bot this knowledge base is connected to.
            </p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Knowledge Base Name <span className="text-accent-strong">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g., Product Documentation, Company Policies"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Describe what this knowledge base contains..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-accent-strong border border-accent-strong rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-white mt-0.5" />
              <div className="text-sm text-white">
                <h4 className="font-medium mb-1">What you can edit:</h4>
                <ul className="list-disc list-inside space-y-1 text-white">
                  <li>Knowledge base name and description</li>
                  <li>Documents and FAQs (in separate sections)</li>
                  <li>Bot connection (cannot be changed)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href={`/dashboard/knowledge-bases/${knowledgeBaseId}`}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving || !formData.name.trim()}
              className="px-6 py-2 bg-accent-strong text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 