import React, { useState, useEffect } from 'react'
import { getToken } from '../services/authService'
import './Projects.css'

interface Project {
  id: string
  name: string
  description?: string
  domain: string
  createdAt: string
  updatedAt: string
  _count?: {
    experiments: number
  }
}

const Projects: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const token = getToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newProject = await response.json()
        setProjects([newProject, ...projects])
        setFormData({ name: '', description: '', domain: '' })
        setShowCreateForm(false)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create project')
      }
    } catch (err) {
      setError('Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (loading) {
    return (
      <div className="projects">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="projects">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Organize your experiments by grouping them into projects.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
          disabled={submitting}
        >
          Create Project
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Project Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  disabled={submitting}
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
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="domain" className="form-label">
                  Website Domain
                </label>
                <input
                  id="domain"
                  name="domain"
                  type="url"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://example.com"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to start organizing your A/B tests.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className="project-experiments">
                  {project._count?.experiments || 0} experiments
                </span>
              </div>
              
              <p className="project-description">{project.description || 'No description provided'}</p>
              
              <div className="project-meta">
                <span className="project-domain">{project.domain}</span>
                <span className="project-date">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="project-actions">
                <button className="btn btn-outline btn-sm">
                  View Experiments
                </button>
                <button className="btn btn-primary btn-sm">
                  Settings
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Projects
