'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Trash2, Play, Bot, Settings } from 'lucide-react';

interface Bot {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  personality?: string;
}

interface TrainingProgress {
  stage: 'uploading' | 'processing' | 'training' | 'complete';
  message: string;
  progress: number;
}

export default function CreateKnowledgeBasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [availableBots, setAvailableBots] = useState<Bot[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);

  // Form state - all values are dynamic now
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    botId: '',
    chunkSize: 1000, // This is a reasonable default, but user can change
    chunkOverlap: 200, // This is a reasonable default, but user can change
    temperature: 0.7, // Will be overridden by selected bot
    model: ''
  });

  // Fetch available bots
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await fetch('/api/bots');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAvailableBots(result.data);
            console.log('Available bots:', result.data);
          } else {
            console.error('Failed to fetch bots:', result.error);
          }
        } else {
          console.error('Bots API response not ok:', response.status);
        }
      } catch (error) {
        console.error('Error fetching bots:', error);
      }
    };
    fetchBots();
  }, []);

  // Update form when bot is selected
  useEffect(() => {
    if (formData.botId) {
      const selectedBot = availableBots.find(bot => bot.id === formData.botId);
      if (selectedBot) {
        setFormData(prev => ({
          ...prev,
          model: selectedBot.model,
          temperature: selectedBot.temperature
        }));
      }
    }
  }, [formData.botId, availableBots]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Knowledge base name is required');
      return false;
    }
    if (!formData.botId) {
      setError('Please select a bot to connect');
      return false;
    }
    if (selectedFiles.length === 0) {
      setError('Please select at least one document to upload');
      return false;
    }
    return true;
  };

  const startTraining = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');
    setTrainingProgress({
      stage: 'uploading',
      message: 'Uploading documents...',
      progress: 0
    });

    try {
      // Step 1: Create knowledge base
      setTrainingProgress({
        stage: 'uploading',
        message: 'Creating knowledge base...',
        progress: 10
      });

      const kbResponse = await fetch('/api/knowledge-bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          botId: formData.botId
        })
      });

      if (!kbResponse.ok) {
        throw new Error('Failed to create knowledge base');
      }

      const kbResult = await kbResponse.json();
      const knowledgeBaseId = kbResult.data.id;

      // Step 2: Upload documents
      setTrainingProgress({
        stage: 'processing',
        message: 'Processing documents...',
        progress: 30
      });

      const formDataUpload = new FormData();
      formDataUpload.append('action', 'upload_documents');
      formDataUpload.append('knowledgeBaseId', knowledgeBaseId);
      formDataUpload.append('chunkSize', formData.chunkSize.toString());
      formDataUpload.append('overlap', formData.chunkOverlap.toString());

      selectedFiles.forEach(file => {
        formDataUpload.append('files', file);
      });

      const uploadResponse = await fetch('/api/knowledge-bases/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload documents');
      }

      // Step 3: Start AI training
      setTrainingProgress({
        stage: 'training',
        message: 'Training AI model...',
        progress: 70
      });

      // Simulate AI training (replace with actual AI training call)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setTrainingProgress({
        stage: 'complete',
        message: 'Training complete!',
        progress: 100
      });

      setSuccess('Knowledge base created and trained successfully!');
      
      // Redirect to the new knowledge base
      setTimeout(() => {
        router.push(`/dashboard/knowledge-bases/${knowledgeBaseId}`);
      }, 2000);

    } catch (error) {
      console.error('Training error:', error);
      setError(error instanceof Error ? error.message : 'Training failed');
    } finally {
      setIsLoading(false);
      setTrainingProgress(null);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/knowledge-bases"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Bases
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create & Train Knowledge Base</h1>
          <p className="text-gray-600 mt-2">
            Upload documents and train your AI chatbot with company knowledge
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-accent-strong mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-accent-strong mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Training Progress */}
        {trainingProgress && (
          <div className="mb-6 bg-accent-strong/50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-800 font-medium">{trainingProgress.message}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-accent-strong text-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${trainingProgress.progress}%` }}
              ></div>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              Progress: {trainingProgress.progress}%
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Document Upload */}
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-400 transition-colors shadow-2xl">
              <div
                className={`${isDragOver ? 'border-blue-400 bg-accent-strong/50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-gray-500 mb-4">
                  Support for TXT, HTML, MARKDOWN, JSON, and DOCX files
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-accent-strong text-white rounded-lg hover:opacity-90 cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept=".txt,.html,.htm,.md,.json,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="bg-white/20 backdrop-blur-md rounded-lg border p-6 shadow-2xl">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-accent-strong hover:text-red-700"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Configuration */}
          <div className="space-y-6">
            {/* Knowledge Base Settings */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg border p-6 shadow-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Knowledge Base Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Product Documentation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-accent-strong"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of this knowledge base"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-accent-strong"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connected Bot *
                  </label>
                  <select
                    value={formData.botId}
                    onChange={(e) => handleInputChange('botId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-accent-strong"
                    disabled={isLoading}
                  >
                    <option value="">Select a bot</option>
                    {availableBots.map(bot => (
                      <option key={bot.id} value={bot.id}>
                        {bot.name} ({bot.model})
                      </option>
                    ))}
                  </select>
                  {availableBots.length === 0 && (
                    <p className="text-sm text-accent-strong mt-1">
                      No bots available. Please create a bot first.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Training Configuration */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg border p-6 shadow-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bot className="h-5 w-5 mr-2" />
                Training Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chunk Size (characters)
                  </label>
                  <input
                    type="number"
                    value={formData.chunkSize}
                    onChange={(e) => handleInputChange('chunkSize', parseInt(e.target.value))}
                    min="100"
                    max="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-accent-strong"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Smaller chunks = more precise, larger chunks = more context
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chunk Overlap (characters)
                  </label>
                  <input
                    type="number"
                    value={formData.chunkOverlap}
                    onChange={(e) => handleInputChange('chunkOverlap', parseInt(e.target.value))}
                    min="0"
                    max="500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-accent-strong"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Overlap helps maintain context between chunks
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature
                  </label>
                  <input
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-accent-strong"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower = more focused, Higher = more creative
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Model from selected bot (auto-filled)
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={startTraining}
                disabled={isLoading || selectedFiles.length === 0 || !formData.name || !formData.botId}
                className="w-full bg-accent-strong text-white py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Training...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Training
                  </>
                )}
              </button>
              
              <Link
                href="/dashboard/knowledge-bases"
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>

        {/* Tips for Better Training */}
        <div className="mt-8 bg-accent-strong/50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">💡 Tips for Better Training</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-2">Document Quality</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use clear, well-structured documents</li>
                <li>• Include relevant examples and use cases</li>
                <li>• Avoid duplicate or outdated information</li>
                <li>• Ensure documents are properly formatted</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Training Settings</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Start with default chunk size (1000 characters)</li>
                <li>• Use 200 character overlap for better context</li>
                <li>• Lower temperature for factual responses</li>
                <li>• Higher temperature for creative responses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 