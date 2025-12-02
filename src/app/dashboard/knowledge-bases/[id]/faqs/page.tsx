'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Edit, Trash2, MessageSquare } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  createdAt: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
}

export default function ManageFAQSPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: ''
  });

  const knowledgeBaseId = params.id as string;

  // Fetch knowledge base and FAQs
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setKnowledgeBase(result.data);
          setFaqs(result.data.faqs || []);
        } else {
          setError(result.error || 'Failed to fetch knowledge base');
        }
      } else {
        setError('Failed to fetch knowledge base');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (knowledgeBaseId) {
      fetchData();
    }
  }, [knowledgeBaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Question and answer are required');
      return;
    }

    try {
      if (editingFAQ) {
        // Update existing FAQ
        const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/faqs/${editingFAQ.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setSuccess('FAQ updated successfully!');
          setEditingFAQ(null);
          setFormData({ question: '', answer: '', category: '' });
          setShowAddForm(false);
          fetchData(); // Refresh the list
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to update FAQ');
        }
      } else {
        // Create new FAQ
        const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/faqs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setSuccess('FAQ added successfully!');
          setFormData({ question: '', answer: '', category: '' });
          setShowAddForm(false);
          fetchData(); // Refresh the list
        } else {
          const result = await response.json();
          setError(result.error || 'Failed to add FAQ');
        }
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setError('Failed to save FAQ');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/faqs/${faqId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('FAQ deleted successfully!');
        fetchData(); // Refresh the list
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      setError('Failed to delete FAQ');
    }
  };

  const handleCancel = () => {
    setEditingFAQ(null);
    setFormData({ question: '', answer: '', category: '' });
    setShowAddForm(false);
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
          <p className="text-gray-600">Loading FAQs...</p>
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
            href={`/dashboard/knowledge-bases/${knowledgeBaseId}`}
            className="text-accent-strong hover:underline"
          >
            ← Back to Knowledge Base
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/knowledge-bases/${knowledgeBaseId}`}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage FAQs</h1>
            <p className="text-gray-600">{knowledgeBase.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className={`rounded-full text-white px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors ${
            theme === 'dark'
              ? 'bg-[#563517e6] hover:bg-[#563517b3]'
              : 'bg-accent-soft hover:bg-accent-soft/80'
          }`}
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add FAQ</span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Add/Edit FAQ Form */}
      {showAddForm && (
        <div className="bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-2xl mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  Question <span className="text-accent-strong">*</span>
                </label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  required
                  placeholder="What is your question?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                  Answer <span className="text-accent-strong">*</span>
                </label>
                <textarea
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Provide a clear and helpful answer..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., General, Technical, Billing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-full text-white px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#563517e6] hover:bg-[#563517b3]'
                      : 'bg-accent-soft hover:bg-accent-soft/80'
                  }`}
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>{editingFAQ ? 'Update FAQ' : 'Add FAQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQs List */}
      <div className="bg-white/20 backdrop-blur-md rounded-lg border border-white/30 shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
          <p className="text-gray-600 mt-1">Manage the questions and answers for your knowledge base</p>
        </div>
        
        {faqs.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4 text-accent-strong" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs yet</h3>
            <p className="text-gray-600 mb-4">
              Add frequently asked questions to help your bot provide better answers.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className={`rounded-full text-white px-4 py-2 text-sm font-medium inline-flex items-center space-x-2 transition-colors ${
                theme === 'dark'
                  ? 'bg-[#563517e6] hover:bg-[#563517b3]'
                  : 'bg-accent-soft hover:bg-accent-soft/80'
              }`}
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add First FAQ</span>
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Q: {faq.question}</h4>
                      <p className="text-gray-600 mb-2">A: {faq.answer}</p>
                      {faq.category && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {faq.category}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Added {new Date(faq.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="text-accent-strong hover:text-blue-800 text-sm flex items-center space-x-1"
                      >
                        <Edit className="w-3 h-3 text-accent-strong" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="text-accent-strong hover:text-red-800 text-sm flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3 text-accent-strong" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 