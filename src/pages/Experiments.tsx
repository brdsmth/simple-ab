import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getToken } from '../services/authService'
import './Experiments.css'

interface Experiment {
  id: string
  name: string
  description?: string
  status: string
  trafficAllocation: number
  startDate?: string
  endDate?: string
  createdAt: string
  project: {
    id: string
    name: string
  }
  variants: Array<{
    id: string
    name: string
    isControl: boolean
    allocation: number
  }>
  goals: Array<{
    id: string
    name: string
    type: string
    isPrimary: boolean
  }>
  _count: {
    events: number
  }
}

interface Project {
  id: string
  name: string
}

const Experiments: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    search: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = getToken()
      
      // Fetch both experiments and projects
      const [experimentsResponse, projectsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/experiments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ])

      if (experimentsResponse.ok) {
        const experimentsData = await experimentsResponse.json()
        setExperiments(experimentsData)
      } else {
        setError('Failed to load experiments')
      }

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setProjects(projectsData)
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
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

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
  }

  const filteredExperiments = experiments.filter(experiment => {
    if (filters.projectId && experiment.project.id !== filters.projectId) return false
    if (filters.status && experiment.status !== filters.status) return false
    if (filters.search && !experiment.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="experiments">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading experiments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="experiments">
      <div className="experiments-header">
        <div>
          <h1>Experiments</h1>
          <p>Manage and monitor your A/B tests and experiments.</p>
        </div>
        <Link to="/experiments/new" className="btn btn-primary">
          Create Experiment
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="experiments-filters">
        <div className="filter-group">
          <select 
            className="form-select"
            value={filters.projectId}
            onChange={(e) => handleFilterChange('projectId', e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            className="form-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="RUNNING">Running</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        
        <div className="filter-group">
          <input
            type="search"
            placeholder="Search experiments..."
            className="form-input"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      <div className="experiments-table">
        {filteredExperiments.length === 0 ? (
          <div className="empty-state">
            <h3>No experiments found</h3>
            <p>
              {experiments.length === 0 
                ? 'Create your first experiment to start A/B testing.'
                : 'No experiments match your current filters.'
              }
            </p>
            {experiments.length === 0 && (
              <Link to="/experiments/new" className="btn btn-primary">
                Create Your First Experiment
              </Link>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Project</th>
                <th>Status</th>
                <th>Events</th>
                <th>Variants</th>
                <th>Goals</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExperiments.map((experiment) => (
                <tr key={experiment.id}>
                  <td>
                    <div className="experiment-info">
                      <Link
                        to={`/experiments/${experiment.id}`}
                        className="experiment-name"
                      >
                        {experiment.name}
                      </Link>
                      {experiment.description && (
                        <p className="experiment-description">
                          {experiment.description}
                        </p>
                      )}
                      <div className="experiment-variants">
                        {experiment.variants.map((variant) => (
                          <span 
                            key={variant.id} 
                            className={`variant-tag ${variant.isControl ? 'control' : 'variant'}`}
                          >
                            {variant.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="project-name">{experiment.project.name}</span>
                  </td>
                  <td>
                    <span className={getStatusBadge(experiment.status)}>
                      {experiment.status.toLowerCase()}
                    </span>
                  </td>
                  <td>{experiment._count.events.toLocaleString()}</td>
                  <td>{experiment.variants.length}</td>
                  <td>
                    {experiment.goals.length} 
                    {experiment.goals.some(g => g.isPrimary) && (
                      <span className="primary-goal-indicator">★</span>
                    )}
                  </td>
                  <td>
                    {new Date(experiment.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="experiment-actions">
                      <Link
                        to={`/experiments/${experiment.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </Link>
                      {experiment.status === 'RUNNING' && (
                        <button className="btn btn-secondary btn-sm">
                          Pause
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Experiments
