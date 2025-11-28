'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Users,
  Bot,
  BarChart3,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

interface UsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  totalCost: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<string, number>;
}

interface UsageTrend {
  date: string;
  requests: number;
  tokens: number;
}

interface TopConsumer {
  id: string;
  type: 'user' | 'bot';
  requests: number;
  tokens: number;
}

interface RateLimitInfo {
  isAllowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  nextResetTime: Date;
}

interface APIUsageData {
  summary: UsageSummary;
  trends: UsageTrend[];
  topConsumers: TopConsumer[];
  rateLimit: RateLimitInfo;
  timeRange: string;
  lastUpdated: string;
}

export default function APIUsagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<APIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month');
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    fetchAPIUsage();
  }, [status, router, timeRange, days]);

  const fetchAPIUsage = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/billing/api-usage?timeRange=${timeRange}&days=${days}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        setLoading(false);
      } else {
        console.error('Failed to fetch API usage data');
      }
    } catch (error) {
      console.error('Error fetching API usage:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const formatResponseTime = (time: number) => {
    return `${time.toFixed(0)}ms`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '2xx': return 'text-accent-strong';
      case '4xx': return 'text-accent-strong';
      case '5xx': return 'text-accent-strong';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading API usage information...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-accent-strong mx-auto text-accent-strong" />
          <p className="mt-4 text-gray-600">Failed to load API usage data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Usage & Analytics</h1>
              <p className="mt-2 text-gray-600">
                Monitor your API usage, track rate limits, and analyze performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-accent-strong" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              <button
                onClick={fetchAPIUsage}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-accent-strong text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>

        {/* Rate Limit Status */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Limit Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-strong">
                {formatNumber(data.rateLimit.currentUsage)}
              </div>
              <p className="text-gray-600">Current Usage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-strong">
                {data.rateLimit.limit === -1 ? '∞' : formatNumber(data.rateLimit.remaining)}
              </div>
              <p className="text-gray-600">Remaining</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-strong">
                {data.rateLimit.limit === -1 ? '∞' : formatNumber(data.rateLimit.limit)}
              </div>
              <p className="text-gray-600">Monthly Limit</p>
            </div>
          </div>
          
          {/* Usage Progress Bar */}
          {data.rateLimit.limit !== -1 && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Usage Progress</span>
                <span>{getUsagePercentage(data.rateLimit.currentUsage, data.rateLimit.limit).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    getUsagePercentage(data.rateLimit.currentUsage, data.rateLimit.limit) > 80
                      ? 'bg-red-500'
                      : getUsagePercentage(data.rateLimit.currentUsage, data.rateLimit.limit) > 60
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${getUsagePercentage(data.rateLimit.currentUsage, data.rateLimit.limit)}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Resets on {new Date(data.rateLimit.nextResetTime).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Usage Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-white" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.summary.totalRequests)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-accent-strong" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.summary.totalRequests > 0 
                    ? ((data.summary.successfulRequests / data.summary.totalRequests) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-accent-strong" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTokens(data.summary.totalTokens)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-accent-strong" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatResponseTime(data.summary.averageResponseTime)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Trends Chart */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Trends</h2>
          <div className="h-64 flex items-end space-x-2">
            {data.trends.map((trend, index) => (
              <div key={trend.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-blue-100 rounded-t-sm" style={{
                  height: `${Math.max(10, (trend.requests / Math.max(...data.trends.map(t => t.requests))) * 200)}px`
                }}></div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  {formatDate(trend.date)}
                </div>
                <div className="text-xs text-gray-700 mt-1 text-center">
                  {trend.requests}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Consumers */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top API Consumers</h2>
          <div className="space-y-4">
            {data.topConsumers.map((consumer, index) => (
              <div key={consumer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {consumer.type === 'user' ? (
                      <Users className="w-4 h-4 text-accent-strong" />
                    ) : (
                      <Bot className="w-4 h-4 text-accent-strong" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {consumer.type === 'user' ? 'User' : 'Bot'} {consumer.id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{consumer.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatNumber(consumer.requests)} requests</p>
                  <p className="text-sm text-gray-500">{formatTokens(consumer.tokens)} tokens</p>
                </div>
              </div>
            ))}
            {data.topConsumers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 text-accent-strong mx-auto mb-4 text-accent-strong" />
                <p>No usage data available for the selected time period</p>
              </div>
            )}
          </div>
        </div>

        {/* Endpoint Breakdown */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Requests by Endpoint</h2>
          <div className="space-y-3">
            {Object.entries(data.summary.requestsByEndpoint).map(([endpoint, count]) => (
              <div key={endpoint} className="flex items-center justify-between">
                <span className="text-gray-700 font-mono text-sm">{endpoint}</span>
                <span className="font-medium text-gray-900">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Code Breakdown */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Requests by Status</h2>
          <div className="space-y-3">
            {Object.entries(data.summary.requestsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`font-mono text-sm ${getStatusColor(status)}`}>{status}</span>
                <span className="font-medium text-gray-900">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 