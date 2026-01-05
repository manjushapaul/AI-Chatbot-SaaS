'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Palette, MessageSquare, Globe, Monitor, Loader2 } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { FormCard } from '@/components/dashboard/FormCard';
import { ChatWidgetPreview } from '@/components/dashboard/ChatWidgetPreview';
import { PopupChatWidget } from '@/components/widgets/PopupChatWidget';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';

interface Widget {
  id: string;
  name: string;
  type: 'CHAT_WIDGET' | 'POPUP' | 'EMBEDDED' | 'FLOATING';
  botName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  config: {
    theme: string;
    position: string;
    size: string;
    welcomeMessage?: string;
    primaryColor: string;
    secondaryColor: string;
    showAvatar: boolean;
    showBranding: boolean;
    autoOpen: boolean;
    chatTitle: string;
  };
  createdAt: string;
}

export default function EditWidgetPage() {
  const params = useParams();
  const router = useRouter();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const widgetId = params.id as string;

  // Fetch widget data
  useEffect(() => {
    const fetchWidget = async () => {
      try {
        const response = await fetch(`/api/widgets/${widgetId}`);
        if (response.ok) {
          const data = await response.json();
          setWidget(data.data);
        } else {
          setError('Failed to fetch widget');
        }
      } catch (error) {
        setError('Failed to fetch widget');
      } finally {
        setIsLoading(false);
      }
    };

    if (widgetId) {
      fetchWidget();
    }
  }, [widgetId]);

  const handleSave = async () => {
    if (!widget) return;

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: widget.name,
          config: widget.config,
        }),
      });

      if (response.ok) {
        setSuccess('Widget updated successfully!');
        setTimeout(() => {
          router.push('/dashboard/widgets');
        }, 1500);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update widget');
      }
    } catch (error) {
      setError('Failed to update widget');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: string, value: string | number | boolean) => {
    if (!widget) return;
    setWidget({
      ...widget,
      config: {
        ...widget.config,
        [key]: value,
      },
    });
  };

  const getWidgetPreview = () => {
    if (!widget) return null;
    const { config } = widget;
    return (
      <ChatWidgetPreview
        title={config.chatTitle || 'Live chat'}
        welcomeMessage={config.welcomeMessage}
        primaryColor={config.primaryColor}
        secondaryColor={config.secondaryColor}
        theme={config.theme as 'light' | 'dark' | undefined}
        size={config.size as 'small' | 'medium' | 'large' | undefined}
        showAvatar={config.showAvatar}
        botInitials="AI"
      />
    );
  };

  if (isLoading) {
    return (
      <AppPage>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent-soft" />
        </div>
      </AppPage>
    );
  }

  if (!widget) {
    return (
      <AppPage>
        <div className="text-center">
          <h1 className={typography.pageTitle}>Widget not found</h1>
          <p className={`${typography.pageSubtitle} mt-2 mb-6`}>The widget you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/dashboard/widgets')}
            className="rounded-full bg-accent-soft text-white px-5 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors"
          >
            Back to Widgets
          </button>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      {/* Popup Chat Widget - Always visible when widget is loaded */}
      {widget && (
        <PopupChatWidget
          title={widget.config.chatTitle || 'Chat with us'}
          welcomeMessage={widget.config.welcomeMessage || 'Hello! How can I help you today?'}
          primaryColor={widget.config.primaryColor || '#121212'}
          secondaryColor={widget.config.secondaryColor || '#ffffff'}
          theme={widget.config.theme as 'light' | 'dark' | undefined}
          size={widget.config.size as 'small' | 'medium' | 'large' | undefined}
          showAvatar={widget.config.showAvatar || false}
          botInitials="AI"
        />
      )}
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/widgets')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className={typography.pageTitle}>Edit Widget</h1>
              <p className={typography.pageSubtitle}>Configure your chat widget settings</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-accent-soft text-white text-sm font-medium px-5 py-2 shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Two-column Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          {/* Left: Form Sections */}
          <div className="space-y-6">
            {/* Basic Settings */}
            <FormCard icon={<MessageSquare className="w-4 h-4" />} title="Basic Settings" useLargeTypography>
              <div>
                <label htmlFor="name" className={`${typography.labelLarge} block mb-1`}>
                  Widget Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={widget.name}
                  onChange={(e) => setWidget({ ...widget, name: e.target.value })}
                  placeholder="e.g., Main Chat Widget"
                  className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                />
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
                    value={widget.config.theme}
                    onChange={(e) => updateConfig('theme', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (follows website)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="position" className={`${typography.labelLarge} block mb-1`}>
                    Chat Bubble Position
                  </label>
                  <select
                    id="position"
                    value={widget.config.position || 'bottom-right'}
                    onChange={(e) => updateConfig('position', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-800 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="center">Center</option>
                    <option value="inline">Inline</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Choose where the chat bubble appears on the page</p>
                </div>
                
                <div>
                  <label htmlFor="size" className={`${typography.labelLarge} block mb-1`}>
                    Size
                  </label>
                  <select
                    id="size"
                    value={widget.config.size}
                    onChange={(e) => updateConfig('size', e.target.value)}
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
                    value={widget.config.chatTitle || 'Chat with us'}
                    onChange={(e) => updateConfig('chatTitle', e.target.value)}
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
                  value={widget.config.welcomeMessage || 'Hello! How can I help you today?'}
                  onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
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
                      value={widget.config.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={widget.config.primaryColor}
                      onChange={(e) => updateConfig('primaryColor', e.target.value)}
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
                      value={widget.config.secondaryColor}
                      onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={widget.config.secondaryColor}
                      onChange={(e) => updateConfig('secondaryColor', e.target.value)}
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
                    checked={widget.config.showAvatar}
                    onChange={(e) => updateConfig('showAvatar', e.target.checked)}
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
                    checked={widget.config.showBranding}
                    onChange={(e) => updateConfig('showBranding', e.target.checked)}
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
                    checked={widget.config.autoOpen}
                    onChange={(e) => updateConfig('autoOpen', e.target.checked)}
                    className="w-4 h-4 text-accent-soft border-gray-300 rounded focus:ring-accent-soft"
                  />
                  <label htmlFor="autoOpen" className={typography.body}>
                    Auto-open on page load
                  </label>
                </div>
              </div>
            </FormCard>
          </div>

          {/* Right: Preview Card */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="rounded-2xl bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur border border-white/80 px-6 py-5 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-accent-soft/10 text-accent-soft rounded-full p-2">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className={typography.sectionTitle}>Preview</h3>
              </div>
              
              <div className="flex justify-center">
                {getWidgetPreview() || (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Widget preview will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppPage>
  );
}
