'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, User, Bot, Clock, Eye, Trash2, RefreshCw, DollarSign, Activity } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { ToolbarCard } from '@/components/dashboard/ToolbarCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';

interface Conversation {
  id: string;
  userId: string;
  botId: string;
  botName: string;
  userName: string;
  userEmail: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  messageCount: number;
  startedAt: string;
  lastMessageAt: string;
  totalTokens: number;
  totalCost: number;
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [botFilter, setBotFilter] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  const [bots, setBots] = useState<Array<{id: string, name: string}>>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations and bots on component mount
  useEffect(() => {
    fetchConversations();
    fetchBots();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      } else {
        console.error('Failed to fetch conversations:', response.statusText);
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = 
      conversation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.botName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    const matchesBot = botFilter === 'all' || conversation.botId === botFilter;
    return matchesSearch && matchesStatus && matchesBot;
  });

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowConversationDetail(true);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Conversation deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchConversations();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete conversation');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
            Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
            Completed
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Archived
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

  const activeChats = conversations.filter(c => c.status === 'ACTIVE').length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
  const totalCost = conversations.reduce((sum, c) => sum + c.totalCost, 0);

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div>
          <h1 className={typography.pageTitle}>Conversations</h1>
          <p className={typography.pageSubtitle}>Monitor and manage all chat conversations between users and your AI bots</p>
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
                <p className={typography.sectionTitle}>Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">{activeChats}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{totalMessages}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${totalCost.toFixed(3)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gray-700" />
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
              placeholder="Search conversations by user, email, or bot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-900 placeholder:text-gray-400 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700 text-sm"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={botFilter}
            onChange={(e) => setBotFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700 text-sm"
          >
            <option value="all">All Bots</option>
            {bots.map(bot => (
              <option key={bot.id} value={bot.id}>{bot.name}</option>
            ))}
          </select>
          <button
            onClick={fetchConversations}
            disabled={isLoading}
            className="rounded-full bg-accent-soft text-white text-sm px-4 py-2 hover:bg-accent-soft/80 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </ToolbarCard>

        {/* Conversations Table */}
        <SectionCard title="Conversations">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className={typography.body}>Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-accent-soft/10 text-accent-soft rounded-full p-3 w-fit mx-auto mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium text-gray-800 mb-2">No conversations found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                {searchTerm || statusFilter !== 'all' || botFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Conversations will appear here once users start chatting with your bots'}
              </p>
              {!searchTerm && statusFilter === 'all' && botFilter === 'all' && (
                <button
                  onClick={fetchConversations}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-xs hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/80">
                    <th className="text-left py-3 pr-6 text-xs font-medium text-gray-500">User</th>
                    <th className="text-left py-3 pr-6 text-xs font-medium text-gray-500">Bot</th>
                    <th className="text-left py-3 pr-6 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 pr-6 text-xs font-medium text-gray-500">Messages</th>
                    <th className="text-left py-3 pr-6 text-xs font-medium text-gray-500">Started</th>
                    <th className="text-left py-3 pr-6 text-xs font-medium text-gray-500">Last Activity</th>
                    <th className="text-left py-3 pr-6 text-xs font-medium text-gray-500">Cost</th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => (
                    <tr key={conversation.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-4 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <div className={`${typography.body} font-medium truncate`}>{conversation.userName}</div>
                            <div className={typography.meta}>{conversation.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className={`${typography.body} truncate`}>{conversation.botName}</div>
                        </div>
                      </td>
                      <td className="py-4 pr-6">
                        {getStatusPill(conversation.status)}
                      </td>
                      <td className={`py-4 pr-6 ${typography.body}`}>
                        {conversation.messageCount}
                      </td>
                      <td className={`py-4 pr-6 ${typography.meta}`}>
                        {formatDate(conversation.startedAt)}
                      </td>
                      <td className={`py-4 pr-6 ${typography.meta}`}>
                        {formatDate(conversation.lastMessageAt)}
                      </td>
                      <td className={`py-4 pr-6 ${typography.body}`}>
                        ${conversation.totalCost.toFixed(3)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewConversation(conversation)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="View conversation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteConversation(conversation.id)}
                            className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Conversation Detail Modal */}
        {showConversationDetail && selectedConversation && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/60 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className={`${typography.sectionTitle} text-base`}>
                    Conversation Details: {selectedConversation.userName}
                  </h3>
                  <button
                    onClick={() => setShowConversationDetail(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className={`grid grid-cols-1 md:grid-cols-2 ${spacing.cardGrid} mb-6`}>
                  <div className={`${cardBase} ${cardPadding.default}`}>
                    <h4 className={`${typography.sectionTitle} mb-3`}>User Information</h4>
                    <div className={`space-y-2 ${typography.body}`}>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Name:</span>
                        <span className="font-medium">{selectedConversation.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Email:</span>
                        <span className="font-medium">{selectedConversation.userEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={typography.meta}>User ID:</span>
                        <span className="font-medium text-xs">{selectedConversation.userId}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`${cardBase} ${cardPadding.default}`}>
                    <h4 className={`${typography.sectionTitle} mb-3`}>Bot Information</h4>
                    <div className={`space-y-2 ${typography.body}`}>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Bot Name:</span>
                        <span className="font-medium">{selectedConversation.botName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Bot ID:</span>
                        <span className="font-medium text-xs">{selectedConversation.botId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={typography.meta}>Status:</span>
                        {getStatusPill(selectedConversation.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${cardBase} ${cardPadding.default}`}>
                  <h4 className={`${typography.sectionTitle} mb-3`}>Conversation Statistics</h4>
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${typography.body}`}>
                    <div className="flex justify-between">
                      <span className={typography.meta}>Message Count:</span>
                      <span className="font-medium">{selectedConversation.messageCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={typography.meta}>Total Tokens:</span>
                      <span className="font-medium">{selectedConversation.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={typography.meta}>Total Cost:</span>
                      <span className="font-medium">${selectedConversation.totalCost.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={typography.meta}>Started:</span>
                      <span className="font-medium text-xs">{formatDate(selectedConversation.startedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex-shrink-0 text-center">
                <button
                  onClick={() => setShowConversationDetail(false)}
                  className="rounded-full bg-accent-soft text-white px-6 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors"
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
