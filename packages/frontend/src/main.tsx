import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider, AuthContext } from './contexts/AuthContext'
import './index.css'

// Phase 3: FOUND THE CULPRIT! ManageSettingsPage breaks React
// ✅ WORKING IMPORTS:
import { SessionWorksheetPage } from './pages/SessionWorksheetPage'
import { ManageSessionsPage } from './pages/ManageSessionsPage'
import { ManageTrainersPage } from './pages/ManageTrainersPage'
import { ManageLocationsPage } from './pages/ManageLocationsPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { UserRole } from './types/auth.types'
// ❌ BROKEN: ManageSettingsPage (removed - causes blank page)

// Minimal SimplePage component with the design from original PublicHomepage
const SimplePage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            margin: 0,
            color: '#2c3e50',
            fontSize: '1.75rem',
            fontWeight: 700
          }}>
            Leadership Training
          </h1>
          <nav>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#2c3e50',
                border: '2px solid #2c3e50',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              Login
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: 700,
            margin: '0 0 1rem 0',
            lineHeight: 1.2
          }}>
            Develop Your Leadership Skills
          </h2>
          <p style={{
            fontSize: '1.25rem',
            margin: '0 auto',
            opacity: 0.9,
            lineHeight: 1.6,
            maxWidth: '600px'
          }}>
            Join our expert-led training sessions designed to enhance your leadership capabilities and drive organizational success.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section style={{
        flex: 1,
        padding: '3rem 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h3 style={{
            fontSize: '2.25rem',
            fontWeight: 600,
            color: '#2c3e50',
            margin: '0 0 2rem 0',
            textAlign: 'center'
          }}>
            Upcoming Training Sessions
          </h3>

          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#7f8c8d'
          }}>
            <h4 style={{
              color: '#2c3e50',
              fontSize: '1.5rem',
              marginBottom: '0.5rem'
            }}>
              No upcoming sessions available
            </h4>
            <p style={{
              fontSize: '1.1rem'
            }}>
              Check back soon for new training opportunities!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#2c3e50',
        color: 'white',
        padding: '2rem',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <p>&copy; 2024 Leadership Training App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

// Real Login component with AuthContext integration
const SimpleLogin = () => {
  const [email, setEmail] = React.useState('sarah.content@company.com')
  const [password, setPassword] = React.useState('Password123!')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const { login } = React.useContext(AuthContext)!
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login({ email, password })

      // Redirect to dashboard using React Router
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#2c3e50'
        }}>
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500,
              color: '#2c3e50'
            }}>
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500,
              color: '#2c3e50'
            }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div style={{
              color: '#e74c3c',
              backgroundColor: '#ffebee',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #ffcdd2'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#95a5a6' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#7f8c8d'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500 }}>Test Accounts:</p>
          <p style={{ margin: '0.25rem 0' }}>📧 Content Developer: sarah.content@company.com</p>
          <p style={{ margin: '0.25rem 0' }}>👨‍🏫 Trainer: john.trainer@company.com</p>
          <p style={{ margin: '0.25rem 0' }}>🏢 Broker: broker1@company.com</p>
          <p style={{ margin: '0.25rem 0' }}>🔑 Password for all: Password123!</p>
        </div>

        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '0.75rem',
            background: 'transparent',
            color: '#667eea',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 500,
            marginTop: '1rem',
            border: '1px solid #667eea'
          }}
        >
          Back to Home
        </a>
      </div>
    </div>
  )
}

// Enhanced Dashboard with test info
const SimpleDashboard = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          color: '#1f2937',
          fontSize: '2.5rem',
          fontWeight: 700,
          margin: '0 0 2rem 0'
        }}>
          Dashboard
        </h1>
        
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
            🎯 CULPRIT FOUND: ManageSettingsPage!
          </h2>
          <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
            <strong>Working imports:</strong><br/>
            ✅ SessionWorksheetPage<br/>
            ✅ ManageSessionsPage<br/>
            ✅ ManageTrainersPage<br/>
            ✅ ManageLocationsPage<br/>
            ❌ ManageSettingsPage (BREAKS React)
          </p>
          
          {/* Test Page Links */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <a
              href="/sessions/worksheet"
              style={{
                display: 'block',
                padding: '1rem',
                border: '2px solid #27ae60',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2c3e50',
                backgroundColor: '#d4edda',
                textAlign: 'center'
              }}
            >
              📝 Session Worksheet ✅
            </a>
            <a
              href="/sessions/manage"
              style={{
                display: 'block',
                padding: '1rem',
                border: '2px solid #27ae60',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2c3e50',
                backgroundColor: '#d4edda',
                textAlign: 'center'
              }}
            >
              📋 Manage Sessions ✅
            </a>
            <a
              href="/admin/trainers"
              style={{
                display: 'block',
                padding: '1rem',
                border: '2px solid #27ae60',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2c3e50',
                backgroundColor: '#d4edda',
                textAlign: 'center'
              }}
            >
              👥 Manage Trainers ✅
            </a>
            <a
              href="/admin/locations"
              style={{
                display: 'block',
                padding: '1rem',
                border: '2px solid #27ae60',
                borderRadius: '6px',
                textDecoration: 'none',
                color: '#2c3e50',
                backgroundColor: '#d4edda',
                textAlign: 'center'
              }}
            >
              📍 Manage Locations ✅
            </a>
          </div>

          <div style={{
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#c62828', margin: '0 0 0.5rem 0' }}>
              ⚙️ Manage Settings - DISABLED
            </h4>
            <p style={{ color: '#d32f2f', margin: 0, fontSize: '0.875rem' }}>
              This component has import/syntax errors preventing React from mounting
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a
              href="/"
              style={{
                padding: '0.75rem 1.5rem',
                background: '#6366f1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 500
              }}
            >
              🏠 Back to Home
            </a>
            <a
              href="/login"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#6366f1',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                border: '1px solid #6366f1'
              }}
            >
              🔐 Switch User
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

console.log('Phase 3: CULPRIT IDENTIFIED - ManageSettingsPage removed, 4 working imports restored')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<SimplePage />} />
          <Route path="/login" element={<SimpleLogin />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <SimpleDashboard />
            </ProtectedRoute>
          } />

          {/* Working routes (ManageSettingsPage removed) */}
          <Route path="/sessions/worksheet" element={
            <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER]}>
              <SessionWorksheetPage />
            </ProtectedRoute>
          } />
          <Route path="/sessions/manage" element={
            <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER]}>
              <ManageSessionsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/trainers" element={
            <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER]}>
              <ManageTrainersPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/locations" element={
            <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER]}>
              <ManageLocationsPage />
            </ProtectedRoute>
          } />
          
          {/* ManageSettingsPage route disabled until fixed */}
          <Route path="/admin/settings" element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h2 style={{ color: '#e74c3c' }}>Settings Page Temporarily Disabled</h2>
              <p>This page has import errors and needs to be fixed.</p>
              <a href="/dashboard" style={{ color: '#6366f1' }}>← Back to Dashboard</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)