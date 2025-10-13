import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  console.log('=== LOGIN PAGE LOADING ===')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Password123!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading } = useAuth()

  console.log('=== LOGIN PAGE STATE ===', {
    isLoading,
    isAuthenticated,
    email,
    hasLoginFunction: typeof login === 'function'
  })

  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  // Handle redirect when already authenticated - use useEffect to avoid calling navigate during render
  // TEMPORARILY DISABLED: This was causing race condition with login process
  // useEffect(() => {
  //   if (!isLoading && isAuthenticated) {
  //     navigate(from, { replace: true })
  //   }
  // }, [isLoading, isAuthenticated, navigate, from])

  // Wait for auth loading to complete before showing login form
  if (isLoading) {
    return (
      <div className="page">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render login form if already authenticated (redirect will happen via useEffect)
  // TEMPORARILY DISABLED: Allowing login form to show even if authenticated for debugging
  // if (isAuthenticated) {
  //   return null
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('=== LOGIN FORM SUBMIT ===', { email, password: '***' })
    setLoading(true)
    setError('')

    try {
      console.log('=== CALLING LOGIN ===')
      await login({ email, password })
      console.log('=== LOGIN SUCCESS ===')
      navigate(from, { replace: true })
    } catch (err) {
      console.log('=== LOGIN ERROR ===', err)
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h2>Login</h2>

      <form onSubmit={(e) => {
        console.log('=== FORM ONSUBMIT CALLED ===');
        handleSubmit(e);
      }} className="form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn w-full"
          disabled={loading}
          onClick={(e) => {
            console.log('=== BUTTON CLICKED ===', e.type);
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Test Accounts:</strong></p>
        <p>📧 Content Developer: sarah.content@company.com</p>
        <p>👨‍🏫 Trainer: john.trainer@company.com</p>
        <p>🔑 Password for all: <code>Password123!</code></p>
      </div>
    </div>
  )
}

export default LoginPage