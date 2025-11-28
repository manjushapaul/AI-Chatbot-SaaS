import { format, subDays, startOfDay, endOfDay, parseISO, eachHourOfInterval, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

// ============================================================================
// ADVANCED STATISTICAL CALCULATIONS
// ============================================================================

export class StatisticalCalculator {
  /**
   * Calculate mean (average) of an array of numbers
   */
  static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate median of an array of numbers
   */
  static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate mode (most frequent value) of an array of numbers
   */
  static mode(values: number[]): number | null {
    if (values.length === 0) return null;
    const frequency: Record<number, number> = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    
    let maxFreq = 0;
    let mode = null;
    Object.entries(frequency).forEach(([val, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = Number(val);
      }
    });
    return mode;
  }

  /**
   * Calculate standard deviation
   */
  static standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.mean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Calculate variance
   */
  static variance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.mean(squaredDiffs);
  }

  /**
   * Calculate percentile
   */
  static percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper === lower) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Calculate quartiles (Q1, Q2, Q3)
   */
  static quartiles(values: number[]): { q1: number; q2: number; q3: number } {
    return {
      q1: this.percentile(values, 25),
      q2: this.percentile(values, 50),
      q3: this.percentile(values, 75)
    };
  }

  /**
   * Calculate interquartile range (IQR)
   */
  static iqr(values: number[]): number {
    const { q1, q3 } = this.quartiles(values);
    return q3 - q1;
  }

  /**
   * Detect outliers using IQR method
   */
  static detectOutliers(values: number[]): number[] {
    const { q1, q3 } = this.quartiles(values);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(val => val < lowerBound || val > upperBound);
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  static correlation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate linear regression
   */
  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    if (x.length !== y.length || x.length < 2) {
      return { slope: 0, intercept: 0, r2: 0 };
    }
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    
    return { slope, intercept, r2 };
  }
}

// ============================================================================
// TIME SERIES ANALYSIS
// ============================================================================

export class TimeSeriesAnalyzer {
  /**
   * Calculate moving average with customizable window
   */
  static movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window + 1);
      const values = data.slice(start, i + 1);
      const average = StatisticalCalculator.mean(values);
      result.push(average);
    }
    return result;
  }

  /**
   * Calculate exponential moving average
   */
  static exponentialMovingAverage(data: number[], alpha: number): number[] {
    if (data.length === 0) return [];
    
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      const ema = alpha * data[i] + (1 - alpha) * result[i - 1];
      result.push(ema);
    }
    return result;
  }

  /**
   * Calculate seasonality using autocorrelation
   */
  static detectSeasonality(data: number[], maxLag: number = Math.floor(data.length / 2)): number {
    if (data.length < maxLag * 2) return 0;
    
    let maxCorrelation = 0;
    let seasonality = 0;
    
    for (let lag = 1; lag <= maxLag; lag++) {
      const correlation = StatisticalCalculator.correlation(
        data.slice(0, -lag),
        data.slice(lag)
      );
      
      if (Math.abs(correlation) > Math.abs(maxCorrelation)) {
        maxCorrelation = correlation;
        seasonality = lag;
      }
    }
    
    return Math.abs(maxCorrelation) > 0.7 ? seasonality : 0;
  }

  /**
   * Decompose time series into trend, seasonal, and residual components
   */
  static decompose(data: number[], period: number = 12): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    if (data.length < period * 2) {
      return {
        trend: data,
        seasonal: new Array(data.length).fill(0),
        residual: new Array(data.length).fill(0)
      };
    }
    
    // Calculate trend using moving average
    const trend = this.movingAverage(data, period);
    
    // Calculate seasonal component
    const seasonal: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const seasonalIndex = i % period;
      let seasonalSum = 0;
      let seasonalCount = 0;
      
      for (let j = seasonalIndex; j < data.length; j += period) {
        if (j < trend.length) {
          seasonalSum += data[j] - trend[j];
          seasonalCount++;
        }
      }
      
      seasonal.push(seasonalCount > 0 ? seasonalSum / seasonalCount : 0);
    }
    
    // Calculate residual
    const residual = data.map((val, i) => 
      val - trend[i] - seasonal[i]
    );
    
    return { trend, seasonal, residual };
  }

  /**
   * Forecast future values using simple linear trend
   */
  static forecast(data: number[], periods: number): number[] {
    if (data.length < 2) return new Array(periods).fill(data[0] || 0);
    
    const x = Array.from({ length: data.length }, (_, i) => i);
    const { slope, intercept } = StatisticalCalculator.linearRegression(x, data);
    
    const forecast: number[] = [];
    for (let i = data.length; i < data.length + periods; i++) {
      forecast.push(slope * i + intercept);
    }
    
    return forecast;
  }
}

// ============================================================================
// BUSINESS INTELLIGENCE METRICS
// ============================================================================

export class BusinessIntelligence {
  /**
   * Calculate Customer Lifetime Value (CLV)
   */
  static calculateCLV(
    avgOrderValue: number,
    purchaseFrequency: number,
    customerLifespan: number,
    acquisitionCost: number
  ): number {
    const clv = (avgOrderValue * purchaseFrequency * customerLifespan) - acquisitionCost;
    return Math.max(0, clv);
  }

  /**
   * Calculate Customer Acquisition Cost (CAC)
   */
  static calculateCAC(
    totalMarketingSpend: number,
    totalAcquiredCustomers: number
  ): number {
    return totalAcquiredCustomers > 0 ? totalMarketingSpend / totalAcquiredCustomers : 0;
  }

  /**
   * Calculate Customer Retention Rate
   */
  static calculateRetentionRate(
    customersAtStart: number,
    customersAtEnd: number,
    newCustomers: number
  ): number {
    const retainedCustomers = customersAtEnd - newCustomers;
    return customersAtStart > 0 ? (retainedCustomers / customersAtStart) * 100 : 0;
  }

  /**
   * Calculate Churn Rate
   */
  static calculateChurnRate(
    customersAtStart: number,
    customersAtEnd: number,
    newCustomers: number
  ): number {
    const churnedCustomers = customersAtStart - (customersAtEnd - newCustomers);
    return customersAtStart > 0 ? (churnedCustomers / customersAtStart) * 100 : 0;
  }

  /**
   * Calculate Net Promoter Score (NPS)
   */
  static calculateNPS(promoters: number, passives: number, detractors: number): number {
    const total = promoters + passives + detractors;
    if (total === 0) return 0;
    
    const promoterPercentage = (promoters / total) * 100;
    const detractorPercentage = (detractors / total) * 100;
    
    return promoterPercentage - detractorPercentage;
  }

  /**
   * Calculate Conversion Rate
   */
  static calculateConversionRate(conversions: number, totalVisitors: number): number {
    return totalVisitors > 0 ? (conversions / totalVisitors) * 100 : 0;
  }

  /**
   * Calculate Average Order Value (AOV)
   */
  static calculateAOV(totalRevenue: number, totalOrders: number): number {
    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  }

  /**
   * Calculate Revenue per User (RPU)
   */
  static calculateRPU(totalRevenue: number, totalUsers: number): number {
    return totalUsers > 0 ? totalRevenue / totalUsers : 0;
  }
}

// ============================================================================
// ADVANCED DATA PROCESSING
// ============================================================================

export class DataProcessor {
  /**
   * Aggregate data by time period
   */
  static aggregateByTimePeriod<T extends Record<string, unknown>>(
    data: T[],
    dateField: keyof T,
    valueFields: (keyof T)[],
    period: 'hour' | 'day' | 'week' | 'month',
    aggregationType: 'sum' | 'average' | 'count' | 'min' | 'max' = 'sum'
  ): Record<string, Record<string, number>> {
    const aggregated: Record<string, Record<string, number>> = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField] as string);
      let periodKey: string;
      
      switch (period) {
        case 'hour':
          periodKey = format(date, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          periodKey = format(date, 'yyyy-MM-dd');
          break;
        case 'week':
          periodKey = format(date, 'yyyy-\'W\'II');
          break;
        case 'month':
          periodKey = format(date, 'yyyy-MM');
          break;
        default:
          periodKey = format(date, 'yyyy-MM-dd');
      }
      
      if (!aggregated[periodKey]) {
        aggregated[periodKey] = {};
        valueFields.forEach(field => {
          aggregated[periodKey][field as string] = 0;
        });
      }
      
      valueFields.forEach(field => {
        const value = Number(item[field]) || 0;
        if (aggregationType === 'sum') {
          aggregated[periodKey][field as string] += value;
        } else if (aggregationType === 'count') {
          aggregated[periodKey][field as string]++;
        } else if (aggregationType === 'min') {
          aggregated[periodKey][field as string] = Math.min(
            aggregated[periodKey][field as string],
            value
          );
        } else if (aggregationType === 'max') {
          aggregated[periodKey][field as string] = Math.max(
            aggregated[periodKey][field as string],
            value
          );
        }
      });
    });
    
    // Calculate averages if needed
    if (aggregationType === 'average') {
      const counts: Record<string, Record<string, number>> = {};
      
      data.forEach(item => {
        const date = new Date(item[dateField] as string);
        let periodKey: string;
        
        switch (period) {
          case 'hour':
            periodKey = format(date, 'yyyy-MM-dd HH:00');
            break;
          case 'day':
            periodKey = format(date, 'yyyy-MM-dd');
            break;
          case 'week':
            periodKey = format(date, 'yyyy-\'W\'II');
            break;
          case 'month':
            periodKey = format(date, 'yyyy-MM');
            break;
          default:
            periodKey = format(date, 'yyyy-MM-dd');
        }
        
        if (!counts[periodKey]) {
          counts[periodKey] = {};
          valueFields.forEach(field => {
            counts[periodKey][field as string] = 0;
          });
        }
        
        valueFields.forEach(field => {
          counts[periodKey][field as string]++;
        });
      });
      
      Object.keys(aggregated).forEach(periodKey => {
        valueFields.forEach(field => {
          if (counts[periodKey][field as string] > 0) {
            aggregated[periodKey][field as string] /= counts[periodKey][field as string];
          }
        });
      });
    }
    
    return aggregated;
  }

  /**
   * Group data by field and calculate aggregations
   */
  static groupAndAggregate<T extends Record<string, unknown>>(
    data: T[],
    groupBy: keyof T,
    valueFields: (keyof T)[],
    aggregationType: 'sum' | 'average' | 'count' | 'min' | 'max' = 'sum'
  ): Record<string, Record<string, number>> {
    const grouped: Record<string, Record<string, number>> = {};
    const counts: Record<string, Record<string, number>> = {};
    
    data.forEach(item => {
      const groupKey = String(item[groupBy]);
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {};
        counts[groupKey] = {};
        valueFields.forEach(field => {
          grouped[groupKey][field as string] = 0;
          counts[groupKey][field as string] = 0;
        });
      }
      
      valueFields.forEach(field => {
        const value = Number(item[field]) || 0;
        counts[groupKey][field as string]++;
        
        if (aggregationType === 'sum') {
          grouped[groupKey][field as string] += value;
        } else if (aggregationType === 'count') {
          grouped[groupKey][field as string]++;
        } else if (aggregationType === 'min') {
          grouped[groupKey][field as string] = Math.min(
            grouped[groupKey][field as string],
            value
          );
        } else if (aggregationType === 'max') {
          grouped[groupKey][field as string] = Math.max(
            grouped[groupKey][field as string],
            value
          );
        }
      });
    });
    
    // Calculate averages if needed
    if (aggregationType === 'average') {
      Object.keys(grouped).forEach(groupKey => {
        valueFields.forEach(field => {
          if (counts[groupKey][field as string] > 0) {
            grouped[groupKey][field as string] /= counts[groupKey][field as string];
          }
        });
      });
    }
    
    return grouped;
  }

  /**
   * Filter data by multiple criteria
   */
  static filterData<T extends Record<string, unknown>>(
    data: T[],
    filters: Record<string, { operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in'; value: unknown }>
  ): T[] {
    return data.filter(item => {
      return Object.entries(filters).every(([field, filter]) => {
        const itemValue = item[field];
        
        switch (filter.operator) {
          case 'eq':
            return itemValue === filter.value;
          case 'gt':
            return Number(itemValue) > Number(filter.value);
          case 'lt':
            return Number(itemValue) < Number(filter.value);
          case 'gte':
            return Number(itemValue) >= Number(filter.value);
          case 'lte':
            return Number(itemValue) <= Number(filter.value);
          case 'contains':
            return String(itemValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'in':
            return Array.isArray(filter.value) ? filter.value.includes(itemValue) : false;
          default:
            return true;
        }
      });
    });
  }

  /**
   * Sort data by multiple fields
   */
  static sortData<T extends Record<string, unknown>>(
    data: T[],
    sortFields: Array<{ field: keyof T; direction: 'asc' | 'desc' }>
  ): T[] {
    return [...data].sort((a, b) => {
      for (const { field, direction } of sortFields) {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Paginate data
   */
  static paginateData<T>(
    data: T[],
    page: number,
    pageSize: number
  ): { data: T[]; total: number; totalPages: number; currentPage: number } {
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      data: data.slice(startIndex, endIndex),
      total,
      totalPages,
      currentPage
    };
  }
}

// ============================================================================
// PERFORMANCE ANALYTICS
// ============================================================================

export class PerformanceAnalytics {
  /**
   * Calculate response time percentiles
   */
  static calculateResponseTimeMetrics(responseTimes: number[]): {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    mean: number;
    stdDev: number;
  } {
    if (responseTimes.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, mean: 0, stdDev: 0 };
    }
    
    return {
      p50: StatisticalCalculator.percentile(responseTimes, 50),
      p90: StatisticalCalculator.percentile(responseTimes, 90),
      p95: StatisticalCalculator.percentile(responseTimes, 95),
      p99: StatisticalCalculator.percentile(responseTimes, 99),
      mean: StatisticalCalculator.mean(responseTimes),
      stdDev: StatisticalCalculator.standardDeviation(responseTimes)
    };
  }

  /**
   * Calculate uptime and availability metrics
   */
  static calculateAvailabilityMetrics(
    totalTime: number,
    downtime: number,
    plannedMaintenance: number = 0
  ): {
    uptime: number;
    availability: number;
    plannedAvailability: number;
    unplannedAvailability: number;
  } {
    const uptime = totalTime - downtime;
    const availability = (uptime / totalTime) * 100;
    const plannedAvailability = ((totalTime - plannedMaintenance) / totalTime) * 100;
    const unplannedAvailability = ((uptime - (totalTime - plannedMaintenance)) / (totalTime - plannedMaintenance)) * 100;
    
    return {
      uptime,
      availability,
      plannedAvailability,
      unplannedAvailability
    };
  }

  /**
   * Calculate error rate and failure metrics
   */
  static calculateErrorMetrics(
    totalRequests: number,
    successfulRequests: number,
    errors: Record<string, number> = {}
  ): {
    successRate: number;
    errorRate: number;
    errorBreakdown: Record<string, { count: number; percentage: number }>;
    mttf: number; // Mean Time To Failure
  } {
    const successRate = (successfulRequests / totalRequests) * 100;
    const errorRate = 100 - successRate;
    
    const errorBreakdown: Record<string, { count: number; percentage: number }> = {};
    Object.entries(errors).forEach(([errorType, count]) => {
      errorBreakdown[errorType] = {
        count,
        percentage: (count / totalRequests) * 100
      };
    });
    
    const mttf = totalRequests > 0 ? totalRequests / (totalRequests - successfulRequests) : 0;
    
    return {
      successRate,
      errorRate,
      errorBreakdown,
      mttf
    };
  }

  /**
   * Calculate throughput metrics
   */
  static calculateThroughputMetrics(
    requests: number,
    timeWindow: number, // in seconds
    peakRequests: number = 0
  ): {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    peakThroughput: number;
    averageThroughput: number;
  } {
    const requestsPerSecond = requests / timeWindow;
    const requestsPerMinute = requestsPerSecond * 60;
    const requestsPerHour = requestsPerSecond * 3600;
    const peakThroughput = peakRequests > 0 ? peakRequests / timeWindow : requestsPerSecond;
    const averageThroughput = requestsPerSecond;
    
    return {
      requestsPerSecond,
      requestsPerMinute,
      requestsPerHour,
      peakThroughput,
      averageThroughput
    };
  }
}

// ============================================================================
// USER BEHAVIOR ANALYTICS
// ============================================================================

export class UserBehaviorAnalytics {
  /**
   * Calculate user engagement metrics
   */
  static calculateEngagementMetrics(
    totalUsers: number,
    activeUsers: number,
    sessionData: Array<{ duration: number; interactions: number }>
  ): {
    activeUserRate: number;
    averageSessionDuration: number;
    averageInteractionsPerSession: number;
    engagementScore: number;
  } {
    const activeUserRate = (activeUsers / totalUsers) * 100;
    const averageSessionDuration = StatisticalCalculator.mean(sessionData.map(s => s.duration));
    const averageInteractionsPerSession = StatisticalCalculator.mean(sessionData.map(s => s.interactions));
    
    // Calculate engagement score (0-100) based on multiple factors
    const durationScore = Math.min(averageSessionDuration / 300, 1) * 40; // Max 40 points for 5+ min sessions
    const interactionScore = Math.min(averageInteractionsPerSession / 10, 1) * 30; // Max 30 points for 10+ interactions
    const activityScore = (activeUserRate / 100) * 30; // Max 30 points for 100% active users
    
    const engagementScore = Math.round(durationScore + interactionScore + activityScore);
    
    return {
      activeUserRate,
      averageSessionDuration,
      averageInteractionsPerSession,
      engagementScore
    };
  }

  /**
   * Calculate user retention metrics
   */
  static calculateRetentionMetrics(
    cohortData: Array<{
      cohort: string;
      totalUsers: number;
      retention: Record<number, number>; // day -> user count
    }>
  ): {
    averageRetention: Record<number, number>;
    cohortRetention: Record<string, Record<number, number>>;
    retentionTrend: 'improving' | 'declining' | 'stable';
  } {
    const averageRetention: Record<number, number> = {};
    const cohortRetention: Record<string, Record<number, number>> = {};
    
    // Calculate retention for each cohort
    cohortData.forEach(cohort => {
      cohortRetention[cohort.cohort] = {};
      Object.entries(cohort.retention).forEach(([day, users]) => {
        const dayNum = Number(day);
        const retentionRate = (users / cohort.totalUsers) * 100;
        cohortRetention[cohort.cohort][dayNum] = retentionRate;
        
        if (!averageRetention[dayNum]) {
          averageRetention[dayNum] = 0;
        }
        averageRetention[dayNum] += retentionRate;
      });
    });
    
    // Calculate average retention across all cohorts
    const cohortCount = cohortData.length;
    Object.keys(averageRetention).forEach(day => {
      averageRetention[Number(day)] /= cohortCount;
    });
    
    // Determine retention trend
    const recentDays = Object.keys(averageRetention).slice(-3).map(Number);
    if (recentDays.length >= 2) {
      const recentTrend = recentDays.slice(-2).map(day => averageRetention[day]);
      const trend = recentTrend[1] - recentTrend[0];
      
      if (trend > 1) return { averageRetention, cohortRetention, retentionTrend: 'improving' };
      if (trend < -1) return { averageRetention, cohortRetention, retentionTrend: 'declining' };
    }
    
    return { averageRetention, cohortRetention, retentionTrend: 'stable' };
  }

  /**
   * Calculate user journey metrics
   */
  static calculateJourneyMetrics(
    journeyData: Array<{
      stage: string;
      users: number;
      conversions: number;
      avgTime: number;
    }>
  ): {
    conversionFunnel: Record<string, { users: number; conversion: number; dropoff: number }>;
    averageTimeToConversion: number;
    bottleneckStages: string[];
  } {
    const conversionFunnel: Record<string, { users: number; conversion: number; dropoff: number }> = {};
    let totalTimeToConversion = 0;
    let conversionCount = 0;
    
    journeyData.forEach((stage, index) => {
      const previousUsers = index > 0 ? journeyData[index - 1].users : stage.users;
      const dropoff = previousUsers - stage.users;
      
      conversionFunnel[stage.stage] = {
        users: stage.users,
        conversion: (stage.conversions / stage.users) * 100,
        dropoff: (dropoff / previousUsers) * 100
      };
      
      if (stage.conversions > 0) {
        totalTimeToConversion += stage.avgTime * stage.conversions;
        conversionCount += stage.conversions;
      }
    });
    
    const averageTimeToConversion = conversionCount > 0 ? totalTimeToConversion / conversionCount : 0;
    
    // Identify bottleneck stages (high dropoff rates)
    const bottleneckStages = Object.entries(conversionFunnel)
      .filter(([_, metrics]) => metrics.dropoff > 20) // 20% dropoff threshold
      .map(([stage, _]) => stage);
    
    return {
      conversionFunnel,
      averageTimeToConversion,
      bottleneckStages
    };
  }
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

interface ExportDataWithMetadata<T> {
  metadata: {
    exportedAt: string;
    totalRecords: number;
    version: string;
  };
  data: T;
}

export const exportAnalyticsData = {
  /**
   * Export data to CSV with advanced formatting
   */
  toCSV: <T extends Record<string, unknown>>(data: T[], filename: string, options?: {
    headers?: string[];
    dateFormat?: string;
    numberFormat?: Intl.NumberFormatOptions;
  }): void => {
    const headers = options?.headers || Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          
          // Format dates
          if (value instanceof Date) {
            value = format(value, options?.dateFormat || 'yyyy-MM-dd');
          }
          
          // Format numbers
          if (typeof value === 'number' && options?.numberFormat) {
            value = new Intl.NumberFormat('en-US', options.numberFormat).format(value);
          }
          
          // Escape special characters
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        }).join(',')
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
  },

  /**
   * Export data to JSON with pretty formatting
   */
  toJSON: <T>(data: T, filename: string, options?: {
    pretty?: boolean;
    includeMetadata?: boolean;
  }): void => {
    let exportData: T | ExportDataWithMetadata<T> = data;
    
    if (options?.includeMetadata) {
      exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalRecords: Array.isArray(data) ? data.length : 1,
          version: '1.0'
        },
        data
      };
    }
    
    const content = options?.pretty 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
    
    const blob = new Blob([content], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export data to Excel-compatible format
   */
  toExcel: <T extends Record<string, unknown>>(data: T[], filename: string, sheetName: string = 'Analytics Data'): void => {
    // This would require a library like xlsx or similar
    // For now, we'll create a CSV that Excel can open
    exportAnalyticsData.toCSV(data, filename.replace('.xlsx', '.csv'));
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate time intervals for analysis
 */
export const generateTimeIntervals = (
  startDate: Date,
  endDate: Date,
  interval: 'hour' | 'day' | 'week' | 'month'
): Date[] => {
  switch (interval) {
    case 'hour':
      return eachHourOfInterval({ start: startDate, end: endDate });
    case 'day':
      return eachDayOfInterval({ start: startDate, end: endDate });
    case 'week':
      return eachWeekOfInterval({ start: startDate, end: endDate });
    case 'month':
      return eachMonthOfInterval({ start: startDate, end: endDate });
    default:
      return eachDayOfInterval({ start: startDate, end: endDate });
  }
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format large numbers with appropriate suffixes
 */
export const formatLargeNumber = (num: number, decimals: number = 1): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
  return num.toString();
};

/**
 * Get color for performance indicators
 */
export const getPerformanceColor = (
  value: number,
  thresholds: { excellent: number; good: number; warning: number }
): string => {
  if (value >= thresholds.excellent) return '#10B981'; // green
  if (value >= thresholds.good) return '#3B82F6'; // blue
  if (value >= thresholds.warning) return '#F59E0B'; // yellow
  return '#EF4444'; // red
};

/**
 * Generate unique ID for analytics events
 */
export const generateAnalyticsId = (): string => {
  return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}; 