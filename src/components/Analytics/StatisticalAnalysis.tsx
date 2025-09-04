import React from 'react'
import './StatisticalAnalysis.css'

interface StatisticalData {
  sampleSize: number
  conversions: number
  conversionRate: number
  standardError: number
  confidenceInterval: [number, number]
  zScore?: number
  pValue?: number
}

interface StatisticalAnalysisProps {
  control: StatisticalData
  variant: StatisticalData
  confidenceLevel: number
  minimumSampleSize: number
}

const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({
  control,
  variant,
  confidenceLevel,
  minimumSampleSize
}) => {
  // Calculate statistical significance
  const calculateSignificance = () => {
    const p1 = control.conversionRate / 100
    const p2 = variant.conversionRate / 100
    const n1 = control.sampleSize
    const n2 = variant.sampleSize

    // Pooled standard error
    const pooledP = (control.conversions + variant.conversions) / (n1 + n2)
    const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2))
    
    // Z-score
    const zScore = (p2 - p1) / pooledSE
    
    // Two-tailed p-value
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))
    
    // Statistical significance based on confidence level
    const alpha = (100 - confidenceLevel) / 100
    const isSignificant = pValue < alpha
    
    // Confidence level percentage
    const confidence = (1 - pValue) * 100
    
    return {
      zScore,
      pValue,
      isSignificant,
      confidence: Math.min(confidence, 99.9) // Cap at 99.9%
    }
  }

  // Normal cumulative distribution function approximation
  const normalCDF = (x: number): number => {
    return 0.5 * (1 + erf(x / Math.sqrt(2)))
  }

  // Error function approximation
  const erf = (x: number): number => {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  // Calculate lift
  const lift = ((variant.conversionRate - control.conversionRate) / control.conversionRate) * 100

  // Get significance data
  const significance = calculateSignificance()

  // Determine if we have enough sample size
  const hasEnoughSamples = control.sampleSize >= minimumSampleSize && variant.sampleSize >= minimumSampleSize

  // Get status color and message
  const getStatus = () => {
    if (!hasEnoughSamples) {
      return {
        color: 'orange',
        message: 'Collecting data...',
        description: `Need ${minimumSampleSize} samples per variant for reliable results`
      }
    }
    
    if (significance.isSignificant) {
      return {
        color: 'green',
        message: 'Statistically significant',
        description: `${significance.confidence.toFixed(1)}% confidence that this result is not due to chance`
      }
    } else {
      return {
        color: 'red',
        message: 'Not statistically significant',
        description: 'Continue running the experiment to reach statistical significance'
      }
    }
  }

  const status = getStatus()

  return (
    <div className="statistical-analysis">
      <div className="analysis-header">
        <h3>Statistical Analysis</h3>
        <div className={`status-badge ${status.color}`}>
          {status.message}
        </div>
      </div>

      <div className="analysis-grid">
        <div className="metric-card">
          <h4>Sample Size</h4>
          <div className="metric-comparison">
            <div className="metric-item">
              <span className="label">Control</span>
              <span className="value">{control.sampleSize.toLocaleString()}</span>
            </div>
            <div className="metric-item">
              <span className="label">Variant</span>
              <span className="value">{variant.sampleSize.toLocaleString()}</span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min((Math.min(control.sampleSize, variant.sampleSize) / minimumSampleSize) * 100, 100)}%` 
              }}
            />
          </div>
          <small>
            {Math.min(control.sampleSize, variant.sampleSize)} / {minimumSampleSize} minimum samples
          </small>
        </div>

        <div className="metric-card">
          <h4>Conversion Rate</h4>
          <div className="metric-comparison">
            <div className="metric-item">
              <span className="label">Control</span>
              <span className="value">{control.conversionRate.toFixed(2)}%</span>
              <small>({control.conversions} conversions)</small>
            </div>
            <div className="metric-item">
              <span className="label">Variant</span>
              <span className="value">{variant.conversionRate.toFixed(2)}%</span>
              <small>({variant.conversions} conversions)</small>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h4>Lift</h4>
          <div className={`lift-value ${lift > 0 ? 'positive' : lift < 0 ? 'negative' : 'neutral'}`}>
            {lift > 0 ? '+' : ''}{lift.toFixed(2)}%
          </div>
          <small>
            {lift > 0 ? 'Variant performs better' : lift < 0 ? 'Control performs better' : 'No difference'}
          </small>
        </div>

        <div className="metric-card">
          <h4>Statistical Confidence</h4>
          <div className={`confidence-value ${significance.confidence >= 95 ? 'high' : significance.confidence >= 80 ? 'medium' : 'low'}`}>
            {significance.confidence.toFixed(1)}%
          </div>
          <small>
            Target: {confidenceLevel}%
          </small>
        </div>
      </div>

      <div className="detailed-stats">
        <h4>Detailed Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Z-Score</span>
            <span className="stat-value">{significance.zScore.toFixed(3)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">P-Value</span>
            <span className="stat-value">{significance.pValue.toFixed(4)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Confidence Interval (Control)</span>
            <span className="stat-value">
              [{control.confidenceInterval[0].toFixed(2)}%, {control.confidenceInterval[1].toFixed(2)}%]
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Confidence Interval (Variant)</span>
            <span className="stat-value">
              [{variant.confidenceInterval[0].toFixed(2)}%, {variant.confidenceInterval[1].toFixed(2)}%]
            </span>
          </div>
        </div>
      </div>

      <div className="analysis-interpretation">
        <h4>Interpretation</h4>
        <p>{status.description}</p>
        
        {hasEnoughSamples && (
          <div className="recommendations">
            <h5>Recommendations</h5>
            {significance.isSignificant ? (
              <ul>
                <li>✅ The results are statistically significant</li>
                <li>📊 You can confidently implement the {lift > 0 ? 'variant' : 'control'}</li>
                <li>🎯 Expected improvement: {Math.abs(lift).toFixed(2)}%</li>
              </ul>
            ) : (
              <ul>
                <li>⏱️ Continue running the experiment</li>
                <li>📈 Need more data to reach statistical significance</li>
                <li>🎯 Current confidence: {significance.confidence.toFixed(1)}% (target: {confidenceLevel}%)</li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatisticalAnalysis
