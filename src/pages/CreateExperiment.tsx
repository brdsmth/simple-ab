import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken } from '../services/authService'
import './CreateExperiment.css'

interface Project {
  id: string
  name: string
  description?: string
  domain: string
}

interface CreateExperimentFormData {
  name: string
  description: string
  hypothesis: string
  projectId: string
  trafficAllocation: number
  confidenceLevel: number
  minimumSampleSize: number
  targetingRules: string
}

const CreateExperiment: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState<CreateExperimentFormData>({
    name: '',
    description: '',
    hypothesis: '',
    projectId: '',
    trafficAllocation: 1.0,
    confidenceLevel: 0.95,
    minimumSampleSize: 1000,
    targetingRules: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const projectsData = await response.json()
        setProjects(projectsData)
      } else {
        setError('Failed to load projects')
      }
    } catch (err) {
      setError('Failed to load projects')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = getToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/experiments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const experiment = await response.json()
        navigate(`/experiments/${experiment.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create experiment')
      }
    } catch (err) {
      setError('Failed to create experiment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-experiment">
      <div className="create-experiment-header">
        <button 
          onClick={() => navigate('/experiments')}
          className="btn btn-secondary"
        >
          ← Back to Experiments
        </button>
        <div>
          <h1>Create New Experiment</h1>
          <p>Set up a new A/B test to optimize your website performance.</p>
        </div>
      </div>

      <div className="create-experiment-content">
        <form onSubmit={handleSubmit} className="experiment-form">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Experiment Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                required
                disabled={loading}
                placeholder="e.g., Homepage Button Color Test"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
                rows={3}
                disabled={loading}
                placeholder="Brief description of what you're testing"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hypothesis" className="form-label">
                Hypothesis
              </label>
              <textarea
                id="hypothesis"
                name="hypothesis"
                value={formData.hypothesis}
                onChange={handleInputChange}
                className="form-textarea"
                rows={3}
                disabled={loading}
                placeholder="e.g., Changing the button color to blue will increase conversions by 15%"
              />
            </div>

            <div className="form-group">
              <label htmlFor="projectId" className="form-label">
                Project *
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                className="form-select"
                required
                disabled={loading}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2>Configuration</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="trafficAllocation" className="form-label">
                  Traffic Allocation
                </label>
                <input
                  id="trafficAllocation"
                  name="trafficAllocation"
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={formData.trafficAllocation}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={loading}
                />
                <small className="form-help">
                  Percentage of traffic to include in the experiment (0.1 = 10%, 1.0 = 100%)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confidenceLevel" className="form-label">
                  Confidence Level
                </label>
                <select
                  id="confidenceLevel"
                  name="confidenceLevel"
                  value={formData.confidenceLevel}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={loading}
                >
                  <option value={0.90}>90%</option>
                  <option value={0.95}>95%</option>
                  <option value={0.99}>99%</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="minimumSampleSize" className="form-label">
                Minimum Sample Size
              </label>
              <input
                id="minimumSampleSize"
                name="minimumSampleSize"
                type="number"
                min="100"
                value={formData.minimumSampleSize}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              />
              <small className="form-help">
                Minimum number of visitors needed before results are considered reliable
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="targetingRules" className="form-label">
                Targeting Rules (JSON)
              </label>
              <textarea
                id="targetingRules"
                name="targetingRules"
                value={formData.targetingRules}
                onChange={handleInputChange}
                className="form-textarea"
                rows={4}
                disabled={loading}
                placeholder='{"country": "US", "device": "desktop"}'
              />
              <small className="form-help">
                Optional JSON configuration for targeting specific user segments
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/experiments')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Experiment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateExperiment
