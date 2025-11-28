'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  Target, 
  Activity, 
  Calendar, 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { AppPage } from '@/components/dashboard/AppPage';
import { StatCard } from '@/components/dashboard/StatCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';
import { useTheme } from '@/contexts/ThemeContext';

interface AnalyticsData {
  conversations: {
    total: number;
    active: number;
    completed: number;
    abandoned: number;
    avgDuration: number;
    peakHours: Array<{ hour: number; count: number }>;
  };
  users: {
    total: number;
    new: number;
    returning: number;
    active: number;
    demographics: Array<{ age: string; count: number; percentage: number }>;
    locations: Array<{ country: string; count: number; percentage: number }>;
  };
  performance: {
    avgResponseTime: number;
    satisfactionScore: number;
    resolutionRate: number;
    uptime: number;
    errorRate: number;
    latency: number;
  };
  timeSeriesData: Array<{
    date: string;
    conversations: number;
    users: number;
    satisfaction: number;
    responseTime: number;
    errors: number;
  }>;
  botPerformance: Array<{
    name: string;
    conversations: number;
    satisfaction: number;
    responseTime: number;
    successRate: number;
    avgSessionLength: number;
  }>;
  conversationTopics: Array<{
    topic: string;
    count: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    avgResolutionTime: number;
  }>;
  userJourney: Array<{
    stage: string;
    users: number;
    conversion: number;
    avgTime: number;
  }>;
  realTimeMetrics: {
    currentUsers: number;
    activeConversations: number;
    avgWaitTime: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  };
}

// Default empty analytics data structure
const defaultAnalyticsData: AnalyticsData = {
  conversations: {
    total: 0,
    active: 0,
    completed: 0,
    abandoned: 0,
    avgDuration: 0,
    peakHours: []
  },
  users: {
    total: 0,
    new: 0,
    returning: 0,
    active: 0,
    demographics: [],
    locations: []
  },
  performance: {
    avgResponseTime: 0,
    satisfactionScore: 0,
    resolutionRate: 0,
    uptime: 0,
    errorRate: 0,
    latency: 0
  },
  timeSeriesData: [],
  botPerformance: [],
  conversationTopics: [],
  userJourney: [],
  realTimeMetrics: {
    currentUsers: 0,
    activeConversations: 0,
    avgWaitTime: 0,
    systemHealth: 'excellent'
  }
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('conversations');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [showRealTime, setShowRealTime] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData>(defaultAnalyticsData);

  // Check if there's any meaningful data
  const hasData = data.conversations.total > 0 || data.users.total > 0 || data.timeSeriesData.length > 0;

  // Fetch analytics data from API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const apiData = await response.json();
        setData(apiData);
      } else {
        console.error('Failed to fetch analytics data');
        setData(defaultAnalyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setData(defaultAnalyticsData);
    } finally {
      setIsRefreshing(false);
    }
  }, [timeRange]);

  // Fetch live metrics from API
  const fetchLiveMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/analytics/live');
      if (response.ok) {
        const liveData = await response.json();
        setData(prev => ({
          ...prev,
          realTimeMetrics: {
            currentUsers: liveData.currentUsers,
            activeConversations: liveData.activeConversations,
            avgWaitTime: liveData.avgWaitTime,
            systemHealth: liveData.systemHealth
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching live metrics:', error);
    }
  }, []);

  // Fetch data on component mount and when timeRange changes
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Fetch live metrics every 30 seconds when real-time is enabled
  useEffect(() => {
    if (!showRealTime) return;

    fetchLiveMetrics();

    const interval = setInterval(() => {
      fetchLiveMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [showRealTime, fetchLiveMetrics]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'conversations':
        return data.timeSeriesData.map(d => ({ date: d.date, value: d.conversations }));
      case 'users':
        return data.timeSeriesData.map(d => ({ date: d.date, value: d.users }));
      case 'satisfaction':
        return data.timeSeriesData.map(d => ({ date: d.date, value: d.satisfaction }));
      case 'responseTime':
        return data.timeSeriesData.map(d => ({ date: d.date, value: d.responseTime }));
      case 'errors':
        return data.timeSeriesData.map(d => ({ date: d.date, value: d.errors }));
      default:
        return data.timeSeriesData.map(d => ({ date: d.date, value: d.conversations }));
    }
  };

  const handleRefresh = useCallback(async () => {
    await fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleExport = useCallback(() => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Conversations,Users,Satisfaction,ResponseTime,Errors\n" +
      data.timeSeriesData.map(row => 
        `${row.date},${row.conversations},${row.users},${row.satisfaction},${row.responseTime},${row.errors}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, timeRange]);

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-emerald-600 bg-emerald-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getChartColor = () => {
    return theme === 'dark' ? '#825037' : '#F973B9';
  };

  const renderChart = () => {
    const chartData = getMetricData();
    const chartColor = getChartColor();
    
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              strokeWidth={2}
              dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              fill={chartColor} 
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip />
            <Bar dataKey="value" fill={chartColor} />
          </RechartsBarChart>
        );
      default:
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              strokeWidth={2}
              dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={typography.pageTitle}>Analytics Dashboard</h1>
            <p className={typography.pageSubtitle}>Monitor your AI chatbots performance and user engagement</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700 text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleExport}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* No Data State */}
        {!hasData && (
          <div className={`${cardBase} ${cardPadding.default} text-center`}>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className={`${typography.sectionTitle} text-base mb-3`}>No Analytics Data Available</h3>
            <p className={`${typography.body} mb-8 max-w-md mx-auto`}>
              Start using your chatbots to see analytics data here. Create conversations, upload documents, and engage with users to generate meaningful insights.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard/bots/create'}
                className="rounded-full bg-accent-soft text-white px-6 py-3 text-sm font-medium hover:bg-accent-soft/80 transition-colors"
              >
                Create Your First Bot
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/knowledge-bases/upload'}
                className="rounded-full bg-white text-gray-700 border border-gray-200 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Upload Documents
              </button>
            </div>
          </div>
        )}

        {/* Live Metrics Bar */}
        {hasData && (
          <div className={`${cardBase} ${cardPadding.compact} flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className={typography.sectionTitle}>Live Metrics</span>
              {showRealTime && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  Auto-refresh every 30s
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{data.realTimeMetrics.currentUsers} active users</span>
              <span>{data.realTimeMetrics.activeConversations} conversations</span>
              <span>{data.realTimeMetrics.avgWaitTime.toFixed(1)}s avg wait</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getSystemHealthColor(data.realTimeMetrics.systemHealth)}`}>
                {getSystemHealthIcon(data.realTimeMetrics.systemHealth)}
                <span className="text-xs font-medium">{data.realTimeMetrics.systemHealth}</span>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Content - Only show when there's data */}
        {hasData && (
          <>
            {/* Key Metrics */}
            <div className={`grid grid-cols-1 gap-5 md:grid-cols-4`}>
              <StatCard
                icon={<MessageSquare className="w-4 h-4 text-gray-600" />}
                title="Total Conversations"
                value={formatNumber(data.conversations.total)}
              />
              <StatCard
                icon={<Users className="w-4 h-4 text-gray-600" />}
                title="Active Users"
                value={formatNumber(data.users.active)}
              />
              <StatCard
                icon={<Clock className="w-4 h-4 text-gray-600" />}
                title="Avg Response Time"
                value={`${data.performance.avgResponseTime}s`}
              />
              <StatCard
                icon={<Target className="w-4 h-4 text-gray-600" />}
                title="Satisfaction Score"
                value={`${data.performance.satisfactionScore}%`}
              />
            </div>

            {/* Charts Section */}
            <div className={`grid grid-cols-1 gap-6 md:grid-cols-2`}>
              {/* Performance Trends */}
              <SectionCard
                title="Performance Trends"
                action={
                  <div className="flex items-center gap-2">
                    {['conversations', 'users', 'satisfaction', 'responseTime'].map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setSelectedMetric(metric)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedMetric === metric
                            ? 'bg-accent-soft text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="mt-4 flex items-center justify-end gap-2 mb-4">
                  <button
                    onClick={() => setChartType('line')}
                    className={`p-1.5 rounded ${chartType === 'line' ? 'bg-accent-soft text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartType('area')}
                    className={`p-1.5 rounded ${chartType === 'area' ? 'bg-accent-soft text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-accent-soft text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Bot Performance */}
              <SectionCard title="Bot Performance">
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={data.botPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Tooltip />
                      <Bar dataKey="conversations" fill={getChartColor()} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Conversation Topics */}
              <SectionCard title="Conversation Topics">
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.conversationTopics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ topic, percentage }) => `${topic}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.conversationTopics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* User Journey */}
              <SectionCard title="User Journey Funnel">
                <div className="mt-4 space-y-4">
                  {data.userJourney.map((stage, index) => (
                    <div key={stage.stage} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className={typography.body}>{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <span className={typography.meta}>{stage.users} users</span>
                          <span className={typography.meta}>({stage.avgTime.toFixed(1)}s avg)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent-soft h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stage.conversion}%` }}
                        ></div>
                      </div>
                      <span className={typography.meta}>{stage.conversion}% conversion</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Peak Hours Analysis */}
              <SectionCard title="Peak Activity Hours">
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.conversations.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Bot Performance Radar */}
              <SectionCard title="Bot Performance Radar">
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data.botPerformance}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <PolarRadiusAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Radar
                        name="Performance"
                        dataKey="satisfaction"
                        stroke={getChartColor()}
                        fill={getChartColor()}
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Conversation Status */}
              <SectionCard title="Conversation Status">
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Active</span>
                    <span className={`${typography.body} font-semibold`}>{data.conversations.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Completed</span>
                    <span className={`${typography.body} font-semibold`}>{data.conversations.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Abandoned</span>
                    <span className={`${typography.body} font-semibold`}>{data.conversations.abandoned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Avg Duration</span>
                    <span className={`${typography.body} font-semibold`}>{data.conversations.avgDuration}m</span>
                  </div>
                </div>
              </SectionCard>

              {/* Performance Metrics */}
              <SectionCard title="Performance Metrics">
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Resolution Rate</span>
                    <span className={`${typography.body} font-semibold`}>{data.performance.resolutionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Uptime</span>
                    <span className={`${typography.body} font-semibold`}>{data.performance.uptime}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Error Rate</span>
                    <span className={`${typography.body} font-semibold`}>{data.performance.errorRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={typography.body}>Latency</span>
                    <span className={`${typography.body} font-semibold`}>{data.performance.latency}ms</span>
                  </div>
                </div>
              </SectionCard>

              {/* Quick Actions */}
              <SectionCard title="Quick Actions">
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className={`p-[2px] rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                      : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
                  }`}>
                    <button 
                      onClick={handleExport}
                      className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                          : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                      }`}
                    >
                      <Download className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                      <span>Export Report</span>
                    </button>
                  </div>
                  <div className={`p-[2px] rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                      : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
                  }`}>
                    <button className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                        : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                    }`}>
                      <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                      <span>Schedule Report</span>
                    </button>
                  </div>
                  <div className={`p-[2px] rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                      : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
                  }`}>
                    <button className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                        : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                    }`}>
                      <AlertCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                      <span>Set Alerts</span>
                    </button>
                  </div>
                  <div className={`p-[2px] rounded-lg ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780]' 
                      : 'bg-gradient-to-r from-[#FFD6EF] via-[#F8EAFE] to-[#FFFCEB]'
                  }`}>
                    <button 
                      onClick={() => setShowRealTime(!showRealTime)}
                      className={`w-full px-4 py-6 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-[#563517b3] via-[#825037b3] to-[#F5C06780] text-white'
                          : 'bg-gradient-to-r from-[#FFB8D9] via-[#E8C5F8] to-[#FFE8B8] text-gray-900'
                      }`}
                    >
                      {showRealTime ? (
                        <EyeOff className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                      ) : (
                        <Eye className={`w-4 h-4 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`} />
                      )}
                      <span>{showRealTime ? 'Hide Real-time' : 'Show Real-time'}</span>
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </AppPage>
  );
}
