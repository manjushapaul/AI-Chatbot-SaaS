import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

export interface AnalyticsMetrics {
  conversations: number;
  users: number;
  satisfaction: number;
  responseTime: number;
  errors: number;
}

export interface TimeSeriesPoint {
  date: string;
  conversations: number;
  users: number;
  satisfaction: number;
  responseTime: number;
  errors: number;
}

export interface BotPerformance {
  name: string;
  conversations: number;
  satisfaction: number;
  responseTime: number;
  successRate: number;
  avgSessionLength: number;
}

export interface ConversationTopic {
  topic: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  avgResolutionTime: number;
}

export interface UserJourneyStage {
  stage: string;
  users: number;
  conversion: number;
  avgTime: number;
}

export interface PeakHourData {
  hour: number;
  count: number;
}

export interface RealTimeMetrics {
  currentUsers: number;
  activeConversations: number;
  avgWaitTime: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface AnalyticsData {
  conversations: {
    total: number;
    active: number;
    completed: number;
    abandoned: number;
    avgDuration: number;
    peakHours: PeakHourData[];
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
  timeSeriesData: TimeSeriesPoint[];
  botPerformance: BotPerformance[];
  conversationTopics: ConversationTopic[];
  userJourney: UserJourneyStage[];
  realTimeMetrics: RealTimeMetrics;
}

// Chart color schemes
export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#F59E0B', /* amber-500 */
  lime: '#84CC16',
  gray: '#6B7280',
  indigo: '#6366F1',
};

export const CHART_COLORS_ARRAY = Object.values(CHART_COLORS);

// Utility functions
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const formatPercentage = (num: number): string => `${num}%`;

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Date utilities
export const getDateRange = (timeRange: string): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  let startDate: Date;

  switch (timeRange) {
    case '24h':
      startDate = subDays(endDate, 1);
      break;
    case '7d':
      startDate = subDays(endDate, 7);
      break;
    case '30d':
      startDate = subDays(endDate, 30);
      break;
    case '90d':
      startDate = subDays(endDate, 90);
      break;
    default:
      startDate = subDays(endDate, 7);
  }

  return { startDate, endDate };
};

export const formatDate = (date: string | Date, formatStr = 'MMM dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

// Data processing utilities
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const calculateMovingAverage = (data: number[], window: number): number[] => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const values = data.slice(start, i + 1);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    result.push(average);
  }
  return result;
};

export const aggregateDataByPeriod = (
  data: TimeSeriesPoint[],
  period: 'hour' | 'day' | 'week' | 'month'
): TimeSeriesPoint[] => {
  // Implementation depends on your specific needs
  // For now, return the data as-is
  return data;
};

// Chart configuration helpers
export const getChartConfig = (chartType: 'line' | 'area' | 'bar') => {
  const baseConfig = {
    stroke: CHART_COLORS.primary,
    fill: CHART_COLORS.primary,
    strokeWidth: 2,
    fillOpacity: 0.3,
  };

  switch (chartType) {
    case 'line':
      return {
        ...baseConfig,
        dot: { fill: CHART_COLORS.primary, strokeWidth: 2, r: 4 },
      };
    case 'area':
      return {
        ...baseConfig,
        fillOpacity: 0.3,
      };
    case 'bar':
      return {
        ...baseConfig,
        fill: CHART_COLORS.primary,
      };
    default:
      return baseConfig;
  }
};

// Performance indicators
export const getPerformanceIndicator = (value: number, thresholds: { good: number; warning: number }): 'good' | 'warning' | 'critical' => {
  if (value >= thresholds.good) return 'good';
  if (value >= thresholds.warning) return 'warning';
  return 'critical';
};

export const getSatisfactionColor = (score: number): string => {
  if (score >= 90) return CHART_COLORS.secondary;
  if (score >= 70) return CHART_COLORS.accent;
  return CHART_COLORS.danger;
};

export const getResponseTimeColor = (time: number): string => {
  if (time <= 2) return CHART_COLORS.secondary;
  if (time <= 5) return CHART_COLORS.accent;
  return CHART_COLORS.danger;
};

// Export utilities
export const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string): void => {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = <T>(data: T, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Real-time metrics helpers
export const getSystemHealthColor = (health: RealTimeMetrics['systemHealth']): string => {
  switch (health) {
    case 'excellent': return 'text-accent-strong bg-green-100';
    case 'good': return 'text-accent-strong bg-blue-100';
    case 'warning': return 'text-accent-strong bg-yellow-100';
    case 'critical': return 'text-accent-strong bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const getSystemHealthIcon = (health: RealTimeMetrics['systemHealth']) => {
  // This would return the appropriate icon component
  // For now, return a string that can be used with your icon library
  return health;
};

// Mock data generator for development
export const generateMockData = (timeRange: string): AnalyticsData => {
  const { startDate, endDate } = getDateRange(timeRange);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  
  const timeSeriesData: TimeSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    timeSeriesData.push({
      date: date.toISOString().split('T')[0],
      conversations: Math.floor(Math.random() * 100) + 20,
      users: Math.floor(Math.random() * 50) + 10,
      satisfaction: Math.floor(Math.random() * 20) + 80,
      responseTime: Math.random() * 3 + 1,
      errors: Math.floor(Math.random() * 5),
    });
  }

  return {
    conversations: {
      total: 1247,
      active: 23,
      completed: 1189,
      abandoned: 35,
      avgDuration: 8.5,
      peakHours: [
        { hour: 9, count: 45 }, { hour: 10, count: 67 }, { hour: 11, count: 89 },
        { hour: 12, count: 78 }, { hour: 13, count: 92 }, { hour: 14, count: 85 },
        { hour: 15, count: 76 }, { hour: 16, count: 68 }, { hour: 17, count: 54 }
      ]
    },
    users: {
      total: 156,
      new: 23,
      returning: 133,
      active: 89,
      demographics: [
        { age: '18-24', count: 34, percentage: 22 },
        { age: '25-34', count: 67, percentage: 43 },
        { age: '35-44', count: 32, percentage: 21 },
        { age: '45+', count: 23, percentage: 15 }
      ],
      locations: [
        { country: 'United States', count: 89, percentage: 57 },
        { country: 'Canada', count: 23, percentage: 15 },
        { country: 'United Kingdom', count: 18, percentage: 12 },
        { country: 'Germany', count: 12, percentage: 8 },
        { country: 'Other', count: 14, percentage: 9 }
      ]
    },
    performance: {
      avgResponseTime: 2.3,
      satisfactionScore: 94,
      resolutionRate: 87,
      uptime: 99.8,
      errorRate: 0.2,
      latency: 45
    },
    timeSeriesData,
    botPerformance: [
      { name: 'Customer Support Bot', conversations: 567, satisfaction: 96, responseTime: 1.8, successRate: 94, avgSessionLength: 12.5 },
      { name: 'Sales Assistant', conversations: 423, satisfaction: 92, responseTime: 2.1, successRate: 89, avgSessionLength: 8.3 },
      { name: 'FAQ Bot', conversations: 234, satisfaction: 89, responseTime: 1.5, successRate: 91, avgSessionLength: 5.7 },
      { name: 'Onboarding Bot', conversations: 23, satisfaction: 94, responseTime: 2.8, successRate: 87, avgSessionLength: 15.2 }
    ],
    conversationTopics: [
      { topic: 'Product Support', count: 456, percentage: 37, trend: 'up', avgResolutionTime: 6.2 },
      { topic: 'Billing & Payments', count: 234, percentage: 19, trend: 'stable', avgResolutionTime: 4.8 },
      { topic: 'Technical Issues', count: 189, percentage: 15, trend: 'down', avgResolutionTime: 8.1 },
      { topic: 'General Inquiries', count: 156, percentage: 13, trend: 'up', avgResolutionTime: 3.5 },
      { topic: 'Feature Requests', count: 123, percentage: 10, trend: 'stable', avgResolutionTime: 5.9 },
      { topic: 'Other', count: 89, percentage: 7, trend: 'down', avgResolutionTime: 4.2 }
    ],
    userJourney: [
      { stage: 'Landing Page', users: 1000, conversion: 100, avgTime: 0 },
      { stage: 'Chat Initiated', users: 450, conversion: 45, avgTime: 2.3 },
      { stage: 'First Response', users: 380, conversion: 38, avgTime: 5.1 },
      { stage: 'Issue Resolved', users: 330, conversion: 33, avgTime: 12.8 },
      { stage: 'Satisfaction Survey', users: 280, conversion: 28, avgTime: 15.2 },
      { stage: 'Return Visit', users: 220, conversion: 22, avgTime: 0 }
    ],
    realTimeMetrics: {
      currentUsers: 23,
      activeConversations: 15,
      avgWaitTime: 1.2,
      systemHealth: 'excellent'
    }
  };
}; 