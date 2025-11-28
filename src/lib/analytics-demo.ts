import {
  StatisticalCalculator,
  TimeSeriesAnalyzer,
  BusinessIntelligence,
  DataProcessor,
  PerformanceAnalytics,
  UserBehaviorAnalytics,
  exportAnalyticsData,
  generateTimeIntervals,
  calculatePercentageChange,
  formatLargeNumber,
  getPerformanceColor,
  generateAnalyticsId
} from './analytics-utils';

// ============================================================================
// DEMO: STATISTICAL CALCULATIONS
// ============================================================================

export const demonstrateStatisticalCalculations = () => {
  console.log('=== STATISTICAL CALCULATIONS DEMO ===');
  
  const responseTimes = [1.2, 1.8, 2.1, 1.5, 3.2, 1.9, 2.5, 1.7, 2.8, 1.3];
  
  console.log('Response Times:', responseTimes);
  console.log('Mean:', StatisticalCalculator.mean(responseTimes).toFixed(2));
  console.log('Median:', StatisticalCalculator.median(responseTimes).toFixed(2));
  console.log('Mode:', StatisticalCalculator.mode(responseTimes));
  console.log('Standard Deviation:', StatisticalCalculator.standardDeviation(responseTimes).toFixed(2));
  console.log('Variance:', StatisticalCalculator.variance(responseTimes).toFixed(2));
  
  const { q1, q2, q3 } = StatisticalCalculator.quartiles(responseTimes);
  console.log('Quartiles - Q1:', q1.toFixed(2), 'Q2:', q2.toFixed(2), 'Q3:', q3.toFixed(2));
  console.log('IQR:', StatisticalCalculator.iqr(responseTimes).toFixed(2));
  
  const outliers = StatisticalCalculator.detectOutliers(responseTimes);
  console.log('Outliers:', outliers);
  
  const p95 = StatisticalCalculator.percentile(responseTimes, 95);
  const p99 = StatisticalCalculator.percentile(responseTimes, 99);
  console.log('95th Percentile:', p95.toFixed(2));
  console.log('99th Percentile:', p99.toFixed(2));
};

// ============================================================================
// DEMO: TIME SERIES ANALYSIS
// ============================================================================

export const demonstrateTimeSeriesAnalysis = () => {
  console.log('\n=== TIME SERIES ANALYSIS DEMO ===');
  
  // Simulate daily conversation data over 30 days
  const dailyConversations = Array.from({ length: 30 }, (_, i) => {
    const base = 100;
    const trend = i * 2; // Increasing trend
    const seasonal = 20 * Math.sin((i / 30) * 2 * Math.PI); // Weekly seasonality
    const noise = (Math.random() - 0.5) * 10; // Random noise
    return Math.max(0, Math.round(base + trend + seasonal + noise));
  });
  
  console.log('Daily Conversations (first 10 days):', dailyConversations.slice(0, 10));
  
  // Moving average
  const movingAvg7 = TimeSeriesAnalyzer.movingAverage(dailyConversations, 7);
  console.log('7-day Moving Average (first 10 days):', movingAvg7.slice(0, 10).map(v => v.toFixed(1)));
  
  // Exponential moving average
  const ema = TimeSeriesAnalyzer.exponentialMovingAverage(dailyConversations, 0.1);
  console.log('EMA (α=0.1) (first 10 days):', ema.slice(0, 10).map(v => v.toFixed(1)));
  
  // Seasonality detection
  const seasonality = TimeSeriesAnalyzer.detectSeasonality(dailyConversations);
  console.log('Detected Seasonality (days):', seasonality);
  
  // Decomposition
  const decomposed = TimeSeriesAnalyzer.decompose(dailyConversations, 7);
  console.log('Trend component (first 10 days):', decomposed.trend.slice(0, 10).map(v => v.toFixed(1)));
  
  // Forecasting
  const forecast = TimeSeriesAnalyzer.forecast(dailyConversations, 7);
  console.log('7-day Forecast:', forecast.map(v => v.toFixed(1)));
};

// ============================================================================
// DEMO: BUSINESS INTELLIGENCE
// ============================================================================

export const demonstrateBusinessIntelligence = () => {
  console.log('\n=== BUSINESS INTELLIGENCE DEMO ===');
  
  // Customer Lifetime Value
  const clv = BusinessIntelligence.calculateCLV(50, 2.5, 3, 25);
  console.log('Customer Lifetime Value: $', clv.toFixed(2));
  
  // Customer Acquisition Cost
  const cac = BusinessIntelligence.calculateCAC(10000, 200);
  console.log('Customer Acquisition Cost: $', cac.toFixed(2));
  
  // Retention Rate
  const retentionRate = BusinessIntelligence.calculateRetentionRate(1000, 850, 100);
  console.log('Customer Retention Rate:', retentionRate.toFixed(1) + '%');
  
  // Churn Rate
  const churnRate = BusinessIntelligence.calculateChurnRate(1000, 850, 100);
  console.log('Customer Churn Rate:', churnRate.toFixed(1) + '%');
  
  // Net Promoter Score
  const nps = BusinessIntelligence.calculateNPS(300, 150, 50);
  console.log('Net Promoter Score:', nps.toFixed(1));
  
  // Conversion Rate
  const conversionRate = BusinessIntelligence.calculateConversionRate(150, 1000);
  console.log('Conversion Rate:', conversionRate.toFixed(1) + '%');
  
  // Average Order Value
  const aov = BusinessIntelligence.calculateAOV(25000, 500);
  console.log('Average Order Value: $', aov.toFixed(2));
  
  // Revenue per User
  const rpu = BusinessIntelligence.calculateRPU(25000, 1000);
  console.log('Revenue per User: $', rpu.toFixed(2));
};

// ============================================================================
// DEMO: DATA PROCESSING
// ============================================================================

export const demonstrateDataProcessing = () => {
  console.log('\n=== DATA PROCESSING DEMO ===');
  
  // Sample conversation data
  const conversationData = [
    { id: 1, date: '2024-01-01', bot: 'Support', duration: 120, satisfaction: 5, country: 'US' },
    { id: 2, date: '2024-01-01', bot: 'Sales', duration: 180, satisfaction: 4, country: 'US' },
    { id: 3, date: '2024-01-02', bot: 'Support', duration: 90, satisfaction: 3, country: 'CA' },
    { id: 4, date: '2024-01-02', bot: 'FAQ', duration: 45, satisfaction: 5, country: 'UK' },
    { id: 5, date: '2024-01-03', bot: 'Support', duration: 200, satisfaction: 4, country: 'US' },
    { id: 6, date: '2024-01-03', bot: 'Sales', duration: 150, satisfaction: 5, country: 'CA' },
  ];
  
  console.log('Original Data:', conversationData);
  
  // Aggregate by time period
  const dailyStats = DataProcessor.aggregateByTimePeriod(
    conversationData,
    'date',
    ['duration', 'satisfaction'],
    'day',
    'average'
  );
  console.log('Daily Aggregated Stats:', dailyStats);
  
  // Group by bot and aggregate
  const botStats = DataProcessor.groupAndAggregate(
    conversationData,
    'bot',
    ['duration', 'satisfaction'],
    'average'
  );
  console.log('Bot Performance Stats:', botStats);
  
  // Filter data
  const highSatisfaction = DataProcessor.filterData(conversationData, {
    satisfaction: { operator: 'gte', value: 4 }
  });
  console.log('High Satisfaction Conversations:', highSatisfaction);
  
  // Sort data
  const sortedByDuration = DataProcessor.sortData(conversationData, [
    { field: 'duration', direction: 'desc' }
  ]);
  console.log('Sorted by Duration (desc):', sortedByDuration);
  
  // Paginate data
  const paginated = DataProcessor.paginateData(conversationData, 1, 3);
  console.log('Paginated Data (Page 1, Size 3):', paginated);
};

// ============================================================================
// DEMO: PERFORMANCE ANALYTICS
// ============================================================================

export const demonstratePerformanceAnalytics = () => {
  console.log('\n=== PERFORMANCE ANALYTICS DEMO ===');
  
  // Response time data (in seconds)
  const responseTimes = [0.5, 0.8, 1.2, 1.5, 2.1, 2.8, 3.2, 4.1, 5.2, 8.9];
  
  // Response time metrics
  const responseMetrics = PerformanceAnalytics.calculateResponseTimeMetrics(responseTimes);
  console.log('Response Time Metrics:', responseMetrics);
  
  // Availability metrics
  const availability = PerformanceAnalytics.calculateAvailabilityMetrics(
    86400, // 24 hours in seconds
    300,   // 5 minutes downtime
    1800   // 30 minutes planned maintenance
  );
  console.log('Availability Metrics:', availability);
  
  // Error metrics
  const errorMetrics = PerformanceAnalytics.calculateErrorMetrics(
    1000, // total requests
    950,  // successful requests
    { 'timeout': 30, 'server_error': 15, 'validation_error': 5 }
  );
  console.log('Error Metrics:', errorMetrics);
  
  // Throughput metrics
  const throughput = PerformanceAnalytics.calculateThroughputMetrics(
    1000, // requests
    3600, // 1 hour window
    150   // peak requests
  );
  console.log('Throughput Metrics:', throughput);
};

// ============================================================================
// DEMO: USER BEHAVIOR ANALYTICS
// ============================================================================

export const demonstrateUserBehaviorAnalytics = () => {
  console.log('\n=== USER BEHAVIOR ANALYTICS DEMO ===');
  
  // Session data
  const sessionData = [
    { duration: 300, interactions: 15 },
    { duration: 180, interactions: 8 },
    { duration: 600, interactions: 25 },
    { duration: 120, interactions: 5 },
    { duration: 450, interactions: 18 },
  ];
  
  // Engagement metrics
  const engagement = UserBehaviorAnalytics.calculateEngagementMetrics(
    1000, // total users
    450,  // active users
    sessionData
  );
  console.log('Engagement Metrics:', engagement);
  
  // Cohort retention data
  const cohortData = [
    {
      cohort: '2024-01',
      totalUsers: 200,
      retention: { 1: 180, 7: 150, 30: 120, 90: 80 }
    },
    {
      cohort: '2024-02',
      totalUsers: 250,
      retention: { 1: 220, 7: 180, 30: 140, 90: 95 }
    }
  ];
  
  // Retention metrics
  const retention = UserBehaviorAnalytics.calculateRetentionMetrics(cohortData);
  console.log('Retention Metrics:', retention);
  
  // User journey data
  const journeyData = [
    { stage: 'Landing Page', users: 1000, conversions: 100, avgTime: 0 },
    { stage: 'Chat Initiated', users: 450, conversions: 45, avgTime: 2.3 },
    { stage: 'First Response', users: 380, conversions: 38, avgTime: 5.1 },
    { stage: 'Issue Resolved', users: 330, conversions: 33, avgTime: 12.8 },
    { stage: 'Satisfaction Survey', users: 280, conversions: 28, avgTime: 15.2 },
  ];
  
  // Journey metrics
  const journey = UserBehaviorAnalytics.calculateJourneyMetrics(journeyData);
  console.log('User Journey Metrics:', journey);
};

// ============================================================================
// DEMO: EXPORT FUNCTIONALITY
// ============================================================================

export const demonstrateExportFunctionality = () => {
  console.log('\n=== EXPORT FUNCTIONALITY DEMO ===');
  
  const sampleData = [
    { date: '2024-01-01', conversations: 45, satisfaction: 4.2 },
    { date: '2024-01-02', conversations: 52, satisfaction: 4.5 },
    { date: '2024-01-03', conversations: 48, satisfaction: 4.1 },
  ];
  
  console.log('Sample Data for Export:', sampleData);
  console.log('CSV Export function available:', typeof exportAnalyticsData.toCSV);
  console.log('JSON Export function available:', typeof exportAnalyticsData.toJSON);
  
  // Note: In a real browser environment, these would actually download files
  // exportAnalyticsData.toCSV(sampleData, 'analytics-demo.csv');
  // exportAnalyticsData.toJSON(sampleData, 'analytics-demo.json');
};

// ============================================================================
// DEMO: UTILITY FUNCTIONS
// ============================================================================

export const demonstrateUtilityFunctions = () => {
  console.log('\n=== UTILITY FUNCTIONS DEMO ===');
  
  // Time intervals
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-07');
  const dailyIntervals = generateTimeIntervals(startDate, endDate, 'day');
  console.log('Daily Intervals:', dailyIntervals.map(d => d.toISOString().split('T')[0]));
  
  // Percentage change
  const currentValue = 120;
  const previousValue = 100;
  const change = calculatePercentageChange(currentValue, previousValue);
  console.log(`Percentage Change (${currentValue} vs ${previousValue}):`, change.toFixed(1) + '%');
  
  // Large number formatting
  const largeNumbers = [1234, 12345, 123456, 1234567, 12345678];
  console.log('Large Number Formatting:');
  largeNumbers.forEach(num => {
    console.log(`${num} -> ${formatLargeNumber(num)}`);
  });
  
  // Performance colors
  const performanceValues = [95, 85, 75, 65];
  const thresholds = { excellent: 90, good: 80, warning: 70 };
  console.log('Performance Colors:');
  performanceValues.forEach(value => {
    const color = getPerformanceColor(value, thresholds);
    console.log(`${value}% -> ${color}`);
  });
  
  // Analytics ID generation
  const analyticsId = generateAnalyticsId();
  console.log('Generated Analytics ID:', analyticsId);
};

// ============================================================================
// MAIN DEMO FUNCTION
// ============================================================================

export const runAllAnalyticsDemos = () => {
  console.log('🚀 STARTING COMPREHENSIVE ANALYTICS UTILITIES DEMO 🚀\n');
  
  try {
    demonstrateStatisticalCalculations();
    demonstrateTimeSeriesAnalysis();
    demonstrateBusinessIntelligence();
    demonstrateDataProcessing();
    demonstratePerformanceAnalytics();
    demonstrateUserBehaviorAnalytics();
    demonstrateExportFunctionality();
    demonstrateUtilityFunctions();
    
    console.log('\n✅ ALL ANALYTICS DEMOS COMPLETED SUCCESSFULLY! ✅');
    console.log('\n📊 This comprehensive analytics utilities library provides:');
    console.log('   • Advanced statistical calculations (mean, median, percentiles, correlation)');
    console.log('   • Time series analysis (moving averages, seasonality, forecasting)');
    console.log('   • Business intelligence metrics (CLV, CAC, NPS, retention)');
    console.log('   • Data processing utilities (aggregation, filtering, sorting, pagination)');
    console.log('   • Performance analytics (response times, availability, error rates)');
    console.log('   • User behavior analytics (engagement, retention, journey mapping)');
    console.log('   • Export functionality (CSV, JSON, Excel)');
    console.log('   • Utility functions for common analytics tasks');
    
  } catch (error) {
    console.error('❌ Error running analytics demos:', error);
  }
};

// ============================================================================
// USAGE EXAMPLES FOR REAL-WORLD SCENARIOS
// ============================================================================

interface ConversationData {
  date: string;
  duration: number;
  satisfaction: number;
  [key: string]: unknown;
}

interface UserData {
  lastActive: string;
  [key: string]: unknown;
}

interface SessionData {
  date: string;
  duration: number;
  interactions: number;
  [key: string]: unknown;
}

export const realWorldUsageExamples = {
  /**
   * Example: Calculate bot performance metrics
   */
  calculateBotPerformance: (botData: Array<{ name: string; responseTime: number; satisfaction: number }>) => {
    const responseTimes = botData.map(bot => bot.responseTime);
    const satisfactionScores = botData.map(bot => bot.satisfaction);
    
    return {
      avgResponseTime: StatisticalCalculator.mean(responseTimes),
      responseTimeP95: StatisticalCalculator.percentile(responseTimes, 95),
      avgSatisfaction: StatisticalCalculator.mean(satisfactionScores),
      correlation: StatisticalCalculator.correlation(responseTimes, satisfactionScores)
    };
  },

  /**
   * Example: Generate daily analytics report
   */
  generateDailyReport: (conversationData: ConversationData[], userData: UserData[]) => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const dailyConversations = DataProcessor.filterData(conversationData, {
      date: { operator: 'gte', value: yesterday.toISOString() }
    });
    
    const dailyUsers = DataProcessor.filterData(userData, {
      lastActive: { operator: 'gte', value: yesterday.toISOString() }
    });
    
    return {
      date: today.toISOString().split('T')[0],
      totalConversations: dailyConversations.length,
      totalUsers: dailyUsers.length,
      avgConversationDuration: StatisticalCalculator.mean(
        dailyConversations.map(c => c.duration)
      ),
      userRetention: BusinessIntelligence.calculateRetentionRate(
        userData.length,
        dailyUsers.length,
        0
      )
    };
  },

  /**
   * Example: Analyze user engagement trends
   */
  analyzeEngagementTrends: (sessionData: SessionData[]) => {
    const dailyEngagement = DataProcessor.aggregateByTimePeriod(
      sessionData,
      'date',
      ['duration', 'interactions'],
      'day',
      'average'
    );
    
    const durationTrend = StatisticalCalculator.linearRegression(
      Object.keys(dailyEngagement).map(Number),
      Object.values(dailyEngagement).map(d => d.duration)
    );
    
    return {
      dailyEngagement,
      durationTrend: durationTrend.slope > 0 ? 'increasing' : 'decreasing',
      trendStrength: Math.abs(durationTrend.r2),
      seasonality: TimeSeriesAnalyzer.detectSeasonality(
        Object.values(dailyEngagement).map(d => d.duration)
      )
    };
  }
};

// Export for use in other files
export default {
  runAllAnalyticsDemos,
  realWorldUsageExamples,
  StatisticalCalculator,
  TimeSeriesAnalyzer,
  BusinessIntelligence,
  DataProcessor,
  PerformanceAnalytics,
  UserBehaviorAnalytics
}; 