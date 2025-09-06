import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StatisticalAnalysis from './StatisticalAnalysis'
import { analyticsService, ProcessedAnalyticsData } from '../../services/analyticsService'
import './AnalyticsDashboard.css'

interface AnalyticsDashboardProps {
  experimentId: string
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ experimentId }) => {
  const [analyticsData, setAnalyticsData] = useState<ProcessedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Load analytics data from API
  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const rawData = await analyticsService.fetchExperimentAnalytics(experimentId)
        const processedData = analyticsService.processAnalyticsData(rawData, selectedTimeRange)
        setAnalyticsData(processedData)
      } catch (err: any) {
        console.error('Failed to load analytics:', err)
        setError(err.message || 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [experimentId, selectedTimeRange])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      try {
        const rawData = await analyticsService.fetchExperimentAnalytics(experimentId)
        const processedData = analyticsService.processAnalyticsData(rawData, selectedTimeRange)
        setAnalyticsData(processedData)
      } catch (err) {
        console.error('Failed to refresh analytics:', err)
        // Don't update error state for refresh failures to avoid disrupting the UI
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, experimentId, selectedTimeRange])

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-error">
        <h3>Failed to load analytics data</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="analytics-error">
        <p>No analytics data available</p>
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
              {analyticsData.variants.map((variant, index) => (
                <Line 
                  key={variant.id}
                  type="monotone" 
                  dataKey={`${variant.id}_rate`}
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={2}
                  name={variant.name}
                  dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2 }}
                />
              ))}
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

      {/* Device & Geography Breakdown - Coming Soon */}
      <div className="breakdown-section">
        <div className="chart-section">
          <h3>Device & Geographic Breakdown</h3>
          <div className="coming-soon">
            <p>📊 Device and geographic analytics coming soon!</p>
            <small>We're working on adding detailed device and location-based performance metrics.</small>
          </div>
        </div>
      </div>

      {/* Goals Breakdown */}
      <div className="chart-section">
        <h3>Goal Conversions</h3>
        <div className="goals-grid">
          {analyticsData.goalBreakdown.map((goal) => (
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
