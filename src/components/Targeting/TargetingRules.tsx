import React, { useState } from 'react'
import './TargetingRules.css'

export interface TargetingRule {
  id: string
  type: 'url' | 'device' | 'geo' | 'custom' | 'traffic'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'in' | 'notIn'
  value: string | string[]
  enabled: boolean
}

interface TargetingRulesProps {
  rules: TargetingRule[]
  onChange: (rules: TargetingRule[]) => void
  trafficAllocation: number
  onTrafficAllocationChange: (allocation: number) => void
}

const TargetingRules: React.FC<TargetingRulesProps> = ({
  rules,
  onChange,
  trafficAllocation,
  onTrafficAllocationChange
}) => {
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState<Partial<TargetingRule>>({
    type: 'url',
    operator: 'contains',
    value: '',
    enabled: true
  })

  const ruleTypes = [
    { value: 'url', label: 'URL/Page', description: 'Target specific pages or URL patterns' },
    { value: 'device', label: 'Device Type', description: 'Target desktop, mobile, or tablet users' },
    { value: 'geo', label: 'Geography', description: 'Target users from specific countries/regions' },
    { value: 'custom', label: 'Custom Attribute', description: 'Target based on custom user attributes' },
    { value: 'traffic', label: 'Traffic Source', description: 'Target based on referrer or UTM parameters' }
  ]

  const getOperators = (type: string) => {
    switch (type) {
      case 'device':
      case 'geo':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'in', label: 'Is one of' },
          { value: 'notIn', label: 'Is not one of' }
        ]
      case 'url':
      case 'traffic':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
          { value: 'regex', label: 'Matches regex' }
        ]
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'in', label: 'Is one of' },
          { value: 'notIn', label: 'Is not one of' }
        ]
    }
  }

  const getValuePlaceholder = (type: string, operator: string) => {
    if (operator === 'in' || operator === 'notIn') {
      return 'Enter values separated by commas'
    }
    
    switch (type) {
      case 'url':
        return 'e.g., /checkout, https://example.com/product'
      case 'device':
        return 'e.g., mobile, desktop, tablet'
      case 'geo':
        return 'e.g., US, United States, CA'
      case 'traffic':
        return 'e.g., google.com, utm_source=facebook'
      case 'custom':
        return 'e.g., plan=premium, age>25'
      default:
        return 'Enter value'
    }
  }

  const addRule = () => {
    if (!newRule.type || !newRule.operator || !newRule.value) return

    const rule: TargetingRule = {
      id: Date.now().toString(),
      type: newRule.type as TargetingRule['type'],
      operator: newRule.operator as TargetingRule['operator'],
      value: (newRule.operator === 'in' || newRule.operator === 'notIn') 
        ? (newRule.value as string).split(',').map(v => v.trim())
        : newRule.value as string,
      enabled: true
    }

    onChange([...rules, rule])
    setNewRule({
      type: 'url',
      operator: 'contains',
      value: '',
      enabled: true
    })
    setShowAddRule(false)
  }

  const updateRule = (id: string, updates: Partial<TargetingRule>) => {
    const updatedRules = rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    )
    onChange(updatedRules)
  }

  const removeRule = (id: string) => {
    onChange(rules.filter(rule => rule.id !== id))
  }

  const formatRuleValue = (rule: TargetingRule) => {
    if (Array.isArray(rule.value)) {
      return rule.value.join(', ')
    }
    return rule.value
  }

  const getRuleDescription = (rule: TargetingRule) => {
    const typeLabel = ruleTypes.find(t => t.value === rule.type)?.label || rule.type
    const operatorLabel = getOperators(rule.type).find(o => o.value === rule.operator)?.label || rule.operator
    const value = formatRuleValue(rule)
    
    return `${typeLabel} ${operatorLabel.toLowerCase()} "${value}"`
  }

  return (
    <div className="targeting-rules">
      <div className="targeting-header">
        <h3>Targeting & Audience</h3>
        <p>Define who should see this experiment</p>
      </div>

      {/* Traffic Allocation */}
      <div className="traffic-allocation">
        <h4>Traffic Allocation</h4>
        <div className="allocation-control">
          <input
            type="range"
            min="0"
            max="100"
            value={trafficAllocation}
            onChange={(e) => onTrafficAllocationChange(Number(e.target.value))}
            className="allocation-slider"
          />
          <div className="allocation-display">
            <span className="allocation-value">{trafficAllocation}%</span>
            <span className="allocation-label">of visitors</span>
          </div>
        </div>
        <p className="allocation-description">
          {trafficAllocation < 100 
            ? `${100 - trafficAllocation}% of visitors will see the original experience`
            : 'All eligible visitors will be included in the experiment'
          }
        </p>
      </div>

      {/* Targeting Rules */}
      <div className="rules-section">
        <div className="rules-header">
          <h4>Targeting Rules</h4>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowAddRule(true)}
          >
            Add Rule
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="no-rules">
            <p>No targeting rules defined. The experiment will target all visitors.</p>
          </div>
        ) : (
          <div className="rules-list">
            {rules.map((rule) => (
              <div key={rule.id} className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}>
                <div className="rule-content">
                  <div className="rule-description">
                    {getRuleDescription(rule)}
                  </div>
                  <div className="rule-type-badge">
                    {ruleTypes.find(t => t.value === rule.type)?.label}
                  </div>
                </div>
                
                <div className="rule-actions">
                  <label className="rule-toggle">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                    />
                    <span className="toggle-label">Enabled</span>
                  </label>
                  <button 
                    className="btn-icon delete"
                    onClick={() => removeRule(rule.id)}
                    title="Delete rule"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddRule && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Targeting Rule</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAddRule(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Rule Type</label>
                <select
                  value={newRule.type}
                  onChange={(e) => setNewRule({ 
                    ...newRule, 
                    type: e.target.value as TargetingRule['type'],
                    operator: 'contains' // Reset operator when type changes
                  })}
                  className="form-select"
                >
                  {ruleTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <small className="form-help">
                  {ruleTypes.find(t => t.value === newRule.type)?.description}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Condition</label>
                <select
                  value={newRule.operator}
                  onChange={(e) => setNewRule({ 
                    ...newRule, 
                    operator: e.target.value as TargetingRule['operator']
                  })}
                  className="form-select"
                >
                  {getOperators(newRule.type!).map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Value</label>
                <input
                  type="text"
                  value={newRule.value}
                  onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                  placeholder={getValuePlaceholder(newRule.type!, newRule.operator!)}
                  className="form-input"
                />
                {(newRule.operator === 'in' || newRule.operator === 'notIn') && (
                  <small className="form-help">
                    Separate multiple values with commas
                  </small>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowAddRule(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={addRule}
                disabled={!newRule.type || !newRule.operator || !newRule.value}
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="targeting-preview">
        <h4>Targeting Summary</h4>
        <div className="preview-content">
          <div className="preview-item">
            <strong>Traffic Allocation:</strong> {trafficAllocation}% of visitors
          </div>
          {rules.length > 0 && (
            <div className="preview-item">
              <strong>Active Rules:</strong> {rules.filter(r => r.enabled).length} of {rules.length}
            </div>
          )}
          <div className="preview-item">
            <strong>Estimated Reach:</strong> 
            {rules.length === 0 
              ? ` ~${Math.round(trafficAllocation * 10)} visitors/day`
              : ` ~${Math.round(trafficAllocation * 10 * 0.7)} visitors/day (with targeting)`
            }
          </div>
        </div>
      </div>
    </div>
  )
}

export default TargetingRules
