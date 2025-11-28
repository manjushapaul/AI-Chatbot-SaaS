'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Square, Code, Copy, Eye, Settings, Trash2, Plus, Globe, Smartphone, Monitor, Palette, MessageSquare, Search, RefreshCw } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { ToolbarCard } from '@/components/dashboard/ToolbarCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';

interface Widget {
  id: string;
  name: string;
  type: 'CHAT_WIDGET' | 'POPUP' | 'EMBEDDED' | 'FLOATING';
  botName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  embedCode: string;
  config: {
    theme: string;
    position: string;
    size: string;
    welcomeMessage?: string;
    primaryColor: string;
    secondaryColor: string;
    showAvatar?: boolean;
    chatTitle?: string;
  };
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

const widgetTypeLabels = {
  CHAT_WIDGET: 'Chat Widget',
  POPUP: 'Popup',
  EMBEDDED: 'Embedded',
  FLOATING: 'Floating'
};

const widgetTypeIcons = {
  CHAT_WIDGET: <MessageSquare className="w-4 h-4 text-gray-600" />,
  POPUP: <Monitor className="w-4 h-4 text-gray-600" />,
  EMBEDDED: <Code className="w-4 h-4 text-gray-600" />,
  FLOATING: <Globe className="w-4 h-4 text-gray-600" />
};

const statusColors = {
  ACTIVE: 'bg-emerald-50 text-emerald-600',
  INACTIVE: 'bg-gray-100 text-gray-700',
  TESTING: 'bg-amber-50 text-amber-600'
};

export default function WidgetsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);

  // Fetch widgets on component mount
  useEffect(() => {
    fetchWidgets();
  }, []);

  const fetchWidgets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/widgets');
      if (response.ok) {
        const data = await response.json();
        const widgetsWithEmbedCodes = data.data.map((widget: any) => ({
          ...widget,
          botName: widget.bot?.name || 'Unknown Bot',
          embedCode: typeof window !== 'undefined' ? `<script src="${window.location.origin}/chat.js" data-widget-id="${widget.id}"></script>` : '',
          usageCount: 0,
          lastUsed: widget.updatedAt || widget.createdAt
        }));
        setWidgets(widgetsWithEmbedCodes);
      }
    } catch (error) {
      console.error('Failed to fetch widgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (widget.botName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || widget.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || widget.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const copyEmbedCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess('Embed code copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleConfigureWidget = (widget: Widget) => {
    router.push(`/dashboard/widgets/${widget.id}/edit`);
  };

  const handleDeleteWidget = async (widget: Widget) => {
    if (!confirm(`Are you sure you want to delete "${widget.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/widgets/${widget.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Widget deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchWidgets();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete widget');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error deleting widget:', error);
      setError('Failed to delete widget');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleTestWidget = (widget: Widget) => {
    setSelectedWidget(widget);
    setShowPreview(true);
  };

  const activeWidgets = widgets.filter(w => w.status === 'ACTIVE').length;
  const totalUsage = widgets.reduce((sum, w) => sum + w.usageCount, 0);
  const widgetTypes = new Set(widgets.map(w => w.type)).size;

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={typography.pageTitle}>Chat Widgets</h1>
            <p className={typography.pageSubtitle}>Create and manage chat widgets for your websites</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/widgets/create')}
            className="rounded-full bg-accent-soft text-white text-sm font-medium px-5 py-2 shadow hover:bg-accent-soft/80 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Widget</span>
          </button>
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

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 gap-5 md:grid-cols-4`}>
          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Total Widgets</p>
                <p className="text-2xl font-bold text-gray-900">{widgets.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Square className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Active Widgets</p>
                <p className="text-2xl font-bold text-gray-900">{activeWidgets}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsage.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Widget Types</p>
                <p className="text-2xl font-bold text-gray-900">{widgetTypes}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters Toolbar */}
        <ToolbarCard>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-900 placeholder:text-gray-400 text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700 text-sm"
          >
            <option value="all">All Types</option>
            <option value="CHAT_WIDGET">Chat Widget</option>
            <option value="POPUP">Popup</option>
            <option value="EMBEDDED">Embedded</option>
            <option value="FLOATING">Floating</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700 text-sm"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TESTING">Testing</option>
          </select>
          <button
            onClick={fetchWidgets}
            disabled={isLoading}
            className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </ToolbarCard>

        {/* Widgets List / Empty State */}
        {isLoading ? (
          <SectionCard title="Widgets">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className={typography.body}>Loading widgets...</p>
            </div>
          </SectionCard>
        ) : filteredWidgets.length === 0 ? (
          <SectionCard title="Widgets">
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="bg-accent-soft/10 text-accent-soft rounded-2xl p-3">
                <Square className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium text-gray-800">No widgets found</h3>
              <p className="text-xs text-gray-500 max-w-md text-center">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first chat widget'}
              </p>
              {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                <button
                  onClick={() => router.push('/dashboard/widgets/create')}
                  className="rounded-full bg-accent-soft text-white text-sm font-medium px-5 py-2 shadow hover:bg-accent-soft/80 transition-colors inline-flex items-center space-x-2 mt-2"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Create Your First Widget</span>
                </button>
              )}
            </div>
          </SectionCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredWidgets.map((widget) => (
              <div key={widget.id} className={`${cardBase} ${cardPadding.default}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {widgetTypeIcons[widget.type]}
                    </div>
                    <div>
                      <h3 className={`${typography.sectionTitle} text-base`}>{widget.name}</h3>
                      <p className={typography.meta}>Connected to {widget.botName || 'Unknown Bot'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${statusColors[widget.status]}`}>
                    {widget.status}
                  </span>
                </div>

                {/* Configuration Preview */}
                <div className={`grid grid-cols-2 gap-4 mb-4 ${typography.body}`}>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Palette className="w-4 h-4 text-gray-600" />
                    <span>{widget.config.theme} theme</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Globe className="w-4 h-4 text-gray-600" />
                    <span>{widget.config.position}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Monitor className="w-4 h-4 text-gray-600" />
                    <span>{widget.config.size} size</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    <span>{widget.usageCount} uses</span>
                  </div>
                </div>

                {/* Embed Code */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className={typography.label}>Embed Code</label>
                    <button
                      onClick={() => copyEmbedCode(widget.embedCode)}
                      className="text-accent-soft hover:text-accent-soft/80 text-sm flex items-center space-x-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <code className={`text-xs text-gray-700 break-all ${typography.meta}`}>{widget.embedCode}</code>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedWidget(widget);
                      setShowPreview(true);
                    }}
                    className="flex-1 bg-accent-soft text-white px-3 py-2 rounded-full hover:bg-accent-soft/80 transition-colors flex items-center justify-center space-x-2 text-sm font-medium min-w-[100px]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button 
                    onClick={() => handleConfigureWidget(widget)}
                    className="flex-1 bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm font-medium min-w-[100px]"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configure</span>
                  </button>
                  <button 
                    onClick={() => handleTestWidget(widget)}
                    className="flex-1 bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm font-medium min-w-[100px]"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Test</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedWidget(widget);
                      setShowCodeSnippet(true);
                    }}
                    className="flex-1 bg-white text-gray-700 border border-gray-200 px-3 py-2 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm font-medium min-w-[100px]"
                  >
                    <Code className="w-4 h-4" />
                    <span>Get Code</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteWidget(widget)}
                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                    aria-label="Delete widget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Widget Preview Modal */}
        {showPreview && selectedWidget && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/60 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className={`${typography.sectionTitle} text-base`}>Test Widget: {selectedWidget.name}</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {/* Widget Test Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                  <div className="text-center mb-4">
                    <h4 className={`${typography.sectionTitle} mb-2`}>Widget Preview Area</h4>
                    <p className={typography.meta}>This simulates how your widget will appear on a website</p>
                  </div>
                  
                  {/* Simulated Website Content */}
                  <div className={`${cardBase} ${cardPadding.compact} mb-4`}>
                    <h5 className={`${typography.sectionTitle} mb-2`}>Sample Website Content</h5>
                    <p className={typography.body}>
                      This is a sample website where your chat widget would be embedded. 
                      The widget will appear according to your configuration settings.
                    </p>
                  </div>
                  
                  {/* Embedded Widget */}
                  <div className="relative">
                    <div 
                      className={`${cardBase} ${cardPadding.compact}`}
                      style={{
                        backgroundColor: selectedWidget.config.theme === 'dark' ? '#1f2937' : '#ffffff',
                        color: selectedWidget.config.theme === 'dark' ? '#f9fafb' : '#111827',
                      }}
                    >
                      {/* Widget Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {selectedWidget.config.showAvatar && (
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                              style={{ backgroundColor: selectedWidget.config.primaryColor }}
                            >
                              {(selectedWidget.botName || 'B').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h6 
                              className="font-medium"
                              style={{ color: selectedWidget.config.primaryColor }}
                            >
                              {selectedWidget.config.chatTitle || 'Chat with us'}
                            </h6>
                            <p className={typography.meta}>
                              {selectedWidget.config.welcomeMessage || 'Hello! How can I help you today?'}
                            </p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <span className="text-xl">×</span>
                        </button>
                      </div>
                      
                      {/* Chat Messages */}
                      <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                        <div className="flex justify-start">
                          <div 
                            className="max-w-xs px-3 py-2 rounded-lg text-sm"
                            style={{ 
                              backgroundColor: selectedWidget.config.secondaryColor,
                              color: '#ffffff'
                            }}
                          >
                            Hi! I'm your AI assistant. How can I help you today?
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div 
                            className="max-w-xs px-3 py-2 rounded-lg text-sm"
                            style={{ 
                              backgroundColor: selectedWidget.config.primaryColor,
                              color: '#ffffff'
                            }}
                          >
                            Can you tell me about your services?
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div 
                            className="max-w-xs px-3 py-2 rounded-lg text-sm"
                            style={{ 
                              backgroundColor: selectedWidget.config.secondaryColor,
                              color: '#ffffff'
                            }}
                          >
                            Of course! We offer AI-powered chatbot solutions for businesses...
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat Input */}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft/40"
                          style={{
                            backgroundColor: selectedWidget.config.theme === 'dark' ? '#374151' : '#ffffff',
                            color: selectedWidget.config.theme === 'dark' ? '#f9fafb' : '#111827',
                            borderColor: selectedWidget.config.theme === 'dark' ? '#4b5563' : '#d1d5db',
                          }}
                        />
                        <button 
                          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                          style={{ backgroundColor: selectedWidget.config.primaryColor }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                    
                    {/* Position Indicator */}
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {selectedWidget.config.position}
                    </div>
                  </div>
                </div>
                
                {/* Configuration Summary */}
                <div className={`grid grid-cols-1 md:grid-cols-2 ${spacing.cardGrid} mb-4`}>
                  <div className={`${cardBase} ${cardPadding.compact}`}>
                    <h5 className={`${typography.sectionTitle} mb-2`}>Current Settings</h5>
                    <div className={`space-y-2 ${typography.body}`}>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Theme:</span>
                        <span className="font-medium">{selectedWidget.config.theme}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Position:</span>
                        <span className="font-medium">{selectedWidget.config.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Size:</span>
                        <span className="font-medium">{selectedWidget.config.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Primary Color:</span>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: selectedWidget.config.primaryColor }}
                          ></div>
                          <span className="font-mono text-xs">{selectedWidget.config.primaryColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${cardBase} ${cardPadding.compact}`}>
                    <h5 className={`${typography.sectionTitle} mb-2`}>Embed Code</h5>
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700 break-all border border-gray-200">
                      {selectedWidget.embedCode}
                    </div>
                    <button
                      onClick={() => copyEmbedCode(selectedWidget.embedCode)}
                      className="mt-2 w-full rounded-full bg-accent-soft text-white px-3 py-2 text-sm font-medium hover:bg-accent-soft/80 transition-colors"
                    >
                      Copy Embed Code
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200 flex-shrink-0 flex justify-center space-x-3">
                <button
                  onClick={() => handleConfigureWidget(selectedWidget)}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Configure Widget
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Code Snippet Modal */}
        {showCodeSnippet && selectedWidget && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/60 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className={`${typography.sectionTitle} text-base`}>Integration Code for: {selectedWidget.name}</h3>
                  <button
                    onClick={() => setShowCodeSnippet(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {/* Integration Options */}
                <div className="space-y-6">
                  {/* HTML Embed */}
                  <div className={`${cardBase} ${cardPadding.compact}`}>
                    <h4 className={`${typography.sectionTitle} mb-3 flex items-center space-x-2`}>
                      <Code className="w-5 h-5 text-gray-600" />
                      <span>HTML Embed (Recommended)</span>
                    </h4>
                    <p className={`${typography.body} mb-3`}>
                      Add this code to your HTML page's &lt;head&gt; section or before the closing &lt;/body&gt; tag.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
                      <code className={`text-sm text-gray-800 break-all ${typography.meta}`}>
                        {selectedWidget.embedCode}
                      </code>
                    </div>
                    <button
                      onClick={() => copyEmbedCode(selectedWidget.embedCode)}
                      className="rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium hover:bg-accent-soft/80 transition-colors inline-flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy HTML Code</span>
                    </button>
                  </div>

                  {/* React Component */}
                  <div className={`${cardBase} ${cardPadding.compact}`}>
                    <h4 className={`${typography.sectionTitle} mb-3 flex items-center space-x-2`}>
                      <Code className="w-5 h-5 text-gray-600" />
                      <span>React Component</span>
                    </h4>
                    <p className={`${typography.body} mb-3`}>
                      Use this component in your React application.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
                      <code className={`text-sm text-gray-800 ${typography.meta}`}>
{`import React, { useEffect } from 'react';

const ChatWidget = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js';
    script.setAttribute('data-widget-id', '${selectedWidget.id}');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default ChatWidget;`}
                      </code>
                    </div>
                    <button
                      onClick={() => {
                        const reactCode = `import React, { useEffect } from 'react';

const ChatWidget = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js';
    script.setAttribute('data-widget-id', '${selectedWidget.id}');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default ChatWidget;`;
                        navigator.clipboard.writeText(reactCode);
                        setSuccess('React component code copied!');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy React Code</span>
                    </button>
                  </div>

                  {/* WordPress Plugin */}
                  <div className={`${cardBase} ${cardPadding.compact}`}>
                    <h4 className={`${typography.sectionTitle} mb-3 flex items-center space-x-2`}>
                      <Code className="w-5 h-5 text-gray-600" />
                      <span>WordPress Integration</span>
                    </h4>
                    <p className={`${typography.body} mb-3`}>
                      Add this code to your WordPress theme's functions.php or use a custom HTML widget.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
                      <code className={`text-sm text-gray-800 ${typography.meta}`}>
{`// Add to functions.php
function add_chat_widget() {
    wp_enqueue_script('chat-widget', '${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js', array(), '1.0.0', true);
    wp_add_inline_script('chat-widget', \`
        document.addEventListener('DOMContentLoaded', function() {
            const script = document.createElement('script');
            script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js';
            script.setAttribute('data-widget-id', '${selectedWidget.id}');
            document.body.appendChild(script);
        });
    \`);
}
add_action('wp_enqueue_scripts', 'add_chat_widget');`}
                      </code>
                    </div>
                    <button
                      onClick={() => {
                        const wpCode = `// Add to functions.php
function add_chat_widget() {
    wp_enqueue_script('chat-widget', '${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js', array(), '1.0.0', true);
    wp_add_inline_script('chat-widget', \`
        document.addEventListener('DOMContentLoaded', function() {
            const script = document.createElement('script');
            script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js';
            script.setAttribute('data-widget-id', '${selectedWidget.id}');
            document.body.appendChild(script);
        });
    \`);
}
add_action('wp_enqueue_scripts', 'add_chat_widget');`;
                        navigator.clipboard.writeText(wpCode);
                        setSuccess('WordPress code copied!');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy WordPress Code</span>
                    </button>
                  </div>

                  {/* Shopify Integration */}
                  <div className={`${cardBase} ${cardPadding.compact}`}>
                    <h4 className={`${typography.sectionTitle} mb-3 flex items-center space-x-2`}>
                      <Code className="w-5 h-5 text-gray-600" />
                      <span>Shopify Integration</span>
                    </h4>
                    <p className={`${typography.body} mb-3`}>
                      Add this code to your Shopify theme's layout/theme.liquid file.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
                      <code className={`text-sm text-gray-800 ${typography.meta}`}>
{`<!-- Add before closing </body> tag in theme.liquid -->
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js" data-widget-id="${selectedWidget.id}"></script>`}
                      </code>
                    </div>
                    <button
                      onClick={() => {
                        const shopifyCode = `<!-- Add before closing </body> tag in theme.liquid -->
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/chat.js" data-widget-id="${selectedWidget.id}"></script>`;
                        navigator.clipboard.writeText(shopifyCode);
                        setSuccess('Shopify code copied!');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors inline-flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Shopify Code</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-200 flex-shrink-0 flex justify-center space-x-3">
                <button
                  onClick={() => window.open(`/dashboard/widgets/${selectedWidget.id}/test`, '_blank')}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-6 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Test Widget
                </button>
                <button
                  onClick={() => handleConfigureWidget(selectedWidget)}
                  className="rounded-full bg-accent-soft text-white px-6 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors"
                >
                  Configure Widget
                </button>
                <button
                  onClick={() => setShowCodeSnippet(false)}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-6 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}
