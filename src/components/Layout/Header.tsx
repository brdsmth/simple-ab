import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import './Header.css'

const Header: React.FC = () => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">A/B Testing Platform</h1>
        </div>
        
        <div className="header-right">
          <div className="user-menu">
            <span className="user-name">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
