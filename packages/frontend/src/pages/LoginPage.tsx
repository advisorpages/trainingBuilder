import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../ui/button'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Password123!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading } = useAuth()

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
    setLoading(true)
    setError('')

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string, role: string) => {
    setLoading(true)
    setError('')
    setEmail(demoEmail)

    try {
      await login({ email: demoEmail, password: 'Password123!' })
      navigate(from, { replace: true })
    } catch (err) {
      setError(`Demo login failed for ${role}. Please check if the demo account exists.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <h2>Login</h2>

      <form onSubmit={handleSubmit} className="form">
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
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4 font-medium">Quick Demo Login:</p>

          {/* Content Developers */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">👩‍💻 Content Developers</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => handleDemoLogin('sarah.content@company.com', 'Content Developer')}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sarah C.
              </Button>
              <Button
                onClick={() => handleDemoLogin('mike.creator@company.com', 'Content Developer')}
                disabled={loading}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Mike C.
              </Button>
            </div>
          </div>

          {/* Trainers */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">👨‍🏫 Trainers</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => handleDemoLogin('john.trainer@company.com', 'Trainer')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                John T.
              </Button>
              <Button
                onClick={() => handleDemoLogin('lisa.coach@company.com', 'Trainer')}
                disabled={loading}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Lisa C.
              </Button>
            </div>
          </div>

          {/* Brokers/Admins */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">👑 Brokers (Admins)</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => handleDemoLogin('broker1@company.com', 'Broker')}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Broker 1
              </Button>
              <Button
                onClick={() => handleDemoLogin('broker2@company.com', 'Broker')}
                disabled={loading}
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Broker 2
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 text-center mb-3">
            <strong>All Demo Accounts:</strong>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
            <div className="space-y-1">
              <p><strong className="text-blue-600">Content Developers:</strong></p>
              <p>• <code>sarah.content@company.com</code></p>
              <p>• <code>mike.creator@company.com</code></p>
            </div>
            <div className="space-y-1">
              <p><strong className="text-green-600">Trainers:</strong></p>
              <p>• <code>john.trainer@company.com</code></p>
              <p>• <code>lisa.coach@company.com</code></p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p><strong className="text-purple-600">Brokers (Admins):</strong></p>
              <p>• <code>broker1@company.com</code></p>
              <p>• <code>broker2@company.com</code></p>
            </div>
            <div className="sm:col-span-2 text-center pt-2 border-t border-gray-100">
              <p className="font-medium">🔑 Password for all accounts: <code className="bg-gray-100 px-1 rounded">Password123!</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage