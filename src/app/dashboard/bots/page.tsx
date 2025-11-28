'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, MessageSquare, Settings, Play, Pause, Trash2, Plus, Search, Loader2 } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { TestChatModal } from '@/components/dashboard/TestChatModal';
import { typography, spacing } from '@/lib/design-tokens';

interface Bot {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  model: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    conversations: number;
  };
}

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [testChatOpen, setTestChatOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch bots from API
  const fetchBots = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/bots');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Bots fetched successfully:', result.data);
          setBots(result.data);
        } else {
          setError(result.error || 'Failed to fetch bots');
        }
      } else {
        setError('Failed to fetch bots');
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
      setError('Failed to fetch bots');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  // Handle escape key to close chat modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && testChatOpen) {
        closeTestChat();
      }
    };

    if (testChatOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [testChatOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (testChatOpen && chatMessages.length > 0) {
      const chatContainer = document.querySelector('.overflow-y-auto');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatMessages, testChatOpen]);

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bot.description && bot.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || bot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Inactive
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {status}
          </span>
        );
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove bot from local state
        setBots(prevBots => prevBots.filter(bot => bot.id !== botId));
        setSuccess('Bot deleted successfully!');
        setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete bot');
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
      alert('Failed to delete bot');
    }
  };

  const openTestChat = (bot: Bot) => {
    setSelectedBot(bot);
    setChatMessages([{
      role: 'assistant',
      content: `Hello! I'm ${bot.name}. ${bot.description ? `I'm here to help with: ${bot.description}` : 'How can I assist you today?'}`
    }]);
    setChatInput('');
    setTestChatOpen(true);
  };

  const closeTestChat = () => {
    setTestChatOpen(false);
    setSelectedBot(null);
    setChatMessages([]);
    setChatInput('');
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedBot) return;

    const userMessage = { role: 'user' as const, content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          botId: selectedBot.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const assistantMessage = { role: 'assistant' as const, content: result.data.message || 'No response received' };
          setChatMessages(prev => [...prev, assistantMessage]);
        } else {
          const errorMessage = { role: 'assistant' as const, content: `Error: ${result.error || 'Failed to get response'}` };
          setChatMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Try to parse error message from response
        let errorText = 'Failed to communicate with bot';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (e) {
          // If response is not JSON, use status text
          errorText = response.statusText || errorText;
        }
        const errorMessage = { role: 'assistant' as const, content: `Error: ${errorText}` };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant' as const, content: `Error: ${error instanceof Error ? error.message : 'Network error occurred'}` };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppPage>
        <div className={spacing.pageBlock}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={typography.pageTitle}>AI Bots</h1>
              <p className={typography.pageSubtitle}>Loading your bots...</p>
            </div>
          <Link
            href="/dashboard/bots/create"
            className="bg-accent-soft text-white px-4 py-2 rounded-full hover:bg-accent-soft/80 transition-colors flex items-center space-x-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Bot</span>
          </Link>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
            <span className={`ml-2 ${typography.pageSubtitle}`}>Loading bots...</span>
          </div>
        </div>
      </AppPage>
    );
  }

  if (error && bots.length === 0) {
    return (
      <AppPage>
        <div className={spacing.pageBlock}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={typography.pageTitle}>AI Bots</h1>
              <p className={typography.pageSubtitle}>Manage your AI chatbots and their configurations</p>
            </div>
          <Link
            href="/dashboard/bots/create"
            className="bg-accent-soft text-white px-4 py-2 rounded-full hover:bg-accent-soft/80 transition-colors flex items-center space-x-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Bot</span>
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="bg-accent-soft text-white px-4 py-2 rounded-full hover:bg-accent-soft/80 transition-colors text-sm font-medium"
        >
          Retry
        </button>
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
            <h1 className={typography.pageTitle}>AI Bots</h1>
            <p className={typography.pageSubtitle}>Manage your AI chatbots and their configurations</p>
          </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchBots}
            disabled={isLoading}
            className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2 disabled:opacity-50 transition-colors"
          >
            <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''} text-gray-600`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/dashboard/bots/create"
            className="bg-accent-soft text-white hover:bg-accent-soft/80 rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Bot</span>
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="rounded-2xl bg-white/60 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search bots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
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

        {/* Bots List */}
        <div className={spacing.list}>
        {filteredBots.map((bot) => (
          <div 
            key={bot.id} 
            className="rounded-2xl bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-6 py-4 flex items-center justify-between gap-6"
          >
            {/* Left Side: Avatar, Name, Model, Description */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                {bot.avatar || '🤖'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{bot.name}</h3>
                  {getStatusPill(bot.status)}
                </div>
                <p className={`${typography.body} mb-1`}>{bot.model || 'Model not set'}</p>
                <p className={`${typography.body} line-clamp-1`}>
                  {bot.description || 'No description provided'}
                </p>
                <div className={`flex items-center gap-4 mt-2 ${typography.meta}`}>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-gray-400" />
                    <span>{bot._count?.conversations || 0} conversations</span>
                  </div>
                  <span>Created {new Date(bot.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => openTestChat(bot)}
                className="bg-accent-soft text-white hover:bg-accent-soft/80 rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors"
              >
                <Play className="w-4 h-4 text-white" />
                <span>Test</span>
              </button>
              <Link
                href={`/dashboard/bots/${bot.id}`}
                className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-full px-4 py-2 text-sm font-medium flex items-center space-x-2 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-600" />
                <span>Configure</span>
              </Link>
              <button 
                onClick={() => handleDeleteBot(bot.id)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Delete bot"
              >
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredBots.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'No bots match your search'
              : bots.length === 0 
                ? 'No bots created yet'
                : 'No bots found'
            }
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first AI bot'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && bots.length === 0 && (
            <Link
              href="/dashboard/bots/create"
              className="bg-accent-soft text-white px-4 py-2 rounded-full hover:bg-accent-soft/80 transition-colors inline-flex items-center space-x-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Create Your First Bot</span>
            </Link>
          )}
        </div>
      )}

      {/* Test Chat Modal */}
      <TestChatModal
        isOpen={testChatOpen}
        onClose={closeTestChat}
        bot={selectedBot}
        messages={chatMessages}
        inputValue={chatInput}
        onInputChange={setChatInput}
        onSendMessage={sendChatMessage}
        isLoading={isChatLoading}
      />
      </div>
    </AppPage>
  );
}
