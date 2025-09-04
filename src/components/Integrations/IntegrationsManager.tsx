import React, { useState } from 'react'
import './IntegrationsManager.css'

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  category: 'analytics' | 'marketing' | 'crm' | 'webhook'
  status: 'connected' | 'disconnected' | 'error'
  config?: Record<string, any>
  lastSync?: string
}

interface IntegrationsManagerProps {
  projectId?: string
}

const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ projectId }) => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'google-analytics',
      name: 'Google Analytics 4',
      description: 'Send experiment data to Google Analytics for deeper analysis',
      icon: '📊',
      category: 'analytics',
      status: 'disconnected',
      config: {}
    },
    {
      id: 'facebook-pixel',
      name: 'Facebook Pixel',
      description: 'Track conversions and create custom audiences',
      icon: '📘',
      category: 'marketing',
      status: 'disconnected',
      config: {}
    },
    {
      id: 'google-ads',
      name: 'Google Ads',
      description: 'Import conversion data for ad optimization',
      icon: '🎯',
      category: 'marketing',
      status: 'disconnected',
      config: {}
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      description: 'Advanced product analytics and user behavior tracking',
      icon: '📈',
      category: 'analytics',
      status: 'connected',
      config: { projectToken: 'abc123***' },
      lastSync: '2024-01-15T10:30:00Z'
    },
    {
      id: 'amplitude',
      name: 'Amplitude',
      description: 'Digital optimization and product intelligence',
      icon: '⚡',
      category: 'analytics',
      status: 'disconnected',
      config: {}
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'CRM integration for lead tracking and nurturing',
      icon: '🧡',
      category: 'crm',
      status: 'disconnected',
      config: {}
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Enterprise CRM integration',
      icon: '☁️',
      category: 'crm',
      status: 'disconnected',
      config: {}
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get experiment notifications in Slack channels',
      icon: '💬',
      category: 'webhook',
      status: 'connected',
      config: { webhookUrl: 'https://hooks.slack.com/***' },
      lastSync: '2024-01-15T09:15:00Z'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to 5000+ apps via Zapier webhooks',
      icon: '⚡',
      category: 'webhook',
      status: 'disconnected',
      config: {}
    }
  ])

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showConfigModal, setShowConfigModal] = useState<string | null>(null)
  const [configData, setConfigData] = useState<Record<string, any>>({})

  const categories = [
    { value: 'all', label: 'All Integrations', count: integrations.length },
    { value: 'analytics', label: 'Analytics', count: integrations.filter(i => i.category === 'analytics').length },
    { value: 'marketing', label: 'Marketing', count: integrations.filter(i => i.category === 'marketing').length },
    { value: 'crm', label: 'CRM', count: integrations.filter(i => i.category === 'crm').length },
    { value: 'webhook', label: 'Webhooks', count: integrations.filter(i => i.category === 'webhook').length }
  ]

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory)

  const getStatusBadge = (status: Integration['status']) => {
    const statusConfig = {
      connected: { label: 'Connected', className: 'success' },
      disconnected: { label: 'Not Connected', className: 'secondary' },
      error: { label: 'Error', className: 'danger' }
    }
    return statusConfig[status]
  }

  const handleConnect = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId)
    if (!integration) return

    setConfigData(integration.config || {})
    setShowConfigModal(integrationId)
  }

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: 'disconnected', config: {}, lastSync: undefined }
        : integration
    ))
  }

  const handleSaveConfig = () => {
    if (!showConfigModal) return

    setIntegrations(prev => prev.map(integration => 
      integration.id === showConfigModal 
        ? { 
            ...integration, 
            status: 'connected', 
            config: configData,
            lastSync: new Date().toISOString()
          }
        : integration
    ))
    setShowConfigModal(null)
    setConfigData({})
  }

  const getConfigFields = (integrationId: string) => {
    switch (integrationId) {
      case 'google-analytics':
        return [
          { key: 'measurementId', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX', required: true },
          { key: 'apiSecret', label: 'API Secret', placeholder: 'API Secret from GA4', required: true },
          { key: 'customDimension', label: 'Custom Dimension Index', placeholder: '1', type: 'number' }
        ]
      case 'facebook-pixel':
        return [
          { key: 'pixelId', label: 'Pixel ID', placeholder: '1234567890123456', required: true },
          { key: 'accessToken', label: 'Access Token', placeholder: 'Access token from Facebook', required: true },
          { key: 'testEventCode', label: 'Test Event Code', placeholder: 'Optional test event code' }
        ]
      case 'google-ads':
        return [
          { key: 'customerId', label: 'Customer ID', placeholder: '123-456-7890', required: true },
          { key: 'conversionId', label: 'Conversion ID', placeholder: 'Conversion tracking ID', required: true }
        ]
      case 'mixpanel':
        return [
          { key: 'projectToken', label: 'Project Token', placeholder: 'Your Mixpanel project token', required: true },
          { key: 'apiSecret', label: 'API Secret', placeholder: 'Service account secret', required: true }
        ]
      case 'amplitude':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'Your Amplitude API key', required: true },
          { key: 'secretKey', label: 'Secret Key', placeholder: 'Your Amplitude secret key', required: true }
        ]
      case 'hubspot':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'HubSpot API key', required: true },
          { key: 'portalId', label: 'Portal ID', placeholder: 'Your HubSpot portal ID', required: true }
        ]
      case 'salesforce':
        return [
          { key: 'clientId', label: 'Client ID', placeholder: 'Connected App Client ID', required: true },
          { key: 'clientSecret', label: 'Client Secret', placeholder: 'Connected App Client Secret', required: true },
          { key: 'username', label: 'Username', placeholder: 'Salesforce username', required: true }
        ]
      case 'slack':
        return [
          { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...', required: true },
          { key: 'channel', label: 'Channel', placeholder: '#experiments', required: false }
        ]
      case 'zapier':
        return [
          { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...', required: true }
        ]
      default:
        return []
    }
  }

  return (
    <div className="integrations-manager">
      <div className="integrations-header">
        <div>
          <h2>Integrations</h2>
          <p>Connect SimpleAB with your favorite tools to streamline your workflow</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category.value}
            className={`category-btn ${selectedCategory === category.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.value)}
          >
            {category.label}
            <span className="category-count">{category.count}</span>
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="integrations-grid">
        {filteredIntegrations.map(integration => {
          const statusBadge = getStatusBadge(integration.status)
          
          return (
            <div key={integration.id} className="integration-card">
              <div className="integration-header">
                <div className="integration-icon">{integration.icon}</div>
                <div className="integration-info">
                  <h3>{integration.name}</h3>
                  <p>{integration.description}</p>
                </div>
                <div className={`status-badge ${statusBadge.className}`}>
                  {statusBadge.label}
                </div>
              </div>
              
              {integration.status === 'connected' && integration.lastSync && (
                <div className="integration-meta">
                  <span className="last-sync">
                    Last sync: {new Date(integration.lastSync).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="integration-actions">
                {integration.status === 'connected' ? (
                  <>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleConnect(integration.id)}
                    >
                      Configure
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDisconnect(integration.id)}
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConnect(integration.id)}
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                Configure {integrations.find(i => i.id === showConfigModal)?.name}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowConfigModal(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="config-form">
                {getConfigFields(showConfigModal).map(field => (
                  <div key={field.key} className="form-group">
                    <label className="form-label">
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={configData[field.key] || ''}
                      onChange={(e) => setConfigData({
                        ...configData,
                        [field.key]: e.target.value
                      })}
                      placeholder={field.placeholder}
                      className="form-input"
                      required={field.required}
                    />
                  </div>
                ))}
              </div>
              
              <div className="integration-help">
                <h4>Setup Instructions</h4>
                <div className="help-content">
                  {showConfigModal === 'google-analytics' && (
                    <ol>
                      <li>Go to Google Analytics 4 property</li>
                      <li>Navigate to Admin → Data Streams</li>
                      <li>Copy your Measurement ID (G-XXXXXXXXXX)</li>
                      <li>Generate an API Secret in the Measurement Protocol section</li>
                    </ol>
                  )}
                  {showConfigModal === 'facebook-pixel' && (
                    <ol>
                      <li>Go to Facebook Events Manager</li>
                      <li>Copy your Pixel ID from the pixel details</li>
                      <li>Generate an access token in Business Settings</li>
                      <li>Optionally add a test event code for debugging</li>
                    </ol>
                  )}
                  {showConfigModal === 'slack' && (
                    <ol>
                      <li>Go to your Slack workspace settings</li>
                      <li>Create a new incoming webhook</li>
                      <li>Select the channel for notifications</li>
                      <li>Copy the webhook URL</li>
                    </ol>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowConfigModal(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveConfig}
                disabled={!getConfigFields(showConfigModal).every(field => 
                  !field.required || configData[field.key]
                )}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntegrationsManager
