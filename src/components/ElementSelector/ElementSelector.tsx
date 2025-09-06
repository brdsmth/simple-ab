import React, { useState, useEffect } from 'react'
import './ElementSelector.css'

interface ElementSelectorProps {
  onElementSelected: (selector: string, elementInfo: ElementInfo) => void
  onClose: () => void
  websiteUrl?: string
}

interface ElementInfo {
  tagName: string
  id?: string
  className?: string
  textContent?: string
  attributes: Record<string, string>
}

const ElementSelector: React.FC<ElementSelectorProps> = ({ 
  onElementSelected, 
  onClose, 
  websiteUrl 
}) => {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const [_hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [websiteInput, setWebsiteInput] = useState(websiteUrl || '')
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    // Initialize the selector when component mounts
    initializeSelector()
    
    return () => {
      // Cleanup when component unmounts
      cleanupSelector()
    }
  }, [])

  const initializeSelector = () => {
    // Add event listeners for element selection
    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)
  }

  const cleanupSelector = () => {
    document.removeEventListener('mouseover', handleMouseOver)
    document.removeEventListener('mouseout', handleMouseOut)
    document.removeEventListener('click', handleClick)
    document.removeEventListener('keydown', handleKeyDown)
    
    // Remove any existing highlights
    removeAllHighlights()
  }

  const handleMouseOver = (e: MouseEvent) => {
    if (!isSelecting) return
    
    const target = e.target as HTMLElement
    if (target.closest('.element-selector-overlay')) return // Don't select our own overlay
    
    setHoveredElement(target as HTMLElement)
    highlightElement(target, 'hover')
  }

  const handleMouseOut = (e: MouseEvent) => {
    if (!isSelecting) return
    
    const target = e.target as HTMLElement
    if (target.closest('.element-selector-overlay')) return
    
    removeHighlight(target, 'hover')
    setHoveredElement(null)
  }

  const handleClick = (e: MouseEvent) => {
    if (!isSelecting) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const target = e.target as HTMLElement
    if (target.closest('.element-selector-overlay')) return
    
    setSelectedElement(target)
    highlightElement(target, 'selected')
    
    // Generate selector and element info
    const selector = generateSelector(target)
    const elementInfo = getElementInfo(target)
    
    // Call the callback with the selected element info
    onElementSelected(selector, elementInfo)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSelecting(false)
      removeAllHighlights()
    }
  }

  const generateSelector = (element: HTMLElement): string => {
    // Generate a CSS selector for the element
    const selectors: string[] = []
    
    // Start with tag name
    let tagName = element.tagName.toLowerCase()
    
    // Add ID if available
    if (element.id) {
      return `#${element.id}`
    }
    
    // Add class names
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim())
      if (classes.length > 0) {
        tagName += '.' + classes.join('.')
      }
    }
    
    selectors.push(tagName)
    
    // If we don't have a unique selector yet, build a path
    let current = element
    while (current.parentElement && document.querySelectorAll(selectors.join(' > ')).length > 1) {
      const parent = current.parentElement
      let parentSelector = parent.tagName.toLowerCase()
      
      if (parent.id) {
        selectors.unshift(`#${parent.id}`)
        break
      }
      
      if (parent.className) {
        const classes = parent.className.split(' ').filter(c => c.trim())
        if (classes.length > 0) {
          parentSelector += '.' + classes.join('.')
        }
      }
      
      // Add nth-child if needed for specificity
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName === current.tagName
      )
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        parentSelector += `:nth-child(${index})`
      }
      
      selectors.unshift(parentSelector)
      current = parent
    }
    
    return selectors.join(' > ')
  }

  const getElementInfo = (element: HTMLElement): ElementInfo => {
    const attributes: Record<string, string> = {}
    
    // Get all attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      attributes[attr.name] = attr.value
    }
    
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent?.trim().substring(0, 100) || undefined,
      attributes
    }
  }

  const highlightElement = (element: HTMLElement, type: 'hover' | 'selected') => {
    removeHighlight(element, type === 'hover' ? 'selected' : 'hover')
    element.classList.add(`element-selector-${type}`)
  }

  const removeHighlight = (element: HTMLElement, type: 'hover' | 'selected') => {
    element.classList.remove(`element-selector-${type}`)
  }

  const removeAllHighlights = () => {
    document.querySelectorAll('.element-selector-hover, .element-selector-selected')
      .forEach(el => {
        el.classList.remove('element-selector-hover', 'element-selector-selected')
      })
  }

  const startSelecting = () => {
    setIsSelecting(true)
    removeAllHighlights()
  }

  const stopSelecting = () => {
    setIsSelecting(false)
    removeAllHighlights()
  }

  const navigateToWebsite = () => {
    if (websiteInput.trim()) {
      const url = websiteInput.startsWith('http') ? websiteInput : `https://${websiteInput}`
      setCurrentUrl(url)
      window.location.href = url
    }
  }

  return (
    <div className="element-selector-overlay">
      <div className="element-selector-panel">
        <div className="panel-header">
          <h3>Element Selector</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="panel-content">
          {!currentUrl ? (
            <div className="website-input-section">
              <p>Enter your website URL to start selecting elements:</p>
              <div className="input-group">
                <input
                  type="text"
                  value={websiteInput}
                  onChange={(e) => setWebsiteInput(e.target.value)}
                  placeholder="example.com or https://example.com"
                  className="form-input"
                  onKeyDown={(e) => e.key === 'Enter' && navigateToWebsite()}
                />
                <button 
                  onClick={navigateToWebsite}
                  className="btn btn-primary"
                  disabled={!websiteInput.trim()}
                >
                  Go
                </button>
              </div>
            </div>
          ) : (
            <div className="selector-controls">
              <div className="current-url">
                <strong>Current page:</strong> {currentUrl}
              </div>
              
              {!isSelecting ? (
                <button 
                  onClick={startSelecting}
                  className="btn btn-primary"
                >
                  Start Selecting Elements
                </button>
              ) : (
                <div className="selecting-mode">
                  <div className="selecting-instructions">
                    <p><strong>Selection Mode Active</strong></p>
                    <p>• Hover over elements to highlight them</p>
                    <p>• Click on an element to select it</p>
                    <p>• Press ESC to cancel</p>
                  </div>
                  
                  <button 
                    onClick={stopSelecting}
                    className="btn btn-secondary"
                  >
                    Stop Selecting
                  </button>
                </div>
              )}
              
              {selectedElement && (
                <div className="selected-element-info">
                  <h4>Selected Element:</h4>
                  <div className="element-details">
                    <p><strong>Tag:</strong> {selectedElement.tagName.toLowerCase()}</p>
                    {selectedElement.id && <p><strong>ID:</strong> #{selectedElement.id}</p>}
                    {selectedElement.className && <p><strong>Classes:</strong> .{selectedElement.className.split(' ').join('.')}</p>}
                    <p><strong>Selector:</strong> <code>{generateSelector(selectedElement)}</code></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ElementSelector
