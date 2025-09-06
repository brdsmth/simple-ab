import React, { useState, useEffect } from 'react'
import './ModificationForm.css'

interface StyleModification {
  property: string
  value: string
}

interface AttributeModification {
  name: string
  value: string
}

interface ModificationData {
  selector: string
  modificationType: 'style' | 'text' | 'attributes' | 'mixed'
  styles: StyleModification[]
  textContent?: string
  attributes: AttributeModification[]
}

interface ModificationFormProps {
  value: string // JSON string
  onChange: (value: string) => void
  onSelectElement?: () => void
}

const ModificationForm: React.FC<ModificationFormProps> = ({
  value,
  onChange,
  onSelectElement
}) => {
  const [formData, setFormData] = useState<ModificationData>({
    selector: '',
    modificationType: 'style',
    styles: [{ property: 'background-color', value: '#3b82f6' }],
    textContent: '',
    attributes: []
  })

  // Parse JSON value into form data
  useEffect(() => {
    if (value.trim()) {
      try {
        const parsed = JSON.parse(value)
        
        // Convert from various JSON formats to our form format
        const newFormData: ModificationData = {
          selector: parsed.selector || '',
          modificationType: 'mixed',
          styles: [],
          textContent: parsed.text || parsed.textContent || '',
          attributes: []
        }

        // Handle style modifications
        if (parsed.style || parsed.changes?.style) {
          const styleObj = parsed.style || parsed.changes?.style || {}
          newFormData.styles = Object.entries(styleObj).map(([property, value]) => ({
            property,
            value: String(value)
          }))
          if (newFormData.styles.length > 0 && !newFormData.textContent && newFormData.attributes.length === 0) {
            newFormData.modificationType = 'style'
          }
        }

        // Handle text modifications
        if (newFormData.textContent && newFormData.styles.length === 0 && newFormData.attributes.length === 0) {
          newFormData.modificationType = 'text'
        }

        // Handle attribute modifications
        if (parsed.attributes || parsed.changes?.attributes) {
          const attrObj = parsed.attributes || parsed.changes?.attributes || {}
          newFormData.attributes = Object.entries(attrObj).map(([name, value]) => ({
            name,
            value: String(value)
          }))
          if (newFormData.attributes.length > 0 && !newFormData.textContent && newFormData.styles.length === 0) {
            newFormData.modificationType = 'attributes'
          }
        }

        setFormData(newFormData)
      } catch (error) {
        // If JSON is invalid, keep current form data
        console.warn('Invalid JSON in modification form:', error)
      }
    }
  }, [value])

  // Convert form data to JSON and call onChange
  const updateJSON = (newFormData: ModificationData) => {
    const jsonOutput: any = {
      selector: newFormData.selector
    }

    // Add changes based on modification type
    if (newFormData.modificationType === 'style' || newFormData.modificationType === 'mixed') {
      if (newFormData.styles.length > 0) {
        const styleObj: Record<string, string> = {}
        newFormData.styles.forEach(style => {
          if (style.property && style.value) {
            styleObj[style.property] = style.value
          }
        })
        if (Object.keys(styleObj).length > 0) {
          if (!jsonOutput.changes) jsonOutput.changes = {}
          jsonOutput.changes.style = styleObj
        }
      }
    }

    if (newFormData.modificationType === 'text' || newFormData.modificationType === 'mixed') {
      if (newFormData.textContent) {
        jsonOutput.text = newFormData.textContent
      }
    }

    if (newFormData.modificationType === 'attributes' || newFormData.modificationType === 'mixed') {
      if (newFormData.attributes.length > 0) {
        const attrObj: Record<string, string> = {}
        newFormData.attributes.forEach(attr => {
          if (attr.name && attr.value) {
            attrObj[attr.name] = attr.value
          }
        })
        if (Object.keys(attrObj).length > 0) {
          if (!jsonOutput.changes) jsonOutput.changes = {}
          jsonOutput.changes.attributes = attrObj
        }
      }
    }

    onChange(JSON.stringify(jsonOutput, null, 2))
  }

  const handleFormChange = (updates: Partial<ModificationData>) => {
    const newFormData = { ...formData, ...updates }
    setFormData(newFormData)
    updateJSON(newFormData)
  }

  const addStyleProperty = () => {
    const newStyles = [...formData.styles, { property: '', value: '' }]
    handleFormChange({ styles: newStyles })
  }

  const updateStyleProperty = (index: number, field: 'property' | 'value', value: string) => {
    const newStyles = [...formData.styles]
    newStyles[index][field] = value
    handleFormChange({ styles: newStyles })
  }

  const removeStyleProperty = (index: number) => {
    const newStyles = formData.styles.filter((_, i) => i !== index)
    handleFormChange({ styles: newStyles })
  }

  const addAttribute = () => {
    const newAttributes = [...formData.attributes, { name: '', value: '' }]
    handleFormChange({ attributes: newAttributes })
  }

  const updateAttribute = (index: number, field: 'name' | 'value', value: string) => {
    const newAttributes = [...formData.attributes]
    newAttributes[index][field] = value
    handleFormChange({ attributes: newAttributes })
  }

  const removeAttribute = (index: number) => {
    const newAttributes = formData.attributes.filter((_, i) => i !== index)
    handleFormChange({ attributes: newAttributes })
  }

  const copySelector = async () => {
    if (formData.selector) {
      try {
        await navigator.clipboard.writeText(formData.selector)
        // You could add a toast notification here if desired
        alert('CSS selector copied to clipboard!')
      } catch (err) {
        console.error('Failed to copy selector:', err)
        alert('Failed to copy selector to clipboard')
      }
    }
  }

  return (
    <div className="modification-form">
      {/* CSS Selector */}
      <div className="form-group">
        <div className="form-label-with-button">
          <label className="form-label">CSS Selector</label>
          <div className="button-group">
            {onSelectElement && (
              <button
                type="button"
                onClick={onSelectElement}
                className="btn btn-outline btn-sm"
                title="Visually select an element from your website"
              >
                🎯 Select Element
              </button>
            )}
            {formData.selector && (
              <button
                type="button"
                onClick={copySelector}
                className="btn btn-outline btn-sm"
                title="Copy CSS selector to clipboard"
              >
                📋 Copy Selector
              </button>
            )}
          </div>
        </div>
        <input
          type="text"
          value={formData.selector}
          onChange={(e) => handleFormChange({ selector: e.target.value })}
          className="form-input"
          placeholder="#button-id, .button-class, button"
        />
      </div>

      {/* Modification Type */}
      <div className="form-group">
        <label className="form-label">Modification Type</label>
        <select
          value={formData.modificationType}
          onChange={(e) => handleFormChange({ modificationType: e.target.value as any })}
          className="form-input"
        >
          <option value="style">Style Changes</option>
          <option value="text">Text Content</option>
          <option value="attributes">Attributes</option>
          <option value="mixed">Mixed (Style + Text + Attributes)</option>
        </select>
      </div>

      {/* Style Properties */}
      {(formData.modificationType === 'style' || formData.modificationType === 'mixed') && (
        <div className="form-group">
          <div className="form-label-with-button">
            <label className="form-label">Style Properties</label>
            <button
              type="button"
              onClick={addStyleProperty}
              className="btn btn-outline btn-sm"
            >
              + Add Style
            </button>
          </div>
          <div className="style-properties">
            {formData.styles.map((style, index) => (
              <div key={index} className="style-property-row">
                <select
                  value={style.property}
                  onChange={(e) => updateStyleProperty(index, 'property', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select Property</option>
                  <option value="background-color">Background Color</option>
                  <option value="color">Text Color</option>
                  <option value="font-size">Font Size</option>
                  <option value="font-weight">Font Weight</option>
                  <option value="padding">Padding</option>
                  <option value="margin">Margin</option>
                  <option value="border">Border</option>
                  <option value="border-radius">Border Radius</option>
                  <option value="width">Width</option>
                  <option value="height">Height</option>
                  <option value="display">Display</option>
                  <option value="visibility">Visibility</option>
                </select>
                <input
                  type="text"
                  value={style.value}
                  onChange={(e) => updateStyleProperty(index, 'value', e.target.value)}
                  className="form-input"
                  placeholder="Value (e.g., #ff0000, 16px, bold)"
                />
                <button
                  type="button"
                  onClick={() => removeStyleProperty(index)}
                  className="btn btn-danger btn-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text Content */}
      {(formData.modificationType === 'text' || formData.modificationType === 'mixed') && (
        <div className="form-group">
          <label className="form-label">Text Content</label>
          <textarea
            value={formData.textContent}
            onChange={(e) => handleFormChange({ textContent: e.target.value })}
            className="form-input"
            rows={3}
            placeholder="New text content for the element"
          />
        </div>
      )}

      {/* Attributes */}
      {(formData.modificationType === 'attributes' || formData.modificationType === 'mixed') && (
        <div className="form-group">
          <div className="form-label-with-button">
            <label className="form-label">Attributes</label>
            <button
              type="button"
              onClick={addAttribute}
              className="btn btn-outline btn-sm"
            >
              + Add Attribute
            </button>
          </div>
          <div className="attributes">
            {formData.attributes.map((attr, index) => (
              <div key={index} className="attribute-row">
                <input
                  type="text"
                  value={attr.name}
                  onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                  className="form-input"
                  placeholder="Attribute name (e.g., data-variant, class)"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  className="form-input"
                  placeholder="Attribute value"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  className="btn btn-danger btn-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JSON Preview */}
      <div className="form-group">
        <label className="form-label">Generated JSON (Preview)</label>
        <textarea
          value={value}
          readOnly
          className="form-input json-preview"
          rows={6}
        />
      </div>
    </div>
  )
}

export default ModificationForm
