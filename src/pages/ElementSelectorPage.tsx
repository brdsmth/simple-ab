import React, { useState, useEffect } from 'react'
import './ElementSelectorPage.css'

interface ElementInfo {
  tagName: string
  id?: string
  className?: string
  textContent?: string
  attributes: Record<string, string>
  selector: string
}

const ElementSelectorPage: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [_selectedElementInfo, setSelectedElementInfo] = useState<ElementInfo | null>(null)
  const [error, setError] = useState('')

  // Get parameters from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const targetUrl = urlParams.get('url')
    
    if (targetUrl) {
      setWebsiteUrl(targetUrl)
      loadWebsiteViaProxy(targetUrl)
    }
  }, [])

  // Listen for messages from the injected script
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_SELECTED') {
        setSelectedElementInfo(event.data.data)
        
        // Send to parent window (the variant form)
        if (window.opener) {
          window.opener.postMessage({
            type: 'ELEMENT_SELECTED',
            data: event.data.data
          }, '*')
          window.close()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const loadWebsiteViaProxy = async (url: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      // Clean up the URL
      let cleanUrl = url.trim()
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl
      }

      // Remove protocol for proxy URL
      const urlWithoutProtocol = cleanUrl.replace(/^https?:\/\//, '')
      
      // Construct proxy URL
      const proxyUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/proxy/${encodeURIComponent(urlWithoutProtocol)}`
      
      console.log('Loading website via proxy:', proxyUrl)
      
      // Instead of iframe, directly navigate to the proxy URL
      // This avoids CSP frame-ancestors issues
      window.location.href = proxyUrl

    } catch (error) {
      console.error('Error loading website via proxy:', error)
      setError('Failed to load website. Please try again.')
      setIsLoading(false)
    }
  }

  const loadWebsite = () => {
    if (websiteUrl.trim()) {
      loadWebsiteViaProxy(websiteUrl)
    }
  }

  if (isLoading) {
    return (
      <div className="element-selector-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading website with element selector...</h3>
          <p>Please wait while we prepare your website for element selection.</p>
          <div className="loading-details">
            <p>✅ Connecting to proxy server</p>
            <p>🔄 Fetching website content</p>
            <p>⚡ Injecting element selector</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="element-selector-page error">
        <div className="error-container">
          <h3>❌ Error Loading Website</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              onClick={() => {
                setError('')
                if (websiteUrl) {
                  loadWebsiteViaProxy(websiteUrl)
                }
              }} 
              className="btn btn-primary"
            >
              Try Again
            </button>
            <button onClick={() => window.close()} className="btn btn-outline">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!websiteUrl) {
    return (
      <div className="element-selector-page">
        <div className="selector-container">
          <div className="selector-header">
            <h1>🎯 SimpleAB Element Selector</h1>
            <p>Enter your website URL to start selecting elements</p>
          </div>

          <div className="instruction-card">
            <div className="card-header">
              <h3>🚀 How It Works</h3>
            </div>
            <div className="card-content">
              <div className="steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Enter Website URL</h4>
                    <p>Provide the URL of the page where you want to select elements</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Automatic Loading</h4>
                    <p>We'll load your website with our element selector already active</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Visual Selection</h4>
                    <p>Click elements to select them - they'll be highlighted with red boxes</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h4>Automatic Integration</h4>
                    <p>Selected element data is automatically sent back to your variant</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="url-input-section">
            <div className="input-group">
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="Enter your website URL (e.g., example.com)"
                className="form-input"
                onKeyDown={(e) => e.key === 'Enter' && loadWebsite()}
              />
              <button 
                onClick={loadWebsite}
                className="btn btn-primary"
                disabled={!websiteUrl.trim()}
              >
                🌐 Load Website
              </button>
            </div>
            <p className="input-help">
              Enter any website URL. Our proxy will load it with the element selector ready to use.
            </p>
          </div>

          <div className="close-section">
            <button onClick={() => window.close()} className="btn btn-outline">
              Close This Tab
            </button>
          </div>
        </div>
      </div>
    )
  }

  // This should not render as the page content is replaced by iframe
  return null
}

export default ElementSelectorPage