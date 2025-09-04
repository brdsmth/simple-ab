import React from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const Dashboard: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const stats = {
    totalExperiments: 12,
    runningExperiments: 3,
    completedExperiments: 8,
    totalVisitors: 15420,
  }

  const recentExperiments = [
    {
      id: '1',
      name: 'Homepage Hero Button Color',
      status: 'running',
      visitors: 1250,
      conversionRate: 3.2,
      confidence: 85,
    },
    {
      id: '2',
      name: 'Checkout Flow Optimization',
      status: 'running',
      visitors: 890,
      conversionRate: 5.8,
      confidence: 92,
    },
    {
      id: '3',
      name: 'Product Page Layout Test',
      status: 'completed',
      visitors: 2150,
      conversionRate: 4.1,
      confidence: 98,
    },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your A/B testing performance.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🧪</div>
          <div className="stat-content">
            <h3>{stats.totalExperiments}</h3>
            <p>Total Experiments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">▶️</div>
          <div className="stat-content">
            <h3>{stats.runningExperiments}</h3>
            <p>Running Experiments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedExperiments}</h3>
            <p>Completed Experiments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalVisitors.toLocaleString()}</h3>
            <p>Total Visitors</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Experiments</h2>
            <Link to="/experiments" className="btn btn-outline btn-sm">
              View All
            </Link>
          </div>

          <div className="experiments-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Experiment Name</th>
                  <th>Status</th>
                  <th>Visitors</th>
                  <th>Conversion Rate</th>
                  <th>Confidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentExperiments.map((experiment) => (
                  <tr key={experiment.id}>
                    <td>
                      <Link
                        to={`/experiments/${experiment.id}`}
                        className="experiment-name"
                      >
                        {experiment.name}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          experiment.status === 'running'
                            ? 'badge-primary'
                            : 'badge-success'
                        }`}
                      >
                        {experiment.status}
                      </span>
                    </td>
                    <td>{experiment.visitors.toLocaleString()}</td>
                    <td>{experiment.conversionRate}%</td>
                    <td>
                      <span
                        className={`confidence-badge ${
                          experiment.confidence >= 95
                            ? 'high'
                            : experiment.confidence >= 80
                            ? 'medium'
                            : 'low'
                        }`}
                      >
                        {experiment.confidence}%
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/experiments/${experiment.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-actions">
          <div className="action-card">
            <h3>Create New Experiment</h3>
            <p>Start testing variations of your website to improve conversions.</p>
            <Link to="/experiments/new" className="btn btn-primary">
              Create Experiment
            </Link>
          </div>

          <div className="action-card">
            <h3>Manage Projects</h3>
            <p>Organize your experiments by creating and managing projects.</p>
            <Link to="/projects" className="btn btn-secondary">
              Manage Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
