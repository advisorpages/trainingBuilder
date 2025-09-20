import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const HomePage = () => {
  const [backendHealth, setBackendHealth] = useState<string>('Checking...')

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/health`)
        if (response.ok) {
          setBackendHealth('Connected ✅')
        } else {
          setBackendHealth('Backend responding but unhealthy ⚠️')
        }
      } catch (error) {
        setBackendHealth('Cannot connect to backend ❌')
      }
    }

    checkBackendHealth()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Welcome to Leadership Training App</h1>

      <div className={`p-4 mb-6 rounded-lg border ${
        backendHealth.includes('✅')
          ? 'bg-success-50 border-success-200 text-success-800'
          : 'bg-danger-50 border-danger-200 text-danger-800'
      }`}>
        <strong>Backend Status:</strong> {backendHealth}
      </div>

      <p className="text-lg text-center text-secondary-600 mb-8">
        This is the public homepage where training sessions will be displayed.
      </p>

      <div className="mt-8">
        <Link to="/login">
          <Button variant="primary" size="lg">
            Login
          </Button>
        </Link>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-semibold mb-4 text-center">Development Status</h3>
        <ul className="max-w-md mx-auto space-y-2 text-sm text-secondary-600">
          <li className="flex items-center">
            <span className="text-success-500 mr-2">✅</span>
            Monorepo structure
          </li>
          <li className="flex items-center">
            <span className="text-success-500 mr-2">✅</span>
            Docker environment
          </li>
          <li className="flex items-center">
            <span className="text-success-500 mr-2">✅</span>
            Frontend React app
          </li>
          <li className="flex items-center">
            <span className="text-warning-500 mr-2">🔄</span>
            Backend API (in progress)
          </li>
          <li className="flex items-center">
            <span className="text-warning-500 mr-2">🔄</span>
            Database connection
          </li>
          <li className="flex items-center">
            <span className="text-secondary-400 mr-2">⏳</span>
            Authentication
          </li>
        </ul>
      </div>
    </div>
  )
}

export default HomePage