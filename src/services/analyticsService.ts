import { getToken } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Types matching the backend API response
export interface AnalyticsData {
  experiment: {
    id: string
    name: string
    status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
    createdAt: string
    startDate?: string
    endDate?: string
    trafficAllocation: number
    project: {
      id: string
      name: string
      domain?: string
    }
    variants: Array<{
      id: string
      name: string
      isControl: boolean
      allocation: number
      modifications?: string
      _count: {
        events: number
      }
    }>
    goals: Array<{
      id: string
      name: string
      type: string
      description?: string
      isPrimary: boolean
    }>
    events: Array<{
      id: string
      type: 'EXPERIMENT_VIEW' | 'GOAL_CONVERSION' | 'CUSTOM'
      timestamp: string
      value?: number
      properties?: any
      variant?: {
        id: string
        name: string
      }
      goal?: {
        id: string
        name: string
        type: string
      }
    }>
    _count: {
      events: number
      variants: number
      goals: number
    }
  }
  variantStats: Array<{
    variant: {
      id: string
      name: string
      isControl: boolean
      allocation: number
    }
    stats: {
      views: number
      conversions: number
      conversionRate: number
    }
  }>
  recentEvents: Array<{
    id: string
    type: 'EXPERIMENT_VIEW' | 'GOAL_CONVERSION' | 'CUSTOM'
    timestamp: string
    value?: number
    properties?: any
    variant?: {
      name: string
    }
    goal?: {
      name: string
      type: string
    }
  }>
  totalEvents: number
}

// Enhanced analytics data for the dashboard
export interface ProcessedAnalyticsData {
  experimentId: string
  experimentName: string
  startDate: string
  status: 'running' | 'paused' | 'completed' | 'draft'
  totalVisitors: number
  totalConversions: number
  overallConversionRate: number
  variants: Array<{
    id: string
    name: string
    isControl: boolean
    visitors: number
    conversions: number
    conversionRate: number
    allocation: number
    revenue?: number
    standardError: number
    confidenceInterval: [number, number]
  }>
  timeSeriesData: Array<{
    date: string
    timestamp: number
    [variantId: string]: number | string // Dynamic keys for each variant
  }>
  goalBreakdown: Array<{
    goalName: string
    conversions: number
    value: number
  }>
}

export class AnalyticsService {
  private static instance: AnalyticsService
  
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * Fetch raw analytics data from the API
   */
  async fetchExperimentAnalytics(experimentId: string): Promise<AnalyticsData> {
    const token = getToken()
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${API_BASE_URL}/analytics/${experimentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Process raw analytics data into dashboard-friendly format
   */
  processAnalyticsData(rawData: AnalyticsData, timeRange: string = '7d'): ProcessedAnalyticsData {
    const { experiment, variantStats } = rawData

    // Calculate totals
    const totalVisitors = variantStats.reduce((sum, v) => sum + v.stats.views, 0)
    const totalConversions = variantStats.reduce((sum, v) => sum + v.stats.conversions, 0)
    const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

    // Process variants with statistical calculations
    const variants = variantStats.map(variantStat => {
      const { variant, stats } = variantStat
      const conversionRate = stats.conversionRate
      const standardError = this.calculateStandardError(stats.views, stats.conversions)
      const confidenceInterval = this.calculateConfidenceInterval(
        conversionRate / 100, 
        standardError, 
        1.96 // 95% confidence
      )

      return {
        id: variant.id,
        name: variant.name,
        isControl: variant.isControl,
        visitors: stats.views,
        conversions: stats.conversions,
        conversionRate: conversionRate,
        allocation: variant.allocation * 100, // Convert to percentage
        revenue: stats.conversions * 29.99, // Placeholder revenue calculation
        standardError,
        confidenceInterval: [
          confidenceInterval.lower * 100,
          confidenceInterval.upper * 100
        ] as [number, number]
      }
    })

    // Generate time series data from events
    const timeSeriesData = this.generateTimeSeriesData(experiment.events, variants, timeRange)

    // Process goal breakdown
    const goalBreakdown = experiment.goals.map(goal => {
      const goalConversions = experiment.events.filter(
        event => event.type === 'GOAL_CONVERSION' && event.goal?.id === goal.id
      )
      
      return {
        goalName: goal.name,
        conversions: goalConversions.length,
        value: goalConversions.reduce((sum, event) => sum + (event.value || 0), 0)
      }
    })

    return {
      experimentId: experiment.id,
      experimentName: experiment.name,
      startDate: experiment.startDate || experiment.createdAt,
      status: experiment.status.toLowerCase() as any,
      totalVisitors,
      totalConversions,
      overallConversionRate,
      variants,
      timeSeriesData,
      goalBreakdown
    }
  }

  /**
   * Calculate standard error for conversion rate
   */
  private calculateStandardError(sampleSize: number, conversions: number): number {
    if (sampleSize === 0) return 0
    const p = conversions / sampleSize
    return Math.sqrt((p * (1 - p)) / sampleSize)
  }

  /**
   * Calculate confidence interval for conversion rate
   */
  private calculateConfidenceInterval(
    conversionRate: number, 
    standardError: number, 
    zScore: number
  ): { lower: number; upper: number } {
    const margin = zScore * standardError
    return {
      lower: Math.max(0, conversionRate - margin),
      upper: Math.min(1, conversionRate + margin)
    }
  }

  /**
   * Generate time series data from events
   */
  private generateTimeSeriesData(
    events: AnalyticsData['experiment']['events'], 
    variants: ProcessedAnalyticsData['variants'],
    timeRange: string
  ): ProcessedAnalyticsData['timeSeriesData'] {
    const days = this.getTimeRangeDays(timeRange)
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
    
    const timeSeriesData: ProcessedAnalyticsData['timeSeriesData'] = []
    
    // Group events by date and variant
    const eventsByDate = new Map<string, Map<string, { views: number; conversions: number }>>()
    
    events.forEach(event => {
      const eventDate = new Date(event.timestamp).toISOString().split('T')[0]
      const variantId = event.variant?.id || 'unknown'
      
      if (!eventsByDate.has(eventDate)) {
        eventsByDate.set(eventDate, new Map())
      }
      
      const dateEvents = eventsByDate.get(eventDate)!
      if (!dateEvents.has(variantId)) {
        dateEvents.set(variantId, { views: 0, conversions: 0 })
      }
      
      const variantEvents = dateEvents.get(variantId)!
      if (event.type === 'EXPERIMENT_VIEW') {
        variantEvents.views++
      } else if (event.type === 'GOAL_CONVERSION') {
        variantEvents.conversions++
      }
    })
    
    // Generate time series points
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const point: any = {
        date: dateStr,
        timestamp: date.getTime()
      }
      
      // Add data for each variant
      variants.forEach(variant => {
        const variantEvents = eventsByDate.get(dateStr)?.get(variant.id) || { views: 0, conversions: 0 }
        point[`${variant.id}_views`] = variantEvents.views
        point[`${variant.id}_conversions`] = variantEvents.conversions
        point[`${variant.id}_rate`] = variantEvents.views > 0 
          ? (variantEvents.conversions / variantEvents.views) * 100 
          : 0
      })
      
      timeSeriesData.push(point)
    }
    
    return timeSeriesData
  }

  /**
   * Convert time range string to number of days
   */
  private getTimeRangeDays(timeRange: string): number {
    switch (timeRange) {
      case '1d': return 1
      case '7d': return 7
      case '14d': return 14
      case '30d': return 30
      default: return 7
    }
  }

  /**
   * Track a custom analytics event
   */
  async trackEvent(data: {
    experimentId: string
    variantId?: string
    goalId?: string
    type: 'EXPERIMENT_VIEW' | 'GOAL_CONVERSION' | 'CUSTOM'
    value?: number
    properties?: any
    sessionId?: string
    userId?: string
  }): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Failed to track analytics event:', error)
      // Don't throw - analytics shouldn't break the app
    }
  }
}

export const analyticsService = AnalyticsService.getInstance()
