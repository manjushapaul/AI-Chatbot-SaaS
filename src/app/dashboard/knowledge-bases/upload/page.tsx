'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  Bot, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Trash2,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { AppPage } from '@/components/dashboard/AppPage';
import { UploadCard } from '@/components/dashboard/UploadCard';
import { FormCard } from '@/components/dashboard/FormCard';
import { TipsCard } from '@/components/dashboard/TipsCard';
import { typography, spacing } from '@/lib/design-tokens';

interface Bot {
  id: string;
  name: string;
  description?: string;
  model: string;
  temperature: number;
  maxTokens?: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'UPLOADING' | 'PROCESSING' | 'TRAINED' | 'ERROR';
  progress: number;
  error?: string;
  uploadedAt: Date;
}

interface KnowledgeBaseConfig {
  name: string;
  description: string;
  botId: string;
  trainingSettings: {
    chunkSize: number;
    overlap: number;
    model: string;
    temperature: number;
  };
}

export default function KnowledgeBaseUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [availableBots, setAvailableBots] = useState<Bot[]>([]);
  const [isLoadingBots, setIsLoadingBots] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [config, setConfig] = useState<KnowledgeBaseConfig>({
    name: '',
    description: '',
    botId: '',
    trainingSettings: {
      chunkSize: 1000,
      overlap: 200,
      model: '',
      temperature: 0.7
    }
  });

  // Fetch available bots from API
  useEffect(() => {
    const fetchBots = async () => {
      try {
        setIsLoadingBots(true);
        const response = await fetch('/api/bots');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAvailableBots(result.data);
          } else {
            setError('Failed to fetch bots: ' + result.error);
          }
        } else {
          setError('Failed to fetch bots');
        }
      } catch (error) {
        console.error('Error fetching bots:', error);
        setError('Failed to fetch bots');
      } finally {
        setIsLoadingBots(false);
      }
    };
    fetchBots();
  }, []);

  // Update config when bot is selected
  useEffect(() => {
    if (config.botId) {
      const selectedBot = availableBots.find(bot => bot.id === config.botId);
      if (selectedBot) {
        setConfig(prev => ({
          ...prev,
          trainingSettings: {
            ...prev.trainingSettings,
            model: selectedBot.model,
            temperature: selectedBot.temperature
          }
        }));
      }
    }
  }, [config.botId, availableBots]);

  const handleFileSelect = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    
    const newFiles = Array.from(fileList);
    const uploadFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'UPLOADING',
      progress: 0,
      uploadedAt: new Date()
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
    simulateFileUpload(uploadFiles);
  }, []);

  const simulateFileUpload = async (uploadFiles: UploadedFile[]) => {
    setIsUploading(true);
    
    for (const file of uploadFiles) {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, progress: i, status: i === 100 ? 'PROCESSING' : 'UPLOADING' }
            : f
        ));
      }
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'TRAINED' }
          : f
      ));
    }
    
    setIsUploading(false);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleConfigChange = (field: string, value: string | number) => {
    if (field === 'botId') {
      setConfig(prev => ({ ...prev, botId: value as string }));
    } else if (field.startsWith('trainingSettings.')) {
      const setting = field.replace('trainingSettings.', '');
      setConfig(prev => ({
        ...prev,
        trainingSettings: {
          ...prev.trainingSettings,
          [setting]: value
        }
      }));
    } else {
      setConfig(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateConfig = () => {
    if (!config.name.trim()) {
      setError('Knowledge base name is required');
      return false;
    }
    if (!config.botId) {
      setError('Please select a bot to connect');
      return false;
    }
    if (files.length === 0) {
      setError('Please upload at least one file');
      return false;
    }
    return true;
  };

  const startTraining = async () => {
    if (!validateConfig()) return;

    setIsTraining(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Create knowledge base
      const kbResponse = await fetch('/api/knowledge-bases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          botId: config.botId
        })
      });

      if (!kbResponse.ok) {
        throw new Error('Failed to create knowledge base');
      }

      const kbResult = await kbResponse.json();
      const knowledgeBaseId = kbResult.data.id;

      // Step 2: Upload documents
      const formData = new FormData();
      formData.append('action', 'upload_documents');
      formData.append('knowledgeBaseId', knowledgeBaseId);
      formData.append('chunkSize', config.trainingSettings.chunkSize.toString());
      formData.append('overlap', config.trainingSettings.overlap.toString());

      // Add all files to FormData
      files.forEach(uploadedFile => {
        formData.append('files', uploadedFile.file);
      });

      // Upload all files in a single request
      const uploadResponse = await fetch('/api/knowledge-bases/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload documents');
      }

      const uploadResult = await uploadResponse.json();
      
      // Check if there were any errors
      if (uploadResult.errors && uploadResult.errors.length > 0) {
        const errorMessages = uploadResult.errors.map((e: { fileName: string; error: string }) => 
          `${e.fileName}: ${e.error}`
        ).join(', ');
        throw new Error(`Some documents failed to upload: ${errorMessages}`);
      }

      setSuccess('Knowledge base created and training started successfully!');
      
      // Redirect to the new knowledge base
      setTimeout(() => {
        router.push(`/dashboard/knowledge-bases/${knowledgeBaseId}`);
      }, 2000);

    } catch (error) {
      console.error('Training error:', error);
      setError(error instanceof Error ? error.message : 'Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div>
          <Link 
            href="/dashboard/knowledge-bases"
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center mb-4"
          >
            <ArrowLeft className="w-3 h-3 mr-1 text-gray-700" />
            Back to Knowledge Bases
          </Link>
          <h1 className={typography.pageTitleLarge}>Create & Train Knowledge Base</h1>
          <p className={typography.pageSubtitle}>Upload documents and train your AI chatbot with company knowledge</p>
        </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {/* Left Column - Upload + Tips */}
        <div className="flex flex-col gap-6">
          <UploadCard
            icon={<Upload className="w-6 h-6" />}
            headline="Drop files here or click to browse"
            helperText="Support for DOCX, TXT, HTML, MARKDOWN, and JSON files"
            onFileSelect={(fileList) => {
              if (fileList) {
                handleFileSelect(fileList);
              }
            }}
            accept=".docx,.txt,.html,.htm,.md,.json"
            multiple={true}
            useLargeTypography={true}
          />

          {/* File List */}
          {files.length > 0 && (
            <div className="w-full rounded-2xl bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur border border-white/70 px-6 py-5">
              <h3 className={`${typography.sectionTitleLarge} mb-4`}>
                Uploaded Files ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`${typography.bodyLarge} font-medium truncate`}>{file.name}</p>
                        <p className={typography.metaLarge}>
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.status === 'UPLOADING' && (
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-accent-soft h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          ></div>
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full ${typography.metaLarge} font-medium ${
                        file.status === 'TRAINED' ? 'bg-emerald-50 text-emerald-600' :
                        file.status === 'PROCESSING' ? 'bg-blue-50 text-blue-600' :
                        file.status === 'UPLOADING' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {file.status}
                      </span>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                        aria-label="Remove file"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips for Better Training */}
          <TipsCard
            leftColumn={{
              title: 'Document Quality',
              tips: [
                { text: 'Use clear, well-structured documents', color: 'emerald' },
                { text: 'Include relevant examples and use cases', color: 'emerald' },
                { text: 'Avoid duplicate or outdated information', color: 'emerald' },
                { text: 'Ensure documents are properly formatted', color: 'emerald' }
              ]
            }}
            rightColumn={{
              title: 'Training Settings',
              tips: [
                { text: 'Start with default chunk size (1000 characters)', color: 'sky' },
                { text: 'Use 200 character overlap for better context', color: 'sky' },
                { text: 'Lower temperature for factual responses', color: 'sky' },
                { text: 'Higher temperature for creative responses', color: 'sky' }
              ]
            }}
            useLargeTypography={true}
          />
        </div>

        {/* Right Column - Configuration */}
        <div className="flex flex-col gap-6">
          {/* Knowledge Base Settings */}
          <FormCard
            icon={<Settings className="w-5 h-5" />}
            title="Knowledge Base Settings"
            useLargeTypography={true}
          >
            <div>
              <label className={`block ${typography.labelLarge} mb-1`}>
                Name *
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => handleConfigChange('name', e.target.value)}
                placeholder="e.g., Product Documentation"
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                disabled={isTraining}
              />
            </div>
            <div>
              <label className={`block ${typography.labelLarge} mb-1`}>
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                placeholder="Brief description of this knowledge base"
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                disabled={isTraining}
              />
            </div>
            <div>
              <label className={`block ${typography.labelLarge} mb-1`}>
                Connected Bot *
              </label>
              <select
                value={config.botId}
                onChange={(e) => handleConfigChange('botId', e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                disabled={isTraining || isLoadingBots}
              >
                <option value="">Select a bot</option>
                {availableBots.map(bot => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name} ({bot.model})
                  </option>
                ))}
              </select>
              {isLoadingBots && (
                <p className={`${typography.metaLarge} mt-1`}>Loading bots...</p>
              )}
              {!isLoadingBots && availableBots.length === 0 && (
                <p className={`${typography.metaLarge} text-accent-soft mt-1`}>
                  No bots available. Please create a bot first.
                </p>
              )}
            </div>
          </FormCard>

          {/* Training Configuration */}
          <FormCard
            icon={<Bot className="w-5 h-5" />}
            title="Training Configuration"
            useLargeTypography={true}
          >
            <div>
              <label className={`block ${typography.labelLarge} mb-1`}>
                Chunk Size (characters)
              </label>
              <input
                type="number"
                value={config.trainingSettings.chunkSize}
                onChange={(e) => handleConfigChange('trainingSettings.chunkSize', parseInt(e.target.value))}
                min="100"
                max="2000"
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                disabled={isTraining}
              />
              <p className={`${typography.helperTextLarge} mt-1`}>
                Smaller chunks = more precise, larger chunks = more context
              </p>
            </div>
            <div>
              <label className={`block ${typography.labelLarge} mb-1`}>
                Chunk Overlap (characters)
              </label>
              <input
                type="number"
                value={config.trainingSettings.overlap}
                onChange={(e) => handleConfigChange('trainingSettings.overlap', parseInt(e.target.value))}
                min="0"
                max="500"
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                disabled={isTraining}
              />
              <p className={`${typography.helperTextLarge} mt-1`}>
                Overlap helps maintain context between chunks
              </p>
            </div>
            <div>
              <label className={`block ${typography.labelLarge} mb-1`}>
                Temperature
              </label>
              <input
                type="number"
                value={config.trainingSettings.temperature}
                onChange={(e) => handleConfigChange('trainingSettings.temperature', parseFloat(e.target.value))}
                min="0"
                max="2"
                step="0.1"
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                disabled={isTraining}
              />
              <p className={`${typography.helperTextLarge} mt-1`}>
                Lower = more focused, Higher = more creative
              </p>
            </div>
            <div>
              <label className={`block ${typography.labelLarge} mb-1`}>
                AI Model
              </label>
              <input
                type="text"
                value={config.trainingSettings.model}
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-base text-gray-500 bg-gray-50"
                disabled
              />
              <p className={`${typography.helperTextLarge} mt-1`}>
                Model from selected bot (auto-filled)
              </p>
            </div>
          </FormCard>
        </div>
      </div>

        {/* Start Training Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/dashboard/knowledge-bases"
            className="rounded-full bg-white text-gray-700 border border-gray-200 px-5 py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={startTraining}
            disabled={isTraining || files.length === 0 || !config.name || !config.botId}
            className="rounded-full bg-accent-soft text-white px-6 py-2 text-base font-medium shadow hover:bg-accent-soft/80 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isTraining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Training...</span>
              </>
            ) : (
              <span>Start Training</span>
            )}
          </button>
        </div>
      </div>
    </AppPage>
  );
}
