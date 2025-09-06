import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard'
import { getToken } from '../services/authService'
import ModificationForm from '../components/ModificationForm/ModificationForm'
import './ExperimentDetail.css'

interface Variant {
  id: string
  name: string
  description?: string
  isControl: boolean
  allocation: number
  modifications?: string
}

interface Goal {
  id: string
  name: string
  description?: string
  type: string
  isPrimary: boolean
}

interface Project {
  id: string
  name: string
  domain?: string
}

interface Experiment {
  id: string
  name: string
  description?: string
  hypothesis?: string
  status: string
  trafficAllocation: number
  confidenceLevel: number
  minimumSampleSize: number
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  project: Project
  variants: Variant[]
  goals: Goal[]
  _count: {
    events: number
    variants: number
    goals: number
  }
}

const ExperimentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingAllocations, setEditingAllocations] = useState(false)
  const [tempAllocations, setTempAllocations] = useState<{[key: string]: number}>({})
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [variantForm, setVariantForm] = useState({
    name: '',
    description: '',
    isControl: false,
    allocation: 25,
    modifications: JSON.stringify({
      selector: '#cta-button',
      style: {
        'background-color': '#3b82f6'
      },
      text: 'Get Started Now'
    }, null, 2)
  })
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deletingExperiment, setDeletingExperiment] = useState(false)
  const [deletingVariant, setDeletingVariant] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [editVariantForm, setEditVariantForm] = useState({
    name: '',
    description: '',
    isControl: false,
    allocation: 0,
    modifications: ''
  })
  const [variantFormError, setVariantFormError] = useState('')
  const [editVariantFormError, setEditVariantFormError] = useState('')

  // Element selector functionality
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_SELECTED') {
        const { selector, tagName, textContent } = event.data.data
        
        // Create a basic modification template based on the selected element
        const modification = {
          selector: selector,
          changes: {
            style: {
              // Add some default style changes based on element type
              ...(tagName === 'button' || tagName === 'a' ? {
                'background-color': '#3b82f6',
                'color': '#ffffff'
              } : {}),
              ...(tagName === 'h1' || tagName === 'h2' || tagName === 'h3' ? {
                'color': '#1f2937'
              } : {})
            },
            ...(textContent ? { text: textContent } : {}),
            attributes: {
              'data-variant': 'modified'
            }
          }
        }
        
        // Update the appropriate form based on which modal is open
        if (showAddVariant) {
          setVariantForm(prev => ({
            ...prev,
            modifications: JSON.stringify(modification, null, 2)
          }))
        } else if (editingVariant) {
          setEditVariantForm(prev => ({
            ...prev,
            modifications: JSON.stringify(modification, null, 2)
          }))
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [showAddVariant, editingVariant])

  const openElementSelector = (websiteUrl?: string) => {
    const selectorUrl = new URL('/element-selector', window.location.origin)
    if (websiteUrl) {
      selectorUrl.searchParams.set('url', websiteUrl)
      selectorUrl.searchParams.set('autoLoad', 'true')
    }
    
    // Open in a new tab (not popup window)
    window.open(selectorUrl.toString(), '_blank')
  }

  useEffect(() => {
    if (id) {
      fetchExperiment(id)
    }
  }, [id])

  const fetchExperiment = async (experimentId: string) => {
    try {
      const token = getToken()
      if (!token) {
        setError('Authentication required')
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:3001/api/experiments/${experimentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setExperiment(data)
      } else {
        setError('Failed to load experiment')
      }
    } catch (err) {
      console.error('Error fetching experiment:', err)
      setError('Failed to load experiment')
    } finally {
      setLoading(false)
    }
  }

  const startEditingAllocations = () => {
    if (!experiment) return
    const allocations: {[key: string]: number} = {}
    experiment.variants.forEach((variant: any) => {
      allocations[variant.id] = Math.round(variant.allocation * 100)
    })
    setTempAllocations(allocations)
    setEditingAllocations(true)
  }

  const cancelEditingAllocations = () => {
    setEditingAllocations(false)
    setTempAllocations({})
  }

  const saveAllocations = async () => {
    if (!experiment || !id) return
    
    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token')

      // Convert percentages back to decimals
      const total = Object.values(tempAllocations).reduce((sum, val) => sum + val, 0)
      
      // Final normalization to ensure exact 100% (handle floating point precision)
      const normalizedAllocations = { ...tempAllocations }
      if (total !== 100) {
        const factor = 100 / total
        Object.keys(normalizedAllocations).forEach(id => {
          normalizedAllocations[id] = normalizedAllocations[id] * factor
        })
      }

      // Update each variant
      for (const [variantId, allocation] of Object.entries(normalizedAllocations)) {
        const response = await fetch(`http://localhost:3001/api/experiments/variants/${variantId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            allocation: allocation / 100 // Convert back to decimal
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to update variant ${variantId}`)
        }
      }

      // Refresh experiment data
      await fetchExperiment(id)
      setEditingAllocations(false)
      setTempAllocations({})
      
    } catch (err: any) {
      setError(err.message || 'Failed to update allocations')
    }
  }

  const updateExperimentStatus = async (newStatus: string) => {
    if (!experiment || !id) return
    
    setUpdatingStatus(true)
    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token')

      const response = await fetch(`http://localhost:3001/api/experiments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (response.ok) {
        // Refresh experiment data
        await fetchExperiment(id)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update experiment status')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update experiment status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const deleteExperiment = async () => {
    if (!experiment || !id) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete the experiment "${experiment.name}"? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    setDeletingExperiment(true)
    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token')

      const response = await fetch(`http://localhost:3001/api/experiments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Navigate back to experiments list
        window.location.href = '/experiments'
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to delete experiment')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete experiment')
    } finally {
      setDeletingExperiment(false)
    }
  }

  const deleteVariant = async (variantId: string, variantName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the variant "${variantName}"? Remaining variants will be rebalanced automatically.`
    )
    
    if (!confirmed) return
    
    setDeletingVariant(variantId)
    try {
      const token = getToken()
      if (!token) throw new Error('No authentication token')

      const response = await fetch(`http://localhost:3001/api/experiments/variants/${variantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Refresh experiment data
        await fetchExperiment(id!)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to delete variant')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete variant')
    } finally {
      setDeletingVariant(null)
    }
  }

  const startEditingVariant = (variant: Variant) => {
    setEditingVariant(variant.id)
    setEditVariantFormError('') // Clear any previous errors
    setEditVariantForm({
      name: variant.name,
      description: variant.description || '',
      isControl: variant.isControl,
      allocation: Math.round(variant.allocation * 100), // Convert decimal to percentage
      modifications: variant.modifications || JSON.stringify({
        selector: '#cta-button',
        style: {
          'background-color': '#3b82f6'
        },
        text: 'Get Started Now'
      }, null, 2)
    })
  }

  const cancelEditingVariant = () => {
    setEditingVariant(null)
    setEditVariantFormError('') // Clear any errors
    setEditVariantForm({
      name: '',
      description: '',
      isControl: false,
      allocation: 0,
      modifications: ''
    })
  }

  const saveVariantEdit = async () => {
    if (!editingVariant || !experiment || !id) return
    
    try {
      // Clear any previous form errors
      setEditVariantFormError('')
      
      console.log('Saving variant edit:', {
        variantId: editingVariant,
        formData: editVariantForm
      })
      
      // Validate JSON before saving
      if (editVariantForm.modifications.trim()) {
        try {
          JSON.parse(editVariantForm.modifications)
        } catch (jsonError: any) {
          setEditVariantFormError(`Invalid JSON in modifications: ${jsonError.message}`)
          return
        }
      }

      const token = getToken()
      if (!token) throw new Error('No authentication token')

      // Handle allocation rebalancing if allocation changed
      const currentVariant = experiment.variants.find(v => v.id === editingVariant)
      const newAllocation = editVariantForm.allocation / 100 // Convert to decimal
      
      if (currentVariant && currentVariant.allocation !== newAllocation) {
        // Rebalance other variants
        const otherVariants = experiment.variants.filter(v => v.id !== editingVariant)
        const totalOtherAllocation = otherVariants.reduce((sum, v) => sum + v.allocation, 0)
        const remainingAllocation = 1.0 - newAllocation
        
        if (remainingAllocation > 0 && totalOtherAllocation > 0) {
          const rebalanceFactor = remainingAllocation / totalOtherAllocation
          
          // Update other variants first
          for (const variant of otherVariants) {
            const newOtherAllocation = variant.allocation * rebalanceFactor
            await fetch(`http://localhost:3001/api/experiments/variants/${variant.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                allocation: newOtherAllocation
              })
            })
          }
        }
      }

      const requestBody = {
        name: editVariantForm.name,
        description: editVariantForm.description,
        isControl: editVariantForm.isControl,
        allocation: newAllocation,
        modifications: editVariantForm.modifications
      }
      
      console.log('Sending PUT request:', {
        url: `http://localhost:3001/api/experiments/variants/${editingVariant}`,
        body: requestBody
      })

      const response = await fetch(`http://localhost:3001/api/experiments/variants/${editingVariant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('PUT response status:', response.status)

      if (response.ok) {
        const responseData = await response.json()
        console.log('Variant updated successfully:', responseData)
        // Refresh experiment data
        console.log('Refreshing experiment data...')
        await fetchExperiment(id)
        console.log('Experiment data refreshed, closing modal')
        cancelEditingVariant()
      } else {
        const errorData = await response.json()
        console.error('Failed to update variant:', errorData)
        setEditVariantFormError(errorData.message || 'Failed to update variant')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update variant')
    }
  }

  const createVariant = async () => {
    if (!experiment || !id) return
    
    try {
      // Clear any previous form errors
      setVariantFormError('')
      
      // Validate JSON before saving
      if (variantForm.modifications.trim()) {
        try {
          JSON.parse(variantForm.modifications)
        } catch (jsonError: any) {
          setVariantFormError(`Invalid JSON in modifications: ${jsonError.message}`)
          return
        }
      }

      const token = getToken()
      if (!token) throw new Error('No authentication token')

      // Calculate rebalanced allocations
      const currentVariants = experiment.variants
      const newVariantAllocation = variantForm.allocation / 100 // Convert to decimal
      const totalVariants = currentVariants.length + 1
      
      // If this is the first variant, give it 100%
      let finalAllocation = newVariantAllocation
      if (currentVariants.length === 0) {
        finalAllocation = 1.0
      } else {
        // Rebalance existing variants to make room for new one
        const remainingAllocation = 1.0 - newVariantAllocation
        const rebalanceFactor = remainingAllocation / currentVariants.reduce((sum, v) => sum + v.allocation, 0)
        
        // Update existing variants first
        for (const variant of currentVariants) {
          const newAllocation = variant.allocation * rebalanceFactor
          await fetch(`http://localhost:3001/api/experiments/variants/${variant.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              allocation: newAllocation
            })
          })
        }
      }

      // Create the new variant
      const response = await fetch(`http://localhost:3001/api/experiments/${id}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...variantForm,
          allocation: finalAllocation
        })
      })

      if (response.ok) {
        // Refresh experiment data
        await fetchExperiment(id)
        setShowAddVariant(false)
        setVariantForm({
          name: '',
          description: '',
          isControl: false,
          allocation: Math.round(100 / (totalVariants + 1)), // Default to equal distribution
          modifications: JSON.stringify({
            selector: '#cta-button',
            style: {
              'background-color': '#3b82f6'
            },
            text: 'Get Started Now'
          }, null, 2)
        })
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create variant')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create variant')
    }
  }

  const updateTempAllocation = (variantId: string, value: number) => {
    const newValue = Math.max(0, Math.min(100, value))
    
    setTempAllocations(prev => {
      const updated = { ...prev, [variantId]: newValue }
      
      // Auto-rebalance to ensure total is 100%
      const total = Object.values(updated).reduce((sum, val) => sum + val, 0)
      
      if (total !== 100 && Object.keys(updated).length > 1) {
        // Calculate how much we need to adjust other variants
        const difference = 100 - total
        const otherVariants = Object.keys(updated).filter(id => id !== variantId)
        
        if (otherVariants.length > 0) {
          // Distribute the difference proportionally among other variants
          const otherTotal = otherVariants.reduce((sum, id) => sum + updated[id], 0)
          
          if (otherTotal > 0) {
            otherVariants.forEach(id => {
              const proportion = updated[id] / otherTotal
              const adjustment = difference * proportion
              updated[id] = Math.max(0, Math.min(100, updated[id] + adjustment))
            })
          } else {
            // If other variants are 0, distribute equally
            const equalShare = difference / otherVariants.length
            otherVariants.forEach(id => {
              updated[id] = Math.max(0, Math.min(100, equalShare))
            })
          }
        }
      }
      
      return updated
    })
  }


  const getStatusBadge = (status: string) => {
    const statusClasses = {
      RUNNING: 'badge-primary',
      COMPLETED: 'badge-success',
      PAUSED: 'badge-warning',
      DRAFT: 'badge-secondary',
      ARCHIVED: 'badge-secondary'
    }
    return `badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'}`
  }

  if (loading) {
    return (
      <div className="experiment-detail">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading experiment...</p>
        </div>
      </div>
    )
  }

  if (error || !experiment) {
    return (
      <div className="experiment-detail">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error || 'Experiment not found'}</p>
          <Link to="/experiments" className="btn btn-primary">
            Back to Experiments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="experiment-detail">
      <div className="experiment-header">
        <div className="header-navigation">
          <Link to="/experiments" className="back-link">
            ← Back to Experiments
          </Link>
        </div>
        
        <div className="header-content">
          <div className="header-info">
            <h1>{experiment.name}</h1>
            <p className="experiment-project">{experiment.project.name}</p>
            {experiment.description && (
              <p className="experiment-description">{experiment.description}</p>
            )}
            <span className={getStatusBadge(experiment.status)}>
              {experiment.status.toLowerCase()}
            </span>
          </div>
          
          <div className="header-actions">
            {experiment.status === 'DRAFT' && (
              <button 
                className="btn btn-primary" 
                onClick={() => updateExperimentStatus('RUNNING')}
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Starting...' : 'Start Experiment'}
              </button>
            )}
            {experiment.status === 'RUNNING' && (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => updateExperimentStatus('PAUSED')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Pausing...' : 'Pause'}
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => updateExperimentStatus('COMPLETED')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Stopping...' : 'Stop'}
                </button>
              </>
            )}
            {experiment.status === 'PAUSED' && (
              <button 
                className="btn btn-primary" 
                onClick={() => updateExperimentStatus('RUNNING')}
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Resuming...' : 'Resume'}
              </button>
            )}
            <button className="btn btn-outline" title="Edit Experiment">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              className="btn btn-danger"
              onClick={deleteExperiment}
              disabled={deletingExperiment}
              title="Delete Experiment"
            >
              {deletingExperiment ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="experiment-content">
        <div className="main-content">
          <div className="content-section">
            <h2>Overview</h2>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="overview-label">Total Events</span>
                <p>{experiment._count.events.toLocaleString()}</p>
              </div>
              <div className="overview-item">
                <span className="overview-label">Variants</span>
                <p>{experiment.variants.length}</p>
              </div>
              <div className="overview-item">
                <span className="overview-label">Goals</span>
                <p>{experiment.goals.length}</p>
              </div>
              <div className="overview-item">
                <span className="overview-label">Created</span>
                <p>{new Date(experiment.createdAt).toLocaleDateString()}</p>
              </div>
              {experiment.startDate && (
                <div className="overview-item">
                  <span className="overview-label">Start Date</span>
                  <p>{new Date(experiment.startDate).toLocaleDateString()}</p>
                </div>
              )}
              <div className="overview-item">
                <span className="overview-label">Traffic Allocation</span>
                <p>{Math.round(experiment.trafficAllocation * 100)}%</p>
              </div>
            </div>
          </div>

          {/* Variants Breakdown */}
          <div className="content-section">
            <div className="section-header">
              <h2>Variant Breakdown</h2>
              <div className="header-controls">
                <button className="btn btn-outline" onClick={() => {
                  // Calculate suggested allocation for equal distribution
                  const currentVariantCount = experiment.variants.length
                  const suggestedAllocation = Math.round(100 / (currentVariantCount + 1))
                  
                  setVariantForm({
                    name: '',
                    description: '',
                    isControl: false,
                    allocation: suggestedAllocation,
                    modifications: JSON.stringify({
                      selector: '#cta-button',
                      changes: {
                        style: {
                          'background-color': '#3b82f6'
                        }
                      }
                    }, null, 2)
                  })
                  setShowAddVariant(true)
                }}>
                  Add Variant
                </button>
                {!editingAllocations ? (
                  <button className="btn btn-secondary" onClick={startEditingAllocations}>
                    Edit Allocations
                  </button>
                ) : (
                  <div className="allocation-controls">
                    <button className="btn btn-primary" onClick={saveAllocations}>
                      Save Changes
                    </button>
                    <button className="btn btn-secondary" onClick={cancelEditingAllocations}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="variants-grid">
              {experiment.variants.map((variant) => (
                <div key={variant.id} className={`variant-card ${variant.isControl ? 'variant-control' : ''}`}>
                  <div className="variant-header">
                    <div className="variant-title">
                      <h3 className="variant-name">{variant.name}</h3>
                      {variant.isControl && <span className="control-badge">Control</span>}
                    </div>
                    <div className="variant-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => startEditingVariant(variant)}
                        title="Edit variant"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {experiment.variants.length > 1 && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteVariant(variant.id, variant.name)}
                          disabled={deletingVariant === variant.id}
                          title="Delete variant"
                        >
                          {deletingVariant === variant.id ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 6v6l4 2"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="variant-allocation">
                    <div className="allocation-bar">
                      <div 
                        className="allocation-fill" 
                        style={{ width: `${editingAllocations ? tempAllocations[variant.id] || 0 : variant.allocation * 100}%` }}
                      ></div>
                    </div>
                    {editingAllocations ? (
                      <div className="allocation-editor">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tempAllocations[variant.id] || 0}
                          onChange={(e) => updateTempAllocation(variant.id, parseInt(e.target.value) || 0)}
                          className="allocation-input"
                        />
                        <span>% Traffic</span>
                      </div>
                    ) : (
                      <span className="allocation-text">{Math.round(variant.allocation * 100)}% Traffic</span>
                    )}
                  </div>
                  
                  {variant.description && (
                    <p className="variant-description">{variant.description}</p>
                  )}
                  
                  {variant.modifications && (
                    <div className="variant-modifications">
                      <h4>Modifications:</h4>
                      <pre className="modifications-code">{variant.modifications}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Experiment Settings</h3>
            <div className="setting-item">
              <span className="setting-label">Confidence Level</span>
              <span className="setting-value">{Math.round(experiment.confidenceLevel * 100)}%</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Min Sample Size</span>
              <span className="setting-value">{experiment.minimumSampleSize.toLocaleString()}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Status</span>
              <span className={getStatusBadge(experiment.status)}>
                {experiment.status.toLowerCase()}
              </span>
            </div>
            {experiment.hypothesis && (
              <div className="setting-item">
                <span className="setting-label">Hypothesis</span>
                <p className="hypothesis-text">{experiment.hypothesis}</p>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Goals</h3>
            {experiment.goals.length > 0 ? (
              experiment.goals.map((goal) => (
                <div key={goal.id} className="goal-item">
                  <div>
                    <span className="goal-name">{goal.name}</span>
                    <br />
                    <span className="goal-type">{goal.type}</span>
                  </div>
                  {goal.isPrimary && <span className="primary-badge">Primary</span>}
                </div>
              ))
            ) : (
              <p className="no-goals">No goals defined</p>
            )}
          </div>
        </div>
      </div>
      {/* Add Variant Modal */}
      {showAddVariant && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Variant</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddVariant(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createVariant(); }} className="modal-body">
              <div className="form-group">
                <label htmlFor="variant-name" className="form-label">
                  Variant Name
                </label>
                <input
                  id="variant-name"
                  type="text"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({...variantForm, name: e.target.value})}
                  className="form-input"
                  placeholder="e.g., Green Button"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="variant-description" className="form-label">
                  Description (Optional)
                </label>
                <input
                  id="variant-description"
                  type="text"
                  value={variantForm.description}
                  onChange={(e) => setVariantForm({...variantForm, description: e.target.value})}
                  className="form-input"
                  placeholder="Brief description of this variant"
                />
              </div>

                                <div className="form-group">
                    <label htmlFor="variant-allocation" className="form-label">
                      Traffic Allocation (%)
                    </label>
                    <input
                      id="variant-allocation"
                      type="number"
                      min="0"
                      max="100"
                      value={variantForm.allocation}
                      onChange={(e) => setVariantForm({...variantForm, allocation: parseInt(e.target.value) || 0})}
                      className="form-input"
                    />
                    <p className="form-help">
                      Existing variants will be automatically rebalanced to ensure total equals 100%
                    </p>
                  </div>

              <div className="form-group">
                <label className="form-label">Modifications</label>
                <ModificationForm
                  value={variantForm.modifications}
                  onChange={(value) => setVariantForm({...variantForm, modifications: value})}
                  onSelectElement={() => openElementSelector(experiment?.project?.domain)}
                />
                {variantFormError && (
                  <div className="form-error">
                    {variantFormError}
                  </div>
                )}
                <p className="form-help">
                  <strong>Flexible A/B Testing Structure:</strong><br/>
                  • <code>selector</code>: CSS selector (e.g., '#button', '.hero-text', 'h1')<br/>
                  • <code>changes.style</code>: CSS properties to modify<br/>
                  • <code>changes.text</code>: Change element text content<br/>
                  • <code>changes.attributes</code>: Set HTML attributes<br/>
                  • <code>changes.visibility</code>: 'show' or 'hide' element
                </p>
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={variantForm.isControl}
                    onChange={(e) => setVariantForm({...variantForm, isControl: e.target.checked})}
                  />
                  Control Variant
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddVariant(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {editingVariant && (
        <div className="modal-overlay">
          <div className="modal">
            <form onSubmit={(e) => { e.preventDefault(); saveVariantEdit(); }}>
              <div className="modal-header">
                <h2>Edit Variant</h2>
                <button
                  type="button"
                  onClick={cancelEditingVariant}
                  className="modal-close"
                >
                  ×
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="editVariantName" className="form-label">
                  Variant Name
                </label>
                <input
                  id="editVariantName"
                  type="text"
                  value={editVariantForm.name}
                  onChange={(e) => setEditVariantForm({...editVariantForm, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editVariantDescription" className="form-label">
                  Description (Optional)
                </label>
                <textarea
                  id="editVariantDescription"
                  value={editVariantForm.description}
                  onChange={(e) => setEditVariantForm({...editVariantForm, description: e.target.value})}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="editVariantAllocation" className="form-label">
                  Traffic Allocation (%)
                </label>
                <input
                  id="editVariantAllocation"
                  type="number"
                  min="0"
                  max="100"
                  value={editVariantForm.allocation}
                  onChange={(e) => setEditVariantForm({...editVariantForm, allocation: parseInt(e.target.value) || 0})}
                  className="form-input"
                  required
                />
                <p className="form-help">
                  Percentage of traffic that should see this variant. Other variants will be rebalanced automatically.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Modifications</label>
                <ModificationForm
                  value={editVariantForm.modifications}
                  onChange={(value) => setEditVariantForm({...editVariantForm, modifications: value})}
                  onSelectElement={() => openElementSelector(experiment?.project?.domain)}
                />
                {editVariantFormError && (
                  <div className="form-error">
                    {editVariantFormError}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={editVariantForm.isControl}
                    onChange={(e) => setEditVariantForm({...editVariantForm, isControl: e.target.checked})}
                  />
                  Control Variant
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={cancelEditingVariant}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      <AnalyticsDashboard experimentId={experiment.id} />
    </div>
  )
}

export default ExperimentDetail