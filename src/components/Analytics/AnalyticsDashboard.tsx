import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import StatisticalAnalysis from './StatisticalAnalysis'
import './AnalyticsDashboard.css'

interface AnalyticsData {
  experimentId: string
  experimentName: string
  startDate: string
  status: 'running' | 'paused' | 'completed'
  totalVisitors: number
  totalConversions: number
  overallConversionRate: number
  variants: VariantData[]
  timeSeriesData: TimeSeriesPoint[]
  deviceBreakdown: DeviceData[]
  geoData: GeoData[]
  goalBreakdown: GoalData[]
}

interface VariantData {
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
}

interface TimeSeriesPoint {
  date: string
  timestamp: number
  control: number
  variant: number
  controlConversions: number
  variantConversions: number
}

interface DeviceData {
  device: string
  visitors: number
  conversions: number
  conversionRate: number
}

interface GeoData {
  country: string
  visitors: number
  conversions: number
  conversionRate: number
}

interface GoalData {
  goalName: string
  conversions: number
  value: number
}

interface AnalyticsDashboardProps {
  experimentId: string
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ experimentId }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock data - in a real app, this would come from your API
  const generateMockData = (): AnalyticsData => {
    const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const timeSeriesData: TimeSeriesPoint[] = []
    
    // Generate time series data
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const baseVisitors = 100 + Math.random() * 50
      const controlVisitors = baseVisitors * 0.5
      const variantVisitors = baseVisitors * 0.5
      
      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        control: controlVisitors,
        variant: variantVisitors,
        controlConversions: controlVisitors * (0.025 + Math.random() * 0.01),
        variantConversions: variantVisitors * (0.035 + Math.random() * 0.015)
      })
    }

    const totalControlVisitors = timeSeriesData.reduce((sum, point) => sum + point.control, 0)
    const totalVariantVisitors = timeSeriesData.reduce((sum, point) => sum + point.variant, 0)
    const totalControlConversions = timeSeriesData.reduce((sum, point) => sum + point.controlConversions, 0)
    const totalVariantConversions = timeSeriesData.reduce((sum, point) => sum + point.variantConversions, 0)

    return {
      experimentId,
      experimentName: 'Homepage Hero Button Test',
      startDate: startDate.toISOString(),
      status: 'running',
      totalVisitors: Math.round(totalControlVisitors + totalVariantVisitors),
      totalConversions: Math.round(totalControlConversions + totalVariantConversions),
      overallConversionRate: ((totalControlConversions + totalVariantConversions) / (totalControlVisitors + totalVariantVisitors)) * 100,
      variants: [
        {
          id: 'control',
          name: 'Control (Blue Button)',
          isControl: true,
          visitors: Math.round(totalControlVisitors),
          conversions: Math.round(totalControlConversions),
          conversionRate: (totalControlConversions / totalControlVisitors) * 100,
          allocation: 50,
          revenue: Math.round(totalControlConversions * 29.99),
          standardError: 0.5,
          confidenceInterval: [2.1, 3.4]
        },
        {
          id: 'variant-a',
          name: 'Variant A (Green Button)',
          isControl: false,
          visitors: Math.round(totalVariantVisitors),
          conversions: Math.round(totalVariantConversions),
          conversionRate: (totalVariantConversions / totalVariantVisitors) * 100,
          allocation: 50,
          revenue: Math.round(totalVariantConversions * 29.99),
          standardError: 0.6,
          confidenceInterval: [3.2, 4.8]
        }
      ],
      timeSeriesData,
      deviceBreakdown: [
        { device: 'Desktop', visitors: 1200, conversions: 45, conversionRate: 3.75 },
        { device: 'Mobile', visitors: 800, conversions: 28, conversionRate: 3.5 },
        { device: 'Tablet', visitors: 200, conversions: 6, conversionRate: 3.0 }
      ],
      geoData: [
        { country: 'United States', visitors: 1500, conversions: 55, conversionRate: 3.67 },
        { country: 'United Kingdom', visitors: 400, conversions: 14, conversionRate: 3.5 },
        { country: 'Canada', visitors: 300, conversions: 10, conversionRate: 3.33 }
      ],
      goalBreakdown: [
        { goalName: 'Button Click', conversions: 79, value: 79 },
        { goalName: 'Sign Up', conversions: 45, value: 1347 },
        { goalName: 'Purchase', conversions: 12, value: 359.88 }
      ]
    }
  }

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        const data = generateMockData()
        setAnalyticsData(data)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [experimentId, selectedTimeRange])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      if (analyticsData) {
        // Simulate real-time updates
        const updatedData = generateMockData()
        setAnalyticsData(updatedData)
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, analyticsData])

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="analytics-error">
        <p>Failed to load analytics data</p>
      </div>
    )
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>{analyticsData.experimentName}</h2>
          <div className="experiment-meta">
            <span className={`status-badge ${analyticsData.status}`}>
              {analyticsData.status}
            </span>
            <span className="start-date">
              Started {new Date(analyticsData.startDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="dashboard-controls">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Visitors</h3>
          <div className="metric-value">{analyticsData.totalVisitors.toLocaleString()}</div>
          <div className="metric-change positive">+12.3% vs last period</div>
        </div>
        
        <div className="metric-card">
          <h3>Total Conversions</h3>
          <div className="metric-value">{analyticsData.totalConversions}</div>
          <div className="metric-change positive">+18.7% vs last period</div>
        </div>
        
        <div className="metric-card">
          <h3>Overall Conversion Rate</h3>
          <div className="metric-value">{analyticsData.overallConversionRate.toFixed(2)}%</div>
          <div className="metric-change positive">+0.8pp vs last period</div>
        </div>
        
        <div className="metric-card">
          <h3>Revenue Impact</h3>
          <div className="metric-value">
            ${analyticsData.variants.reduce((sum, v) => sum + (v.revenue || 0), 0).toLocaleString()}
          </div>
          <div className="metric-change positive">+$1,247 vs control</div>
        </div>
      </div>

      {/* Conversion Rate Over Time */}
      <div className="chart-section">
        <h3>Conversion Rate Over Time</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="controlConversions" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Control"
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="variantConversions" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Variant A"
                dot={{ fill: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistical Analysis */}
      <StatisticalAnalysis
        control={{
          sampleSize: analyticsData.variants[0].visitors,
          conversions: analyticsData.variants[0].conversions,
          conversionRate: analyticsData.variants[0].conversionRate,
          standardError: analyticsData.variants[0].standardError,
          confidenceInterval: analyticsData.variants[0].confidenceInterval
        }}
        variant={{
          sampleSize: analyticsData.variants[1].visitors,
          conversions: analyticsData.variants[1].conversions,
          conversionRate: analyticsData.variants[1].conversionRate,
          standardError: analyticsData.variants[1].standardError,
          confidenceInterval: analyticsData.variants[1].confidenceInterval
        }}
        confidenceLevel={95}
        minimumSampleSize={1000}
      />

      {/* Variant Performance */}
      <div className="chart-section">
        <h3>Variant Performance</h3>
        <div className="variants-comparison">
          {analyticsData.variants.map((variant) => (
            <div key={variant.id} className={`variant-card ${variant.isControl ? 'control' : ''}`}>
              <div className="variant-header">
                <h4>{variant.name}</h4>
                {variant.isControl && <span className="control-badge">Control</span>}
              </div>
              
              <div className="variant-metrics">
                <div className="variant-metric">
                  <span className="metric-label">Visitors</span>
                  <span className="metric-value">{variant.visitors.toLocaleString()}</span>
                </div>
                <div className="variant-metric">
                  <span className="metric-label">Conversions</span>
                  <span className="metric-value">{variant.conversions}</span>
                </div>
                <div className="variant-metric">
                  <span className="metric-label">Conversion Rate</span>
                  <span className="metric-value">{variant.conversionRate.toFixed(2)}%</span>
                </div>
                {variant.revenue && (
                  <div className="variant-metric">
                    <span className="metric-label">Revenue</span>
                    <span className="metric-value">${variant.revenue.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device & Geography Breakdown */}
      <div className="breakdown-section">
        <div className="chart-section">
          <h3>Device Breakdown</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, conversionRate }) => `${device}: ${conversionRate.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="visitors"
                >
                  {analyticsData.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-section">
          <h3>Geographic Performance</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData.geoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Conversion Rate']} />
                <Bar dataKey="conversionRate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Goals Breakdown */}
      <div className="chart-section">
        <h3>Goal Conversions</h3>
        <div className="goals-grid">
          {analyticsData.goalBreakdown.map((goal, index) => (
            <div key={goal.goalName} className="goal-card">
              <h4>{goal.goalName}</h4>
              <div className="goal-metrics">
                <div className="goal-metric">
                  <span className="metric-label">Conversions</span>
                  <span className="metric-value">{goal.conversions}</span>
                </div>
                <div className="goal-metric">
                  <span className="metric-label">Total Value</span>
                  <span className="metric-value">{goal.value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
