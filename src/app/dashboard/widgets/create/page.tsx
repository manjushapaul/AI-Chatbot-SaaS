'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Palette, Monitor, Settings, Eye } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { FormCard } from '@/components/dashboard/FormCard';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';

interface Bot {
  id: string;
  name: string;
  description?: string;
}

interface WidgetConfig {
  theme: 'light' | 'dark' | 'auto';
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'inline';
  size: 'small' | 'medium' | 'large';
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  showAvatar: boolean;
  showBranding: boolean;
  autoOpen: boolean;
  chatTitle: string;
}

export default function CreateWidgetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'CHAT_WIDGET' as 'CHAT_WIDGET' | 'POPUP' | 'EMBEDDED' | 'FLOATING',
    botId: '',
    config: {
      theme: 'light' as const,
      position: 'bottom-right' as const,
      size: 'medium' as const,
      welcomeMessage: 'Hello! How can I help you today?',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      showAvatar: true,
      showBranding: true,
      autoOpen: false,
      chatTitle: 'Chat with us'
    } as WidgetConfig
  });

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/bots');
      if (response.ok) {
        const data = await response.json();
        setBots(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create widget');
      }

      const result = await response.json();
      
      // Show success message with embed code
      const embedCode = typeof window !== 'undefined' ? `<script src="${window.location.origin}/chat.js" data-widget-id="${result.data.id}"></script>` : '';
      
      // Copy embed code to clipboard
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(embedCode);
      }
      
      // Redirect to widgets page with success message
      router.push(`/dashboard/widgets?created=${result.data.id}&embedCode=${encodeURIComponent(embedCode)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const getWidgetPreview = () => {
    const { config } = formData;
    return (
      <div 
        className="w-full max-w-sm mx-auto bg-white border rounded-lg shadow-lg flex flex-col"
        style={{ 
          backgroundColor: config.theme === 'dark' ? '#1F2937' : '#FFFFFF',
          borderColor: config.primaryColor 
        }}
      >
        {/* Header */}
        <div 
          className="p-4 rounded-t-lg flex items-center justify-between"
          style={{ backgroundColor: config.primaryColor }}
        >
          <div className="flex items-center space-x-2">
            {config.showAvatar && (
              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                <span className="text-sm font-bold text-white">AI</span>
              </div>
            )}
            <span className="text-white font-medium text-sm">{config.chatTitle}</span>
          </div>
          <button className="text-white hover:text-gray-200">
            <span className="text-lg">×</span>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 space-y-3 min-h-[200px]">
          {config.welcomeMessage && (
            <div className="flex justify-start">
              <div 
                className="max-w-xs p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: config.secondaryColor,
                  color: '#FFFFFF'
                }}
              >
                {config.welcomeMessage}
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <div 
              className="max-w-xs p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: config.primaryColor,
                color: '#FFFFFF'
              }}
            >
              Hello! I&apos;m here to help.
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t" style={{ borderColor: config.secondaryColor }}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ 
                borderColor: config.secondaryColor
              }}
            />
            <button 
              className="px-4 py-2 rounded-lg text-white text-sm whitespace-nowrap flex-shrink-0"
              style={{ backgroundColor: config.primaryColor }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className={typography.pageTitle}>Create Chat Widget</h1>
            <p className={typography.pageSubtitle}>Configure and customize your embeddable chat widget</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Basic Settings */}
              <FormCard icon={<Settings className="w-4 h-4" />} title="Basic Settings" useLargeTypography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className={`${typography.labelLarge} block mb-1`}>
                      Widget Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Main Chat Widget"
                      required
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="type" className={`${typography.labelLarge} block mb-1`}>
                      Widget Type
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    >
                      <option value="CHAT_WIDGET">Chat Widget</option>
                      <option value="POPUP">Popup</option>
                      <option value="EMBEDDED">Embedded</option>
                      <option value="FLOATING">Floating</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="botId" className={`${typography.labelLarge} block mb-1`}>
                    Connect to Bot
                  </label>
                  <select
                    id="botId"
                    value={formData.botId}
                    onChange={(e) => handleInputChange('botId', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    required
                  >
                    <option value="">Select a bot</option>
                    {bots.map((bot) => (
                      <option key={bot.id} value={bot.id}>
                        {bot.name}
                      </option>
                    ))}
                  </select>
                </div>
              </FormCard>

              {/* Appearance Settings */}
              <FormCard icon={<Palette className="w-4 h-4" />} title="Appearance" useLargeTypography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="theme" className={`${typography.labelLarge} block mb-1`}>
                      Theme
                    </label>
                    <select
                      id="theme"
                      value={formData.config.theme}
                      onChange={(e) => handleInputChange('config.theme', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (follows website)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="position" className={`${typography.labelLarge} block mb-1`}>
                      Position
                    </label>
                    <select
                      id="position"
                      value={formData.config.position}
                      onChange={(e) => handleInputChange('config.position', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="center">Center</option>
                      <option value="inline">Inline</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="size" className={`${typography.labelLarge} block mb-1`}>
                      Size
                    </label>
                    <select
                      id="size"
                      value={formData.config.size}
                      onChange={(e) => handleInputChange('config.size', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="chatTitle" className={`${typography.labelLarge} block mb-1`}>
                      Chat Title
                    </label>
                    <input
                      id="chatTitle"
                      type="text"
                      value={formData.config.chatTitle}
                      onChange={(e) => handleInputChange('config.chatTitle', e.target.value)}
                      placeholder="Chat with us"
                      className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="welcomeMessage" className={`${typography.labelLarge} block mb-1`}>
                    Welcome Message
                  </label>
                  <input
                    id="welcomeMessage"
                    type="text"
                    value={formData.config.welcomeMessage}
                    onChange={(e) => handleInputChange('config.welcomeMessage', e.target.value)}
                    placeholder="Hello! How can I help you today?"
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="primaryColor" className={`${typography.labelLarge} block mb-1`}>
                      Primary Color
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.config.primaryColor}
                        onChange={(e) => handleInputChange('config.primaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.config.primaryColor}
                        onChange={(e) => handleInputChange('config.primaryColor', e.target.value)}
                        placeholder="#3B82F6"
                        className="flex-1 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="secondaryColor" className={`${typography.labelLarge} block mb-1`}>
                      Secondary Color
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={formData.config.secondaryColor}
                        onChange={(e) => handleInputChange('config.secondaryColor', e.target.value)}
                        className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.config.secondaryColor}
                        onChange={(e) => handleInputChange('config.secondaryColor', e.target.value)}
                        placeholder="#1E40AF"
                        className="flex-1 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </FormCard>

              {/* Behavior Settings */}
              <FormCard icon={<Monitor className="w-4 h-4" />} title="Behavior" useLargeTypography>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="showAvatar"
                      checked={formData.config.showAvatar}
                      onChange={(e) => handleInputChange('config.showAvatar', e.target.checked)}
                      className="w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                    />
                    <label htmlFor="showAvatar" className={typography.body}>
                      Show bot avatar
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="showBranding"
                      checked={formData.config.showBranding}
                      onChange={(e) => handleInputChange('config.showBranding', e.target.checked)}
                      className="w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                    />
                    <label htmlFor="showBranding" className={typography.body}>
                      Show company branding
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoOpen"
                      checked={formData.config.autoOpen}
                      onChange={(e) => handleInputChange('config.autoOpen', e.target.checked)}
                      className="w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                    />
                    <label htmlFor="autoOpen" className={typography.body}>
                      Auto-open on page load
                    </label>
                  </div>
                </div>
              </FormCard>
            </div>

            {/* Preview and Actions */}
            <div className="space-y-6">
              {/* Live Preview */}
              <div className="rounded-2xl bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur border border-white/80 px-6 py-5 space-y-4">
                <div className="flex items-center space-x-3">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h3 className={typography.sectionTitle}>Live Preview</h3>
                </div>
                <div className="flex justify-center">
                  {getWidgetPreview()}
                </div>
              </div>

              {/* Actions */}
              <div className={`${cardBase} ${cardPadding.compact} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-5 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.name || !formData.botId}
                  className="rounded-full bg-accent-soft text-white text-sm font-medium px-5 py-2 shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Widget'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppPage>
  );
}
