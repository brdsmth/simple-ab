import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import IntegrationsManager from '../components/Integrations/IntegrationsManager'
import './Settings.css'

const Settings: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle profile update
    console.log('Profile update:', { name: formData.name, email: formData.email })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle password change
    console.log('Password change requested')
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences.</p>
      </div>

      <div className="settings-content">
        <div className="settings-nav">
          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`nav-item ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => setActiveTab('integrations')}
          >
            Integrations
          </button>
          <button
            className={`nav-item ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            API Keys
          </button>
        </div>

        <div className="settings-panel">
          {activeTab === 'profile' && (
            <div className="panel-content">
              <h2>Profile Information</h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Update Profile
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="panel-content">
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="panel-content">
              <h2>Notification Preferences</h2>
              <div className="notification-settings">
                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Experiment Completed</h4>
                    <p>Get notified when your experiments reach statistical significance</p>
                  </div>
                  <input type="checkbox" className="notification-toggle" defaultChecked />
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Weekly Reports</h4>
                    <p>Receive weekly summaries of your experiment performance</p>
                  </div>
                  <input type="checkbox" className="notification-toggle" defaultChecked />
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>Goal Conversions</h4>
                    <p>Get alerts when conversion goals are triggered</p>
                  </div>
                  <input type="checkbox" className="notification-toggle" />
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <h4>System Updates</h4>
                    <p>Receive notifications about platform updates and new features</p>
                  </div>
                  <input type="checkbox" className="notification-toggle" defaultChecked />
                </div>
              </div>

              <button className="btn btn-primary">
                Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="panel-content">
              <IntegrationsManager />
            </div>
          )}

          {activeTab === 'api' && (
            <div className="panel-content">
              <h2>API Keys</h2>
              <p className="panel-description">
                Use these API keys to integrate SimpleAB with your applications.
              </p>

              <div className="api-keys">
                <div className="api-key-item">
                  <div className="api-key-info">
                    <h4>Production API Key</h4>
                    <p>Use this key for your live website</p>
                    <code className="api-key">sab_prod_1234567890abcdef...</code>
                  </div>
                  <div className="api-key-actions">
                    <button className="btn btn-outline btn-sm">Copy</button>
                    <button className="btn btn-secondary btn-sm">Regenerate</button>
                  </div>
                </div>

                <div className="api-key-item">
                  <div className="api-key-info">
                    <h4>Development API Key</h4>
                    <p>Use this key for testing and development</p>
                    <code className="api-key">sab_dev_abcdef1234567890...</code>
                  </div>
                  <div className="api-key-actions">
                    <button className="btn btn-outline btn-sm">Copy</button>
                    <button className="btn btn-secondary btn-sm">Regenerate</button>
                  </div>
                </div>
              </div>

              <div className="api-documentation">
                <h3>Documentation</h3>
                <p>
                  Learn how to integrate SimpleAB with your website using our JavaScript SDK.
                </p>
                <button className="btn btn-primary">
                  View Documentation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
