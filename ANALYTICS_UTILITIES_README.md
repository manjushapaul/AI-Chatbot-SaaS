# AI Chatbot SaaS Analytics Utilities

A comprehensive analytics utilities library for AI chatbot SaaS platforms, providing advanced data processing, statistical calculations, and business intelligence features.

## 🚀 Features

### 📊 Statistical Calculations
- **Basic Statistics**: Mean, median, mode, variance, standard deviation
- **Percentiles & Quartiles**: P50, P90, P95, P99, Q1, Q2, Q3
- **Advanced Analytics**: Outlier detection, correlation analysis, linear regression
- **Statistical Tests**: IQR calculations, trend analysis

### ⏰ Time Series Analysis
- **Moving Averages**: Simple and exponential moving averages
- **Seasonality Detection**: Automatic seasonality identification
- **Time Series Decomposition**: Trend, seasonal, and residual components
- **Forecasting**: Linear trend-based predictions

### 💼 Business Intelligence
- **Customer Metrics**: CLV, CAC, retention rate, churn rate
- **Performance Indicators**: NPS, conversion rate, AOV, RPU
- **Growth Analysis**: Percentage changes, trend calculations

### 🔧 Data Processing
- **Aggregation**: Time-based and group-based data aggregation
- **Filtering**: Multi-criteria data filtering with operators
- **Sorting**: Multi-field sorting with direction control
- **Pagination**: Efficient data pagination for large datasets

### ⚡ Performance Analytics
- **Response Time Metrics**: P50, P90, P95, P99 percentiles
- **Availability Metrics**: Uptime, planned/unplanned availability
- **Error Analysis**: Error rates, failure patterns, MTTF
- **Throughput Metrics**: Requests per second/minute/hour

### 👥 User Behavior Analytics
- **Engagement Metrics**: Session duration, interaction counts, engagement scores
- **Retention Analysis**: Cohort retention, retention trends
- **Journey Mapping**: Conversion funnels, bottleneck identification

### 📤 Export Functionality
- **CSV Export**: Advanced CSV formatting with custom options
- **JSON Export**: Structured JSON with metadata
- **Excel Compatibility**: Excel-friendly formats

## 📦 Installation

The utilities are already included in your project. Import them directly:

```typescript
import {
  StatisticalCalculator,
  TimeSeriesAnalyzer,
  BusinessIntelligence,
  DataProcessor,
  PerformanceAnalytics,
  UserBehaviorAnalytics
} from './lib/analytics-utils';
```

## 🎯 Quick Start

### Basic Statistical Analysis

```typescript
import { StatisticalCalculator } from './lib/analytics-utils';

// Calculate response time statistics
const responseTimes = [1.2, 1.8, 2.1, 1.5, 3.2, 1.9, 2.5, 1.7, 2.8, 1.3];

const mean = StatisticalCalculator.mean(responseTimes);
const median = StatisticalCalculator.median(responseTimes);
const p95 = StatisticalCalculator.percentile(responseTimes, 95);
const outliers = StatisticalCalculator.detectOutliers(responseTimes);

console.log(`Mean: ${mean.toFixed(2)}s`);
console.log(`Median: ${median.toFixed(2)}s`);
console.log(`95th Percentile: ${p95.toFixed(2)}s`);
console.log(`Outliers: ${outliers.length} found`);
```

### Time Series Analysis

```typescript
import { TimeSeriesAnalyzer } from './lib/analytics-utils';

// Analyze daily conversation trends
const dailyConversations = [/* your data */];

// Calculate 7-day moving average
const movingAvg = TimeSeriesAnalyzer.movingAverage(dailyConversations, 7);

// Detect seasonality
const seasonality = TimeSeriesAnalyzer.detectSeasonality(dailyConversations);

// Forecast next 7 days
const forecast = TimeSeriesAnalyzer.forecast(dailyConversations, 7);
```

### Business Intelligence Metrics

```typescript
import { BusinessIntelligence } from './lib/analytics-utils';

// Calculate customer metrics
const clv = BusinessIntelligence.calculateCLV(50, 2.5, 3, 25);
const retentionRate = BusinessIntelligence.calculateRetentionRate(1000, 850, 100);
const nps = BusinessIntelligence.calculateNPS(300, 150, 50);

console.log(`Customer Lifetime Value: $${clv.toFixed(2)}`);
console.log(`Retention Rate: ${retentionRate.toFixed(1)}%`);
console.log(`Net Promoter Score: ${nps.toFixed(1)}`);
```

### Data Processing

```typescript
import { DataProcessor } from './lib/analytics-utils';

// Sample conversation data
const conversationData = [
  { date: '2024-01-01', bot: 'Support', duration: 120, satisfaction: 5 },
  { date: '2024-01-01', bot: 'Sales', duration: 180, satisfaction: 4 },
  // ... more data
];

// Aggregate by time period
const dailyStats = DataProcessor.aggregateByTimePeriod(
  conversationData,
  'date',
  ['duration', 'satisfaction'],
  'day',
  'average'
);

// Filter high-satisfaction conversations
const highSatisfaction = DataProcessor.filterData(conversationData, {
  satisfaction: { operator: 'gte', value: 4 }
});

// Sort by duration
const sortedByDuration = DataProcessor.sortData(conversationData, [
  { field: 'duration', direction: 'desc' }
]);
```

## 🤖 Real-World Chatbot Analytics Use Cases

### 1. Conversation Quality Analysis

```typescript
import { StatisticalCalculator, DataProcessor } from './lib/analytics-utils';

const analyzeConversationQuality = (conversations: Array<{
  id: string;
  duration: number;
  satisfaction: number;
  resolutionRate: number;
  botType: string;
}>) => {
  // Group by bot type
  const botPerformance = DataProcessor.groupAndAggregate(
    conversations,
    'botType',
    ['duration', 'satisfaction', 'resolutionRate'],
    'average'
  );
  
  // Calculate quality scores
  const qualityScores = Object.entries(botPerformance).map(([bot, metrics]) => ({
    bot,
    qualityScore: (metrics.satisfaction * 0.4 + metrics.resolutionRate * 0.6) * 100,
    avgDuration: metrics.duration,
    avgSatisfaction: metrics.satisfaction
  }));
  
  return qualityScores.sort((a, b) => b.qualityScore - a.qualityScore);
};
```

### 2. Peak Usage Time Detection

```typescript
import { DataProcessor, TimeSeriesAnalyzer } from './lib/analytics-utils';

const detectPeakUsageTimes = (usageData: Array<{
  timestamp: string;
  concurrentUsers: number;
  responseTime: number;
}>) => {
  // Aggregate by hour
  const hourlyUsage = DataProcessor.aggregateByTimePeriod(
    usageData,
    'timestamp',
    ['concurrentUsers', 'responseTime'],
    'hour',
    'average'
  );
  
  // Find peak hours
  const peakHours = Object.entries(hourlyUsage)
    .filter(([_, metrics]) => metrics.concurrentUsers > 100)
    .sort((a, b) => b[1].concurrentUsers - a[1].concurrentUsers);
  
  // Analyze response time patterns during peak
  const peakResponseTimes = peakHours.map(([hour, metrics]) => ({
    hour,
    avgUsers: metrics.concurrentUsers,
    avgResponseTime: metrics.responseTime
  }));
  
  return peakResponseTimes;
};
```

### 3. User Intent Classification Performance

```typescript
import { StatisticalCalculator, DataProcessor } from './lib/analytics-utils';

const analyzeIntentAccuracy = (intentData: Array<{
  predictedIntent: string;
  actualIntent: string;
  confidence: number;
  responseTime: number;
}>) => {
  // Calculate accuracy by intent
  const intentAccuracy = DataProcessor.groupAndAggregate(
    intentData,
    'predictedIntent',
    ['confidence'],
    'average'
  );
  
  // Calculate misclassification patterns
  const misclassifications = intentData.filter(
    item => item.predictedIntent !== item.actualIntent
  );
  
  const misclassificationAnalysis = DataProcessor.groupAndAggregate(
    misclassifications,
    'actualIntent',
    ['confidence'],
    'average'
  );
  
  return {
    overallAccuracy: ((intentData.length - misclassifications.length) / intentData.length) * 100,
    intentAccuracy,
    misclassificationAnalysis,
    avgConfidence: StatisticalCalculator.mean(intentData.map(d => d.confidence))
  };
};
```

### 4. Seasonal Conversation Patterns

```typescript
import { TimeSeriesAnalyzer, DataProcessor } from './lib/analytics-utils';

const analyzeSeasonalPatterns = (conversationData: Array<{
  date: string;
  count: number;
  category: string;
  satisfaction: number;
}>) => {
  // Aggregate daily counts
  const dailyCounts = DataProcessor.aggregateByTimePeriod(
    conversationData,
    'date',
    ['count', 'satisfaction'],
    'day',
    'sum'
  );
  
  // Extract count values for time series analysis
  const counts = Object.values(dailyCounts).map(d => d.count);
  
  // Detect seasonality
  const seasonality = TimeSeriesAnalyzer.detectSeasonality(counts);
  
  // Decompose time series
  const decomposed = TimeSeriesAnalyzer.decompose(counts, seasonality || 7);
  
  // Forecast next 30 days
  const forecast = TimeSeriesAnalyzer.forecast(counts, 30);
  
  return {
    seasonality,
    trend: decomposed.trend,
    seasonal: decomposed.seasonal,
    residual: decomposed.residual,
    forecast
  };
};
```

## 🔍 Advanced Usage Examples

### Bot Performance Analysis

```typescript
import { PerformanceAnalytics, StatisticalCalculator } from './lib/analytics-utils';

const analyzeBotPerformance = (botData: Array<{ name: string; responseTime: number; satisfaction: number }>) => {
  const responseTimes = botData.map(bot => bot.responseTime);
  const satisfactionScores = botData.map(bot => bot.satisfaction);
  
  return {
    avgResponseTime: StatisticalCalculator.mean(responseTimes),
    responseTimeP95: StatisticalCalculator.percentile(responseTimes, 95),
    avgSatisfaction: StatisticalCalculator.mean(satisfactionScores),
    correlation: StatisticalCalculator.correlation(responseTimes, satisfactionScores)
  };
};
```

### User Engagement Trends

```typescript
import { DataProcessor, TimeSeriesAnalyzer, StatisticalCalculator } from './lib/analytics-utils';

const analyzeEngagementTrends = (sessionData: Array<{ date: string; duration: number; interactions: number }>) => {
  // Aggregate daily engagement
  const dailyEngagement = DataProcessor.aggregateByTimePeriod(
    sessionData,
    'date',
    ['duration', 'interactions'],
    'day',
    'average'
  );
  
  // Analyze trends
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
};
```

### Real-time Performance Monitoring

```typescript
import { PerformanceAnalytics } from './lib/analytics-utils';

const monitorPerformance = (responseTimes: number[], totalRequests: number, successfulRequests: number) => {
  const responseMetrics = PerformanceAnalytics.calculateResponseTimeMetrics(responseTimes);
  const errorMetrics = PerformanceAnalytics.calculateErrorMetrics(totalRequests, successfulRequests);
  
  return {
    responseTime: {
      p50: responseMetrics.p50,
      p90: responseMetrics.p90,
      p95: responseMetrics.p95,
      p99: responseMetrics.p99
    },
    errors: {
      rate: errorMetrics.errorRate,
      successRate: errorMetrics.successRate
    },
    health: getSystemHealth(responseMetrics.p95, errorMetrics.errorRate)
  };
};

const getSystemHealth = (p95: number, errorRate: number) => {
  if (p95 <= 2 && errorRate <= 1) return 'excellent';
  if (p95 <= 5 && errorRate <= 5) return 'good';
  if (p95 <= 10 && errorRate <= 10) return 'warning';
  return 'critical';
};
```

## 📊 Integration with Analytics Dashboard

The utilities are designed to work seamlessly with your existing analytics dashboard:

```typescript
// In your analytics page component
import { StatisticalCalculator, DataProcessor } from './lib/analytics-utils';

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData>(mockAnalyticsData);
  
  // Calculate advanced metrics
  const responseTimeMetrics = useMemo(() => {
    const responseTimes = data.timeSeriesData.map(d => d.responseTime);
    return {
      mean: StatisticalCalculator.mean(responseTimes),
      p95: StatisticalCalculator.percentile(responseTimes, 95),
      trend: StatisticalCalculator.linearRegression(
        Array.from({ length: responseTimes.length }, (_, i) => i),
        responseTimes
      )
    };
  }, [data]);
  
  // Process conversation data
  const conversationInsights = useMemo(() => {
    const highSatisfaction = DataProcessor.filterData(data.timeSeriesData, {
      satisfaction: { operator: 'gte', value: 4 }
    });
    
    return {
      totalHighSatisfaction: highSatisfaction.length,
      percentage: (highSatisfaction.length / data.timeSeriesData.length) * 100
    };
  }, [data]);
  
  return (
    <div>
      {/* Your existing dashboard components */}
      <div className="metrics-grid">
        <MetricCard
          title="Avg Response Time"
          value={`${responseTimeMetrics.mean.toFixed(2)}s`}
          trend={responseTimeMetrics.trend.slope > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="95th Percentile"
          value={`${responseTimeMetrics.p95.toFixed(2)}s`}
        />
        <MetricCard
          title="High Satisfaction"
          value={`${conversationInsights.percentage.toFixed(1)}%`}
        />
      </div>
    </div>
  );
};
```

## 🧪 Testing and Demo

Run the comprehensive demo to see all utilities in action:

```typescript
import { runAllAnalyticsDemos } from './lib/analytics-demo';

// Run all demos
runAllAnalyticsDemos();

// Or run specific demos
import { demonstrateStatisticalCalculations } from './lib/analytics-demo';
demonstrateStatisticalCalculations();
```

### Available Demo Functions

- `demonstrateStatisticalCalculations()` - Basic statistical operations
- `demonstrateTimeSeriesAnalysis()` - Time series and forecasting
- `demonstrateBusinessIntelligence()` - Business metrics calculations
- `demonstrateDataProcessing()` - Data aggregation and filtering
- `demonstratePerformanceAnalytics()` - Performance metrics
- `demonstrateUserBehaviorAnalytics()` - User behavior analysis
- `demonstrateExportFunctionality()` - Data export features
- `demonstrateUtilityFunctions()` - Helper functions

## 📈 Performance Considerations

- **Large Datasets**: Use pagination and filtering for datasets with >10,000 records
- **Real-time Updates**: Cache calculated metrics and update incrementally
- **Memory Usage**: Process data in chunks for very large datasets
- **Calculation Complexity**: Statistical calculations are O(n log n) for sorting operations

## 🔧 Customization

### Adding Custom Metrics

```typescript
// Extend the StatisticalCalculator class
export class CustomStatisticalCalculator extends StatisticalCalculator {
  static calculateCustomMetric(data: number[]): number {
    // Your custom calculation logic
    return data.reduce((sum, val) => sum + val * val, 0) / data.length;
  }
}
```

### Custom Aggregation Functions

```typescript
// Add custom aggregation types to DataProcessor
export class CustomDataProcessor extends DataProcessor {
  static customAggregation<T>(data: T[], field: keyof T): number {
    // Your custom aggregation logic
    return data.reduce((sum, item) => sum + Number(item[field]), 0);
  }
}
```

## 🚨 Error Handling

The utilities include comprehensive error handling:

```typescript
try {
  const result = StatisticalCalculator.percentile(data, 95);
  console.log('95th percentile:', result);
} catch (error) {
  console.error('Error calculating percentile:', error);
  // Fallback to mean
  const fallback = StatisticalCalculator.mean(data);
  console.log('Using mean as fallback:', fallback);
}
```

## 🛠️ Troubleshooting Common Issues

### 1. Empty Data Arrays

```typescript
// Always check for empty arrays before calculations
const safeCalculate = (data: number[]) => {
  if (!data || data.length === 0) {
    return { mean: 0, median: 0, stdDev: 0 };
  }
  
  return {
    mean: StatisticalCalculator.mean(data),
    median: StatisticalCalculator.median(data),
    stdDev: StatisticalCalculator.standardDeviation(data)
  };
};
```

### 2. Invalid Date Formats

```typescript
// Ensure proper date parsing for time-based aggregations
const safeDateAggregation = (data: Array<{ date: string; value: number }>) => {
  const validData = data.filter(item => {
    const date = new Date(item.date);
    return !isNaN(date.getTime());
  });
  
  return DataProcessor.aggregateByTimePeriod(
    validData,
    'date',
    ['value'],
    'day',
    'sum'
  );
};
```

### 3. Memory Issues with Large Datasets

```typescript
// Process data in chunks for large datasets
const processLargeDataset = <T>(data: T[], chunkSize: number = 1000) => {
  const results: any[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const chunkResult = processChunk(chunk);
    results.push(chunkResult);
  }
  
  return aggregateChunkResults(results);
};
```

### 4. Performance Bottlenecks

```typescript
// Use memoization for expensive calculations
import { useMemo } from 'react';

const useMemoizedAnalytics = (data: AnalyticsData[]) => {
  return useMemo(() => {
    // Expensive calculations here
    return {
      trends: calculateTrends(data),
      seasonality: detectSeasonality(data),
      forecasts: generateForecasts(data)
    };
  }, [data]); // Only recalculate when data changes
};
```

## 📚 API Reference

### StatisticalCalculator

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `mean(values)` | Calculate arithmetic mean | `number[]` | `number` |
| `median(values)` | Calculate median | `number[]` | `number` |
| `percentile(values, p)` | Calculate pth percentile | `number[]`, `number` | `number` |
| `correlation(x, y)` | Calculate correlation coefficient | `number[]`, `number[]` | `number` |

### TimeSeriesAnalyzer

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `movingAverage(data, window)` | Calculate moving average | `number[]`, `number` | `number[]` |
| `detectSeasonality(data)` | Detect seasonality | `number[]` | `number` |
| `forecast(data, periods)` | Forecast future values | `number[]`, `number` | `number[]` |

### BusinessIntelligence

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `calculateCLV(...)` | Customer Lifetime Value | `number, number, number, number` | `number` |
| `calculateNPS(...)` | Net Promoter Score | `number, number, number` | `number` |
| `calculateRetentionRate(...)` | Retention Rate | `number, number, number` | `number` |

## 🤝 Contributing

To extend the analytics utilities:

1. **Add new statistical methods** to `StatisticalCalculator`
2. **Create new analysis classes** following the existing pattern
3. **Update the demo file** with examples
4. **Add comprehensive tests** for new functionality
5. **Update this README** with new features

## 📄 License

This analytics utilities library is part of your AI Chatbot SaaS project and follows the same licensing terms.

## 🆘 Support

For questions or issues with the analytics utilities:

1. Check the demo examples in `analytics-demo.ts`
2. Review the TypeScript interfaces for method signatures
3. Use the console demos to test functionality
4. Check the existing analytics dashboard for integration examples
5. Review the troubleshooting section above for common issues

---

**Happy Analyzing! 📊✨** 