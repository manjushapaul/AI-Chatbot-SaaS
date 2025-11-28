'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Bot, BookOpen } from 'lucide-react';

interface Bot {
  id: string;
  name: string;
  description?: string;
  model?: string;
}

export default function CreateKnowledgeBasePage() {
  const router = useRouter();
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    botId: ''
  });

  // Fetch available bots
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await fetch('/api/bots');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setBots(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching bots:', error);
      }
    };

    fetchBots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.botId) {
      setError('Name and bot selection are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/knowledge-bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Redirect to the new knowledge base or knowledge bases list
          router.push('/dashboard/knowledge-bases');
        } else {
          setError(result.error || 'Failed to create knowledge base');
        }
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to create knowledge base');
      }
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      setError('Failed to create knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          href="/dashboard/knowledge-bases"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-accent-strong" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Knowledge Base</h1>
          <p className="text-gray-600">Add a new knowledge base to train your bot</p>
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

          {/* Bot Selection */}
          <div>
            <label htmlFor="botId" className="block text-sm font-medium text-gray-700 mb-2">
              Connect to Bot <span className="text-accent-strong">*</span>
            </label>
            <select
              id="botId"
              name="botId"
              value={formData.botId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a bot</option>
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name} {bot.description && `- ${bot.description}`}
                </option>
              ))}
            </select>
            {bots.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No bots available. <Link href="/dashboard/bots/create" className="text-accent-strong hover:underline">Create a bot first</Link>.
              </p>
            )}
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
              placeholder="Describe what this knowledge base will contain..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-accent-strong border border-accent-strong rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-white mt-0.5" />
              <div className="text-sm text-white">
                <h4 className="font-medium mb-1">What happens next?</h4>
                <p className="text-white">
                  After creating the knowledge base, you&apos;ll be able to:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-white">
                  <li>Upload documents (PDFs, Word docs, text files)</li>
                  <li>Add custom FAQs and answers</li>
                  <li>Train your bot with this knowledge</li>
                  <li>Test responses based on the content</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/dashboard/knowledge-bases"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.botId}
              className="px-6 py-2 bg-accent-strong text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Create Knowledge Base</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 