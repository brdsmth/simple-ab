// Element Selector Script for SimpleAB A/B Testing Platform
// This script is injected into proxied websites to enable visual element selection

(function() {
  if (window.simpleABSelector) return;
  
  window.simpleABSelector = {
    isSelecting: false,
    selectedElement: null,
    hoveredElement: null,
    overlay: null,
    
    init: function() {
      this.createOverlay();
      this.addStyles();
      console.log('SimpleAB Element Selector initialized');
    },
    
    createOverlay: function() {
      const overlay = document.createElement('div');
      overlay.id = 'simpleab-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 2147483647;
        pointer-events: none;
      `;
      
      const panel = document.createElement('div');
      panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        border: 2px solid #e5e7eb;
        pointer-events: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 2147483647;
      `;
      
      panel.innerHTML = `
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.1rem;">🎯 Element Selector</h3>
          <button onclick="window.simpleABSelector.close()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">×</button>
        </div>
        <div style="padding: 20px;">
          <div id="simpleab-instructions" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #0c4a6e;">🚀 Ready to Select</h4>
            <p style="margin: 0; color: #0369a1; font-size: 14px;">Click the button below to start selecting elements.</p>
          </div>
          <button id="simpleab-start" onclick="window.simpleABSelector.startSelection()" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 12px;">🎯 Start Element Selection</button>
          <div id="simpleab-element-info" style="display: none; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 8px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; color: #166534; text-align: center;">✅ Element Selected!</h4>
            <div id="simpleab-details" style="background: rgba(255,255,255,0.8); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 12px;"></div>
            <button onclick="window.simpleABSelector.useElement()" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">✅ Use This Element</button>
            <button onclick="window.simpleABSelector.copySelector()" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">📋 Copy Selector Only</button>
            <button onclick="window.simpleABSelector.resetSelection()" style="width: 100%; padding: 8px; background: white; border: 2px solid #d1d5db; border-radius: 8px; color: #374151; cursor: pointer;">Select Different Element</button>
          </div>
        </div>
      `;
      
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      this.overlay = overlay;
    },
    
    addStyles: function() {
      if (document.getElementById('simpleab-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'simpleab-styles';
      style.textContent = `
        .simpleab-highlight-hover {
          outline: 3px solid #ef4444 !important;
          outline-offset: 2px !important;
          cursor: crosshair !important;
          background-color: rgba(239, 68, 68, 0.08) !important;
          position: relative !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
          z-index: 2147483646 !important;
        }
        .simpleab-highlight-hover::before {
          content: '🎯 Click to select';
          position: absolute !important;
          top: -28px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: #ef4444 !important;
          color: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          z-index: 2147483647 !important;
          white-space: nowrap !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          pointer-events: none !important;
        }
        .simpleab-highlight-selected {
          outline: 3px solid #10b981 !important;
          outline-offset: 2px !important;
          background-color: rgba(16, 185, 129, 0.1) !important;
          position: relative !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3) !important;
          z-index: 2147483646 !important;
        }
        .simpleab-highlight-selected::before {
          content: '✅ Selected';
          position: absolute !important;
          top: -28px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: #10b981 !important;
          color: white !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          z-index: 2147483647 !important;
          white-space: nowrap !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    },
    
    startSelection: function() {
      this.isSelecting = true;
      document.getElementById('simpleab-start').style.display = 'none';
      document.getElementById('simpleab-instructions').innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: #991b1b;">🎯 Selection Mode Active</h4>
        <p style="margin: 4px 0; font-size: 12px; color: #7f1d1d;">• Hover over elements to highlight them</p>
        <p style="margin: 4px 0; font-size: 12px; color: #7f1d1d;">• Click on an element to select it</p>
        <p style="margin: 4px 0; font-size: 12px; color: #7f1d1d;">• Press ESC to cancel</p>
        <button onclick="window.simpleABSelector.stopSelection()" style="margin-top: 8px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel Selection</button>
      `;
      
      document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
      document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
      document.addEventListener('click', this.handleClick.bind(this), true);
      document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    },
    
    stopSelection: function() {
      this.isSelecting = false;
      document.removeEventListener('mouseover', this.handleMouseOver.bind(this), true);
      document.removeEventListener('mouseout', this.handleMouseOut.bind(this), true);
      document.removeEventListener('click', this.handleClick.bind(this), true);
      document.removeEventListener('keydown', this.handleKeyDown.bind(this), true);
      this.removeAllHighlights();
      
      document.getElementById('simpleab-start').style.display = 'block';
      document.getElementById('simpleab-instructions').innerHTML = `
        <h4 style="margin: 0 0 8px 0; color: #0c4a6e;">🚀 Ready to Select</h4>
        <p style="margin: 0; color: #0369a1; font-size: 14px;">Click the button below to start selecting elements.</p>
      `;
    },
    
    handleMouseOver: function(e) {
      if (!this.isSelecting) return;
      const target = e.target;
      if (target.closest('#simpleab-overlay')) return;
      
      if (this.hoveredElement && this.hoveredElement !== target) {
        this.removeHighlight(this.hoveredElement, 'hover');
      }
      
      this.hoveredElement = target;
      this.highlightElement(target, 'hover');
    },
    
    handleMouseOut: function(e) {
      if (!this.isSelecting) return;
      const target = e.target;
      if (target.closest('#simpleab-overlay')) return;
      
      if (this.hoveredElement === target) {
        this.removeHighlight(target, 'hover');
        this.hoveredElement = null;
      }
    },
    
    handleClick: function(e) {
      if (!this.isSelecting) return;
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target;
      if (target.closest('#simpleab-overlay')) return;
      
      this.selectElement(target);
    },
    
    handleKeyDown: function(e) {
      if (e.key === 'Escape') {
        this.stopSelection();
      }
    },
    
    selectElement: function(element) {
      if (this.selectedElement) {
        this.removeHighlight(this.selectedElement, 'selected');
      }
      
      this.selectedElement = element;
      this.highlightElement(element, 'selected');
      
      const selector = this.generateSelector(element);
      const elementInfo = {
        tagName: element.tagName.toLowerCase(),
        id: element.id || undefined,
        className: element.className || undefined,
        textContent: element.textContent ? element.textContent.trim().substring(0, 100) : undefined,
        selector: selector,
        attributes: this.getAttributes(element)
      };
      
      this.stopSelection();
      this.showElementInfo(elementInfo);
      this.currentElementInfo = elementInfo;
    },
    
    showElementInfo: function(elementInfo) {
      const detailsHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <strong style="color: #166534;">Element:</strong>
          <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px; color: #166534;">&lt;${elementInfo.tagName}&gt;</code>
        </div>
        ${elementInfo.id ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong style="color: #166534;">ID:</strong>
            <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px; color: #166534;">#${elementInfo.id}</code>
          </div>
        ` : ''}
        ${elementInfo.className ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong style="color: #166534;">Classes:</strong>
            <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px; color: #166534;">.${elementInfo.className.split(' ').filter(c => c.trim()).join('.')}</code>
          </div>
        ` : ''}
        <div style="margin-bottom: 8px;">
          <strong style="color: #166534;">CSS Selector:</strong><br>
          <code style="background: #dcfce7; padding: 4px 6px; border-radius: 4px; color: #166534; word-break: break-all; display: block; margin-top: 4px;">${elementInfo.selector}</code>
        </div>
      `;
      
      document.getElementById('simpleab-details').innerHTML = detailsHTML;
      document.getElementById('simpleab-element-info').style.display = 'block';
      document.getElementById('simpleab-instructions').style.display = 'none';
    },
    
    generateSelector: function(element) {
      // Prioritize ID if available and unique
      if (element.id && !element.id.includes(' ')) {
        return '#' + element.id;
      }
      
      let selector = element.tagName.toLowerCase();
      
      // Add classes if available
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ')
          .filter(c => c.trim() && !c.startsWith('simpleab-highlight'))
          .slice(0, 3); // Limit to first 3 classes to avoid overly long selectors
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }
      
      // If selector is not unique, build a more specific path
      if (document.querySelectorAll(selector).length > 1) {
        const path = [];
        let current = element;
        let depth = 0;
        
        while (current && current !== document.body && depth < 5) {
          let currentSelector = current.tagName.toLowerCase();
          
          // Use ID if available
          if (current.id && !current.id.includes(' ')) {
            path.unshift('#' + current.id);
            break;
          }
          
          // Add classes
          if (current.className && typeof current.className === 'string') {
            const classes = current.className.split(' ')
              .filter(c => c.trim() && !c.startsWith('simpleab-highlight'))
              .slice(0, 2); // Limit classes for intermediate elements
            if (classes.length > 0) {
              currentSelector += '.' + classes.join('.');
            }
          }
          
          // Add nth-child if there are multiple siblings of the same type
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(child => 
              child.tagName === current.tagName
            );
            if (siblings.length > 1) {
              const index = siblings.indexOf(current) + 1;
              currentSelector += ':nth-child(' + index + ')';
            }
          }
          
          path.unshift(currentSelector);
          current = parent;
          depth++;
          
          // Check if current path is unique
          if (path.length > 1 && document.querySelectorAll(path.join(' > ')).length === 1) {
            break;
          }
        }
        
        return path.join(' > ');
      }
      
      return selector;
    },
    
    getAttributes: function(element) {
      const attributes = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (!attr.name.startsWith('data-simpleab')) {
          attributes[attr.name] = attr.value;
        }
      }
      return attributes;
    },
    
    highlightElement: function(element, type) {
      element.classList.add('simpleab-highlight-' + type);
    },
    
    removeHighlight: function(element, type) {
      element.classList.remove('simpleab-highlight-' + type);
    },
    
    removeAllHighlights: function() {
      document.querySelectorAll('.simpleab-highlight-hover, .simpleab-highlight-selected')
        .forEach(el => {
          el.classList.remove('simpleab-highlight-hover', 'simpleab-highlight-selected');
        });
    },
    
    useElement: function() {
      if (window.opener) {
        // Send selected element data back to parent window
        window.opener.postMessage({
          type: 'ELEMENT_SELECTED',
          data: this.currentElementInfo
        }, '*');
        window.close();
      } else {
        // Fallback: copy just the CSS selector to clipboard
        navigator.clipboard.writeText(this.currentElementInfo.selector);
        alert('CSS selector copied to clipboard: ' + this.currentElementInfo.selector);
      }
    },
    
    copySelector: function() {
      if (this.currentElementInfo && this.currentElementInfo.selector) {
        navigator.clipboard.writeText(this.currentElementInfo.selector).then(() => {
          alert('CSS selector copied to clipboard: ' + this.currentElementInfo.selector);
        }).catch((err) => {
          console.error('Failed to copy selector:', err);
          alert('Failed to copy selector to clipboard');
        });
      }
    },
    
    resetSelection: function() {
      if (this.selectedElement) {
        this.removeHighlight(this.selectedElement, 'selected');
      }
      this.selectedElement = null;
      this.currentElementInfo = null;
      
      document.getElementById('simpleab-element-info').style.display = 'none';
      document.getElementById('simpleab-instructions').style.display = 'block';
    },
    
    close: function() {
      this.removeAllHighlights();
      document.removeEventListener('mouseover', this.handleMouseOver.bind(this), true);
      document.removeEventListener('mouseout', this.handleMouseOut.bind(this), true);
      document.removeEventListener('click', this.handleClick.bind(this), true);
      document.removeEventListener('keydown', this.handleKeyDown.bind(this), true);
      
      if (this.overlay) {
        this.overlay.remove();
      }
      
      const styles = document.getElementById('simpleab-styles');
      if (styles) {
        styles.remove();
      }
      
      delete window.simpleABSelector;
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.simpleABSelector.init();
    });
  } else {
    window.simpleABSelector.init();
  }
})();
