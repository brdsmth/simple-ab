import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../types/auth'
import * as authService from '../services/authService'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = authService.getToken()
        if (token) {
          const userData = await authService.getCurrentUser()
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        authService.removeToken()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: userData, token } = await authService.login(email, password)
      authService.setToken(token)
      setUser(userData)
    } catch (error) {
      setLoading(false)
      throw error
    }
    setLoading(false)
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const { user: userData, token } = await authService.register(name, email, password)
      authService.setToken(token)
      setUser(userData)
    } catch (error) {
      setLoading(false)
      throw error
    }
    setLoading(false)
  }

  const logout = () => {
    authService.removeToken()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
