import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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
    <div className="page">
      <h2>Welcome to Leadership Training App</h2>

      <div className={`health-status ${backendHealth.includes('✅') ? 'healthy' : 'error'}`}>
        <strong>Backend Status:</strong> {backendHealth}
      </div>

      <p>
        This is the public homepage where training sessions will be displayed.
      </p>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/login">
          <button className="btn">Login</button>
        </Link>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <h3>Development Status</h3>
        <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <li>✅ Monorepo structure</li>
          <li>✅ Docker environment</li>
          <li>✅ Frontend React app</li>
          <li>🔄 Backend API (in progress)</li>
          <li>🔄 Database connection</li>
          <li>⏳ Authentication</li>
        </ul>
      </div>
    </div>
  )
}

export default HomePage