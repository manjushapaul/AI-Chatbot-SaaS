'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Bot, 
  Save, 
  ArrowLeft, 
  Brain, 
  Settings, 
  BookOpen, 
  Route, 
  MessageSquare,
  Copy,
  Download,
  Trash2,
  Eye,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { AppPage } from '@/components/dashboard/AppPage';
import { FormCard } from '@/components/dashboard/FormCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { typography, spacing } from '@/lib/design-tokens';
import { EmojiPicker } from '@/components/ui/EmojiPicker';

interface BotFormData {
  name: string;
  description: string;
  avatar: string;
  category: string;
  personality: string;
  tone: string;
  responseLength: string;
  safetyLevel: number;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  linkedKnowledgeBaseIds: string[];
  fallbackStrategy: string;
  fallbackMessage: string;
  handoffEnabled: boolean;
  handoffAfterMessages: number;
  escalationKeywords: string[];
  handoffChannel: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
}

interface BotData extends BotFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

const aiModels = [
  { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model, best for complex tasks' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient, good for most use cases' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Excellent reasoning and analysis' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fastest and most cost-effective' },
];

const categories = ['Support', 'Sales', 'Tourism', 'Custom'];
const tones = ['Friendly', 'Professional', 'Playful', 'Formal', 'Casual', 'Technical'];
const responseLengths = ['Short', 'Medium', 'Detailed'];
const fallbackStrategies = [
  'Use base model answer',
  'Ask clarifying question',
  'Return custom fallback message'
];
const handoffChannels = ['Email', 'Slack', 'Internal Inbox', 'Live Chat'];

export default function EditBotPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<BotData | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [formData, setFormData] = useState<BotFormData>({
    name: '',
    description: '',
    avatar: '🤖',
    category: 'Custom',
    personality: '',
    tone: 'Friendly',
    responseLength: 'Medium',
    safetyLevel: 5,
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: '',
    linkedKnowledgeBaseIds: [],
    fallbackStrategy: 'Use base model answer',
    fallbackMessage: '',
    handoffEnabled: false,
    handoffAfterMessages: 5,
    escalationKeywords: [],
    handoffChannel: 'Email',
    status: 'ACTIVE'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  // Fetch bot data
  useEffect(() => {
    const fetchBot = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/bots/${botId}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const botData = result.data;
            
            // Safely extract config - handle both object and null/undefined
            let config: Record<string, unknown> = {};
            if (botData.config) {
              if (typeof botData.config === 'object' && botData.config !== null) {
                config = botData.config as Record<string, unknown>;
              } else if (typeof botData.config === 'string') {
                try {
                  config = JSON.parse(botData.config);
                } catch {
                  config = {};
                }
              }
            }
            
            // Merge config fields with bot data
            const mergedData = {
              ...botData,
              category: (config.category as string) || 'Custom',
              tone: (config.tone as string) || 'Friendly',
              responseLength: (config.responseLength as string) || 'Medium',
              safetyLevel: (config.safetyLevel as number) ?? 5,
              systemPrompt: (config.systemPrompt as string) || '',
              linkedKnowledgeBaseIds: (config.linkedKnowledgeBaseIds as string[]) || [],
              fallbackStrategy: (config.fallbackStrategy as string) || 'Use base model answer',
              fallbackMessage: (config.fallbackMessage as string) || '',
              handoffEnabled: (config.handoffEnabled as boolean) ?? false,
              handoffAfterMessages: (config.handoffAfterMessages as number) ?? 5,
              escalationKeywords: (config.escalationKeywords as string[]) || [],
              handoffChannel: (config.handoffChannel as string) || 'Email',
            };
            
            setBot(mergedData);
            setFormData({
              name: botData.name || '',
              description: botData.description || '',
              avatar: botData.avatar || '🤖',
              category: mergedData.category,
              personality: botData.personality || '',
              tone: mergedData.tone,
              responseLength: mergedData.responseLength,
              safetyLevel: mergedData.safetyLevel,
              model: botData.model || 'gpt-3.5-turbo',
              temperature: botData.temperature ?? 0.7,
              maxTokens: botData.maxTokens ?? 1000,
              systemPrompt: mergedData.systemPrompt,
              linkedKnowledgeBaseIds: mergedData.linkedKnowledgeBaseIds,
              fallbackStrategy: mergedData.fallbackStrategy,
              fallbackMessage: mergedData.fallbackMessage,
              handoffEnabled: mergedData.handoffEnabled,
              handoffAfterMessages: mergedData.handoffAfterMessages,
              escalationKeywords: mergedData.escalationKeywords,
              handoffChannel: mergedData.handoffChannel,
              status: botData.status || 'ACTIVE'
            });
          } else {
            setError(result.error || 'Failed to fetch bot');
          }
        } else {
          const errorResult = await response.json().catch(() => ({ error: 'Bot not found' }));
          setError(errorResult.error || 'Failed to fetch bot');
        }
      } catch (error) {
        console.error('Error fetching bot:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch bot');
      } finally {
        setIsLoading(false);
      }
    };

    if (botId) {
      fetchBot();
    }
  }, [botId]);

  // Fetch knowledge bases
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        const response = await fetch('/api/knowledge-bases');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setKnowledgeBases(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching knowledge bases:', error);
      }
    };

    fetchKnowledgeBases();
  }, []);

  // Track form changes
  useEffect(() => {
    if (bot) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify({
        name: bot.name || '',
        description: bot.description || '',
        avatar: bot.avatar || '🤖',
        category: bot.category || 'Custom',
        personality: bot.personality || '',
        tone: bot.tone || 'Friendly',
        responseLength: bot.responseLength || 'Medium',
        safetyLevel: bot.safetyLevel ?? 5,
        model: bot.model || 'gpt-3.5-turbo',
        temperature: bot.temperature ?? 0.7,
        maxTokens: bot.maxTokens ?? 1000,
        systemPrompt: bot.systemPrompt || '',
        linkedKnowledgeBaseIds: bot.linkedKnowledgeBaseIds || [],
        fallbackStrategy: bot.fallbackStrategy || 'Use base model answer',
        fallbackMessage: bot.fallbackMessage || '',
        handoffEnabled: bot.handoffEnabled ?? false,
        handoffAfterMessages: bot.handoffAfterMessages ?? 5,
        escalationKeywords: bot.escalationKeywords || [],
        handoffChannel: bot.handoffChannel || 'Email',
        status: bot.status || 'ACTIVE'
      });
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, bot]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Bot name is required');
        setIsSaving(false);
        return;
      }

      if (!formData.model) {
        setError('Model selection is required');
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccess('Bot updated successfully!');
          setHasUnsavedChanges(false);
          
          // Update local bot data
          if (bot) {
            setBot({ ...bot, ...formData, updatedAt: new Date().toISOString() });
          }

          // Show success message and redirect after a short delay
          setTimeout(() => {
            router.push(`/dashboard/bots/${botId}`);
          }, 1500);
        } else {
          setError(result.error || 'Failed to update bot');
        }
      } else {
        const result = await response.json().catch(() => ({ error: 'Failed to update bot' }));
        const errorMsg = result.error || 'Failed to update bot';
        const details = result.details ? `: ${result.details}` : '';
        setError(`${errorMsg}${details}`);
      }
    } catch (error) {
      console.error('Error updating bot:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to update bot. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      router.push(`/dashboard/bots/${botId}`);
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    router.push(`/dashboard/bots/${botId}`);
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          name: `${formData.name} (Copy)`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/dashboard/bots/${result.data.id}`);
        }
      }
    } catch (error) {
      console.error('Error duplicating bot:', error);
    }
  };

  const handleExport = () => {
    const config = {
      ...formData,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-${formData.name}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/bots');
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.escalationKeywords.includes(newKeyword.trim())) {
      setFormData({
        ...formData,
        escalationKeywords: [...formData.escalationKeywords, newKeyword.trim()],
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      escalationKeywords: formData.escalationKeywords.filter(k => k !== keyword),
    });
  };

  if (isLoading) {
    return (
      <AppPage>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-soft mx-auto mb-4"></div>
            <p className={typography.body}>Loading bot...</p>
          </div>
        </div>
      </AppPage>
    );
  }

  if (error && !bot) {
    return (
      <AppPage>
        <div className="text-center py-12">
          <p className={`${typography.body} text-red-600 mb-4`}>{error}</p>
          <Link
            href="/dashboard/bots"
            className="inline-flex items-center text-accent-soft hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bots
          </Link>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/bots/${botId}`}
              className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Link>
            <div>
              <h1 className={typography.pageTitle}>Edit Bot</h1>
              <p className={typography.pageSubtitle}>Update your bot&apos;s configuration and behavior</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="rounded-full bg-white text-gray-700 border border-gray-200 px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-full bg-accent-soft text-white px-5 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Bot Info Header */}
        {bot && (
          <div className="rounded-2xl bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur border border-white/70 px-6 py-5">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{bot.avatar}</div>
              <div className="flex-1">
                <h2 className={`${typography.sectionTitleLarge} mb-1`}>{bot.name}</h2>
                <p className={typography.body}>{bot.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={typography.meta}>Model: {bot.model}</span>
                  <span className={typography.meta}>Temperature: {bot.temperature}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    bot.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {bot.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Left Column - Form Sections */}
          <div className="space-y-6">
            {/* A. Basic Information & Personality & Behavior */}
            <FormCard icon={<Bot className="w-4 h-4" />} title="Basic Information & Personality">
              <div className="space-y-4">
                {/* Basic Information Fields */}
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Bot Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    placeholder="Enter bot name"
                  />
                </div>

                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    placeholder="Describe what this bot does"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`${typography.labelLarge} block mb-1`}>
                      Avatar Emoji
                    </label>
                    <EmojiPicker
                      value={formData.avatar || '🤖'}
                      onChange={(emoji) => setFormData({ ...formData, avatar: emoji })}
                      placeholder="🤖"
                    />
                    <p className={`${typography.helperTextLarge} mt-1`}>
                      Choose an emoji to represent your bot
                    </p>
                  </div>

                  <div>
                    <label className={`${typography.labelLarge} block mb-1`}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className={`${typography.sectionTitle} mb-4 flex items-center gap-2`}>
                    <Brain className="w-4 h-4" />
                    Personality & Behavior
                  </h4>
                </div>

                {/* Personality & Behavior Fields */}
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    How should this bot speak and behave? *
                  </label>
                  <textarea
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    placeholder="Describe the bot's personality, tone, and behavior..."
                  />
                  <p className={`${typography.helperTextLarge} mt-1`}>
                    This controls how the AI responds to your users.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`${typography.labelLarge} block mb-1`}>
                      Tone of Voice
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    >
                      {tones.map((tone) => (
                        <option key={tone} value={tone}>{tone}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`${typography.labelLarge} block mb-1`}>
                      Response Length
                    </label>
                    <select
                      value={formData.responseLength}
                      onChange={(e) => setFormData({ ...formData, responseLength: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    >
                      {responseLengths.map((length) => (
                        <option key={length} value={length}>{length}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Safety/Sensitivity Level: {formData.safetyLevel}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.safetyLevel}
                    onChange={(e) => setFormData({ ...formData, safetyLevel: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>More Permissive</span>
                    <span>More Restrictive</span>
                  </div>
                </div>
              </div>
            </FormCard>

            {/* C. Model & AI Settings */}
            <FormCard icon={<Settings className="w-4 h-4" />} title="Model & AI Settings">
              <div className="space-y-4">
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Model Selection *
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  >
                    {aiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Temperature: {formData.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>More Focused</span>
                    <span>More Creative</span>
                  </div>
                </div>

                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Max Tokens *
                  </label>
                  <input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="4000"
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="flex items-center space-x-2 text-sm text-accent-soft hover:underline mb-2"
                  >
                    <span>{showSystemPrompt ? 'Hide' : 'Show'} Advanced</span>
                  </button>
                  {showSystemPrompt && (
                    <div>
                      <label className={`${typography.labelLarge} block mb-1`}>
                        System Prompt
                      </label>
                      <textarea
                        value={formData.systemPrompt}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                        rows={6}
                        className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none font-mono"
                        placeholder="Enter custom system prompt..."
                      />
                      <p className={`${typography.helperTextLarge} mt-1`}>
                        Advanced: Override the default system prompt for fine-tuned control.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </FormCard>

            {/* D. Knowledge & Context */}
            <FormCard icon={<BookOpen className="w-4 h-4" />} title="Knowledge & Context">
              <div className="space-y-4">
                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Linked Knowledge Base(s)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {knowledgeBases.length === 0 ? (
                      <p className={typography.helperTextLarge}>No knowledge bases available</p>
                    ) : (
                      knowledgeBases.map((kb) => (
                        <label key={kb.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.linkedKnowledgeBaseIds.includes(kb.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  linkedKnowledgeBaseIds: [...formData.linkedKnowledgeBaseIds, kb.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  linkedKnowledgeBaseIds: formData.linkedKnowledgeBaseIds.filter(id => id !== kb.id),
                                });
                              }
                            }}
                            className="w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                          />
                          <span className={typography.body}>{kb.name}</span>
                          {kb.description && (
                            <span className={typography.meta}>- {kb.description}</span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className={`${typography.labelLarge} block mb-1`}>
                    Fallback Behavior
                  </label>
                  <select
                    value={formData.fallbackStrategy}
                    onChange={(e) => setFormData({ ...formData, fallbackStrategy: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  >
                    {fallbackStrategies.map((strategy) => (
                      <option key={strategy} value={strategy}>{strategy}</option>
                    ))}
                  </select>
                </div>

                {formData.fallbackStrategy === 'Return custom fallback message' && (
                  <div>
                    <label className={`${typography.labelLarge} block mb-1`}>
                      Fallback Message
                    </label>
                    <textarea
                      value={formData.fallbackMessage}
                      onChange={(e) => setFormData({ ...formData, fallbackMessage: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                      placeholder="Enter custom fallback message..."
                    />
                  </div>
                )}
              </div>
            </FormCard>

            {/* E. Routing & Handover */}
            <FormCard icon={<Route className="w-4 h-4" />} title="Routing & Handover">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.handoffEnabled}
                      onChange={(e) => setFormData({ ...formData, handoffEnabled: e.target.checked })}
                      className="w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                    />
                    <span className={typography.body}>Enable handoff to human agent</span>
                  </label>
                </div>

                {formData.handoffEnabled && (
                  <>
                    <div>
                      <label className={`${typography.labelLarge} block mb-1`}>
                        Handoff after X messages
                      </label>
                      <input
                        type="number"
                        value={formData.handoffAfterMessages}
                        onChange={(e) => setFormData({ ...formData, handoffAfterMessages: parseInt(e.target.value) || 0 })}
                        min="1"
                        className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className={`${typography.labelLarge} block mb-1`}>
                        Escalation Keywords
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                          className="flex-1 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                          placeholder="Enter keyword and press Enter"
                        />
                        <button
                          type="button"
                          onClick={addKeyword}
                          className="rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium hover:bg-accent-soft/80"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.escalationKeywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(keyword)}
                              className="hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={`${typography.labelLarge} block mb-1`}>
                        Default Handoff Channel
                      </label>
                      <select
                        value={formData.handoffChannel}
                        onChange={(e) => setFormData({ ...formData, handoffChannel: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                      >
                        {handoffChannels.map((channel) => (
                          <option key={channel} value={channel}>{channel}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </FormCard>
          </div>

          {/* Right Column - Side Panel */}
          <div className="space-y-6">
            {/* A. Live Preview / Test Bot */}
            <SectionCard title="Test Bot">
              <div className="space-y-4">
                <p className={typography.body}>
                  Test your bot after making changes to see how it responds.
                </p>
                <Link
                  href={`/dashboard/bots/${botId}/chat`}
                  className="inline-flex items-center space-x-2 rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium hover:bg-accent-soft/80 transition-colors w-full justify-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open Full Test Chat</span>
                </Link>
              </div>
            </SectionCard>

            {/* B. Status & Metadata */}
            <SectionCard title="Status & Metadata">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className={typography.body}>Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.status === 'ACTIVE'}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            if (confirm('Are you sure you want to pause this bot?')) {
                              setFormData({ ...formData, status: 'INACTIVE' });
                            }
                          } else {
                            setFormData({ ...formData, status: 'ACTIVE' });
                          }
                        }}
                        className="sr-only peer check-peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-soft/40 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-strong"></div>
                    </label>
                  </label>
                  <p className={`${typography.meta} mt-1`}>
                    {formData.status === 'ACTIVE' ? 'Active' : 'Paused'}
                  </p>
                </div>

                {bot && (
                  <>
                    <div>
                      <p className={typography.meta}>Last Updated</p>
                      <p className={typography.body}>
                        {new Date(bot.updatedAt).toLocaleDateString()} {new Date(bot.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className={typography.meta}>Created</p>
                      <p className={typography.body}>
                        {new Date(bot.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </SectionCard>

            {/* C. Quick Actions */}
            <SectionCard title="Quick Actions">
              <div className="space-y-3">
                <button
                  onClick={handleDuplicate}
                  className="w-full rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate Bot</span>
                </button>
                <button
                  onClick={handleExport}
                  className="w-full rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Configuration</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full rounded-full bg-red-50 text-red-600 border border-red-200 px-4 py-2 text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Bot</span>
                </button>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className={typography.sectionTitleLarge}>Discard changes?</h3>
              <p className={`${typography.body} mt-2 mb-4`}>
                You have unsaved changes. Are you sure you want to leave this page?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium hover:bg-accent-soft/80"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className={typography.sectionTitleLarge}>Delete Bot?</h3>
              <p className={`${typography.body} mt-2 mb-4`}>
                Are you sure you want to delete &quot;{formData.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}

