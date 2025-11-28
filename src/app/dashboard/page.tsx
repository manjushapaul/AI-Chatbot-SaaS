'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bot, MessageSquare, Database, Users, TrendingUp, Activity, Square, LoaderCircle, CheckCircle, ArrowUp } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardStats {
  totalBots: number;
  activeConversations: number;
  totalKnowledgeBases: number;
  totalUsers: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch data from multiple endpoints
        const [botsRes, conversationsRes, knowledgeBasesRes, usersRes] = await Promise.all([
          fetch('/api/bots'),
          fetch('/api/conversations'),
          fetch('/api/knowledge-bases'),
          fetch('/api/users')
        ]);

        if (!botsRes.ok || !conversationsRes.ok || !knowledgeBasesRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [botsData, conversationsData, knowledgeBasesData, usersData] = await Promise.all([
          botsRes.json(),
          conversationsRes.json(),
          knowledgeBasesRes.json(),
          usersRes.json()
        ]);

        // Calculate active conversations (status !== 'CLOSED')
        const activeConversations = conversationsData.data?.filter((conv: any) => conv.status !== 'CLOSED').length || 0;

        // Generate recent activity based on real data
        const recentActivity = [];
        
        if (botsData.data?.length > 0) {
          recentActivity.push({
            id: '1',
            type: 'bot',
            description: `Bot "${botsData.data[0].name}" is active`,
            timestamp: new Date(botsData.data[0].createdAt).toLocaleDateString()
          });
        }

        if (usersData.data?.length > 0) {
          recentActivity.push({
            id: '2',
            type: 'user',
            description: `${usersData.data.length} team member(s) active`,
            timestamp: 'Today'
          });
        }

        setStats({
          totalBots: botsData.data?.length || 0,
          activeConversations,
          totalKnowledgeBases: knowledgeBasesData.data?.length || 0,
          totalUsers: usersData.data?.length || 0,
          recentActivity
        });

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-[#FFFCEB] via-[#F8EAFE] to-[#FFD6EF] text-gray-900 px-4 py-2 rounded-lg hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div>
          <h1 className={typography.pageTitle}>Dashboard Overview</h1>
          <p className={typography.pageSubtitle}>Welcome to your AI ChatBot SaaS platform</p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${spacing.cardGridLarge}`}>
          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Total Bots</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBots}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <div className={`${spacing.cardContent} flex items-center ${typography.meta}`}>
              <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
              <span>Active bots in your system</span>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Active Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <div className={`${spacing.cardContent} flex items-center ${typography.meta}`}>
              <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
              <span>Currently active chats</span>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Knowledge Bases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalKnowledgeBases}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <div className={`${spacing.cardContent} flex items-center ${typography.meta}`}>
              <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
              <span>Document collections</span>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-700" />
              </div>
            </div>
            <div className={`${spacing.cardContent} flex items-center ${typography.meta}`}>
              <TrendingUp className="w-4 h-4 mr-1 text-gray-400" />
              <span>Team members</span>
            </div>
          </div>
      </div>

        {/* Recent Activity & Quick Actions */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${spacing.cardGridLarge}`}>
          {/* Recent Activity */}
          <div className={`${cardBase} ${cardPadding.default}`}>
            <h3 className={`${typography.sectionTitle} mb-4`}>Recent Activity</h3>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className={typography.body}>{activity.description}</p>
                    <p className={typography.meta}>{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

          {/* Quick Actions */}
          <div className={`${cardBase} ${cardPadding.default}`}>
            <h3 className={`${typography.sectionTitle} mb-4`}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-[2px] rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                  : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
              }`}>
                <button 
                  onClick={() => router.push('/dashboard/bots/create')}
                  className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                      : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                  }`}
                >
                  <Bot className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <span>Create New Bot</span>
                </button>
              </div>
              <div className={`p-[2px] rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                  : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
              }`}>
                <button 
                  onClick={() => router.push('/dashboard/knowledge-bases/upload')}
                  className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                      : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                  }`}
                >
                  <Database className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <span>Upload Documents</span>
                </button>
              </div>
              <div className={`p-[2px] rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                  : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
              }`}>
                <button 
                  onClick={() => router.push('/dashboard/widgets/create')}
                  className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                      : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                  }`}
                >
                  <Square className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <span>Generate Widget</span>
                </button>
              </div>
              <div className={`p-[2px] rounded-lg ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                  : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
              }`}>
                <button 
                  onClick={() => router.push('/dashboard/users')}
                  className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                      : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                  }`}
                >
                  <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                  <span>Invite Team Member</span>
                </button>
              </div>
            </div>
          </div>
      </div>

        {/* Platform Health */}
        <div className={`${cardBase} ${cardPadding.default}`}>
          <h3 className={`${typography.sectionTitle} mb-4`}>Platform Health</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* System Online Chip */}
          <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full px-4 py-3 flex items-center space-x-3 shadow-md border border-green-100/50">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className={typography.sectionTitle}>System Online</p>
            </div>
          </div>

          {/* Bots Ready Chip */}
          <div className="flex-1 bg-gradient-to-r from-pink-50 to-rose-50 rounded-full px-4 py-3 flex items-center space-x-3 shadow-md border border-pink-100/50">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className={typography.sectionTitle}>Bots Ready</p>
              <p className={typography.meta}>{stats.totalBots > 0 ? `${stats.totalBots} active` : 'No bots'}</p>
            </div>
          </div>

          {/* User Activity Chip */}
          <div className="flex-1 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-full px-4 py-3 flex items-center space-x-3 shadow-md border border-yellow-100/50">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className={typography.sectionTitle}>User Activity</p>
              <p className={typography.meta}>{stats.totalUsers > 0 ? 'Active now' : 'No active users'}</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AppPage>
  );
} 