'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bot, Settings, MessageSquare, FileText, ArrowLeft, Edit, Trash2, Brain } from 'lucide-react';
import Link from 'next/link';

interface BotData {
  id: string;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  
  const [bot, setBot] = useState<BotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBot = async () => {
      try {
        setIsLoading(true);
        console.log('[Bot Detail] Fetching bot:', botId);
        
        const response = await fetch(`/api/bots/${botId}`);
        console.log('[Bot Detail] Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('[Bot Detail] Response data:', result);
          
          if (result.success) {
            setBot(result.data);
          } else {
            setError(result.error || 'Failed to fetch bot');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[Bot Detail] Error response:', errorData);
          setError(errorData.error || 'Bot not found or you don\'t have access to it');
        }
      } catch (error) {
        console.error('[Bot Detail] Error fetching bot:', error);
        setError('Failed to fetch bot');
      } finally {
        setIsLoading(false);
      }
    };

    if (botId) {
      fetchBot();
    }
  }, [botId]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <strong>Error:</strong> {error || 'Bot not found'}
          </div>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 text-sm">
            <strong>💡 Tip:</strong> If you see this error, you might be signed in with the wrong account. 
            Make sure you're logged in with the account that owns this bot.
          </div>
          <div className="mt-4 flex gap-3">
            <Link 
              href="/dashboard/bots"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bots
            </Link>
            <button
              onClick={() => window.location.href = '/auth/signin'}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard/bots"
              className="inline-flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-gray-700" />
              <span className="text-sm">Back to Bots</span>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{bot.name}</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/dashboard/bots/${botId}/edit`}
              className="inline-flex items-center px-4 py-2 bg-accent-soft text-white rounded-full hover:bg-accent-soft/80 transition-colors text-sm font-medium"
            >
              <Edit className="w-4 h-4 mr-2 text-white" />
              Edit Bot
            </Link>
            <button className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-full transition-colors text-sm font-medium">
              <Trash2 className="w-4 h-4 mr-2 text-gray-600" />
              Delete Bot
            </button>
          </div>
        </div>

        {/* Bot Overview */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="text-6xl">{bot.avatar}</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{bot.name}</h2>
              <p className="text-gray-500 mb-4">{bot.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Model:</span>
                  <span className="ml-2 text-sm text-gray-900">{bot.model}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Temperature:</span>
                  <span className="ml-2 text-sm text-gray-900">{bot.temperature}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Max Tokens:</span>
                  <span className="ml-2 text-sm text-gray-900">{bot.maxTokens}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    bot.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {bot.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-gray-700" />
            Personality & Behavior
          </h3>
          <p className="text-gray-500 whitespace-pre-wrap">{bot.personality}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6">
          <Link 
            href={`/dashboard/bots/${botId}/chat`}
            className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 p-8 hover:shadow-lg transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                <MessageSquare className="w-6 h-6 text-gray-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Chat</h3>
                <p className="text-sm text-gray-500">Test your bot with a conversation to see how it responds</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 