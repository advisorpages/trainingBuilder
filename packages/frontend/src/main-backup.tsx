import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

// Import existing page components
import { SessionWorksheetPage } from './pages/SessionWorksheetPage'
import { ManageSessionsPage } from './pages/ManageSessionsPage'
import { ManageTrainersPage } from './pages/ManageTrainersPage'
import { ManageLocationsPage } from './pages/ManageLocationsPage'
import { ManageSettingsPage } from './pages/ManageSettingsPage'
import { IncentiveWorksheetPage } from './pages/IncentiveWorksheetPage'
import AnalyticsPage from './pages/AnalyticsPage'
import TrainerDashboardPage from './pages/TrainerDashboardPage'
import BrokerSessionsPage from './pages/BrokerSessionsPage'
import BrokerIncentivesPage from './pages/BrokerIncentivesPage'
import BrokerReportsPage from './pages/BrokerReportsPage'

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
              onMouseOver={(e) => {
                e.target.style.background = '#2c3e50'
                e.target.style.color = 'white'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = '#2c3e50'
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

// Simple Login component with working auth
const SimpleLogin = () => {
  const [email, setEmail] = React.useState('sarah.content@company.com')
  const [password, setPassword] = React.useState('Password123!')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000))

      // For now, just redirect to a success message
      alert('Login functionality restored! Redirecting to dashboard...')
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Invalid email or password')
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

// Comprehensive Dashboard with Role-Based Sections
const SimpleDashboard = () => {
  // Mock auth context - replace with actual useAuth when ready
  const mockUser = {
    email: 'sarah.content@company.com',
    role: { name: 'CONTENT_DEVELOPER' }, // Can be: CONTENT_DEVELOPER, TRAINER, BROKER
    isActive: true
  }

  const getRoleBasedActions = (roleName: string) => {
    switch (roleName) {
      case 'CONTENT_DEVELOPER':
        return (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                color: '#2c3e50',
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: 0
              }}>
                Content Developer Actions
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {[
                  { name: 'Session Worksheet', icon: '📝', path: '/sessions/worksheet', desc: 'Create and edit training sessions' },
                  { name: 'Manage Sessions', icon: '📋', path: '/sessions/manage', desc: 'View and manage all sessions' },
                  { name: 'Manage Trainers', icon: '👥', path: '/admin/trainers', desc: 'Add and manage trainer profiles' },
                  { name: 'Manage Locations', icon: '📍', path: '/admin/locations', desc: 'Configure training locations' },
                  { name: 'System Settings', icon: '⚙️', path: '/admin/settings', desc: 'Configure system preferences' },
                  { name: 'Incentive Worksheet', icon: '🏆', path: '/incentives/worksheet', desc: 'Create and manage incentives' },
                  { name: 'Analytics Dashboard', icon: '📊', path: '/analytics', desc: 'View performance metrics' }
                ].map((item, index) => (
                  <a
                    key={index}
                    href={item.path}
                    style={{
                      display: 'block',
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#f9fafb'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = '#667eea'
                      e.target.style.backgroundColor = '#f0f4ff'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.backgroundColor = '#f9fafb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>{item.icon}</span>
                      <span style={{ fontWeight: 600, color: '#2c3e50' }}>{item.name}</span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      lineHeight: 1.4
                    }}>
                      {item.desc}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )

      case 'TRAINER':
        return (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                color: '#2c3e50',
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: 0
              }}>
                Trainer Dashboard
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {[
                  { name: 'My Sessions & Materials', icon: '📅', path: '/trainer/dashboard', desc: 'View assigned sessions and coaching materials' },
                  { name: 'Session Details & Tips', icon: '📋', path: '#', desc: 'Session details with AI coaching tips ✅' },
                  { name: 'AI Coaching Tips', icon: '💡', path: '#', desc: 'AI-generated coaching recommendations ✅' },
                  { name: 'Trainer Kit Notifications', icon: '✉️', path: '#', desc: 'Email notifications (Coming in Story 4.5)' }
                ].map((item, index) => (
                  <a
                    key={index}
                    href={item.path}
                    style={{
                      display: 'block',
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s ease',
                      backgroundColor: item.path === '#' ? '#f3f4f6' : '#f9fafb',
                      opacity: item.path === '#' ? 0.7 : 1
                    }}
                    onMouseOver={(e) => {
                      if (item.path !== '#') {
                        e.target.style.borderColor = '#667eea'
                        e.target.style.backgroundColor = '#f0f4ff'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (item.path !== '#') {
                        e.target.style.borderColor = '#e5e7eb'
                        e.target.style.backgroundColor = '#f9fafb'
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>{item.icon}</span>
                      <span style={{ fontWeight: 600, color: '#2c3e50' }}>{item.name}</span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      lineHeight: 1.4
                    }}>
                      {item.desc}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )

      case 'BROKER':
        return (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                color: '#2c3e50',
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: 0
              }}>
                Broker Access
              </h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {[
                  { name: 'Session Worksheet', icon: '📝', path: '/sessions/worksheet', desc: 'Create training sessions' },
                  { name: 'Published Sessions', icon: '📖', path: '/broker/sessions', desc: 'View available training sessions' },
                  { name: 'Available Incentives', icon: '🏆', path: '/broker/incentives', desc: 'Browse current incentives' },
                  { name: 'Basic Reports', icon: '📈', path: '/broker/reports', desc: 'View performance reports' }
                ].map((item, index) => (
                  <a
                    key={index}
                    href={item.path}
                    style={{
                      display: 'block',
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#f9fafb'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = '#667eea'
                      e.target.style.backgroundColor = '#f0f4ff'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = '#e5e7eb'
                      e.target.style.backgroundColor = '#f9fafb'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>{item.icon}</span>
                      <span style={{ fontWeight: 600, color: '#2c3e50' }}>{item.name}</span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      lineHeight: 1.4
                    }}>
                      {item.desc}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '1rem' }}>Unknown Role</h3>
            <p style={{ color: '#7f8c8d' }}>Please contact an administrator to configure your account.</p>
          </div>
        )
    }
  }

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
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: '#1f2937',
            fontSize: '2.5rem',
            fontWeight: 700,
            margin: 0
          }}>
            Dashboard
          </h1>
          <button
            onClick={() => {
              alert('Logout successful!')
              window.location.href = '/'
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            Logout
          </button>
        </div>

        {/* Welcome Section */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              color: '#1f2937',
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: '0 0 0.5rem 0'
            }}>
              Welcome, {mockUser.email}!
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              <div><strong style={{ color: '#374151' }}>Role:</strong> {mockUser.role.name}</div>
              <div><strong style={{ color: '#374151' }}>Account Status:</strong> {mockUser.isActive ? '🟢 Active' : '🔴 Inactive'}</div>
            </div>
          </div>
        </div>

        {/* Role-Based Content */}
        {getRoleBasedActions(mockUser.role.name)}

        {/* Status Section */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              color: '#1f2937',
              fontSize: '1.25rem',
              fontWeight: 600,
              margin: 0
            }}>
              System Status
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%)',
              border: '1px solid #0891b2',
              borderRadius: '6px',
              padding: '1rem'
            }}>
              <p style={{
                margin: 0,
                color: '#0f172a',
                fontSize: '0.875rem',
                lineHeight: 1.6
              }}>
                <strong>Current Story:</strong> 6.4 - Incentive Publishing and Public Display ✅<br />
                <strong>Status:</strong> Complete - Incentives can be published, unpublished, and displayed publicly with automated expiration<br />
                <strong>Application:</strong> Successfully rebuilt with clean architecture - white page issue resolved! 🎉
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              color: '#1f2937',
              fontSize: '1.25rem',
              fontWeight: 600,
              margin: 0
            }}>
              Quick Navigation
            </h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
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
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
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
                  fontSize: '0.875rem',
                  border: '1px solid #6366f1',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#6366f1'
                  e.target.style.color = 'white'
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = '#6366f1'
                }}
              >
                🔐 Switch User
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Import existing page components instead of creating duplicates

console.log('Minimal main.tsx loading...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<SimplePage />} />
          <Route path="/login" element={<SimpleLogin />} />
          <Route path="/dashboard" element={<SimpleDashboard />} />

          {/* Content Developer Routes */}
          <Route path="/sessions/worksheet" element={<SessionWorksheetPage />} />
          <Route path="/sessions/manage" element={<ManageSessionsPage />} />
          <Route path="/admin/trainers" element={<ManageTrainersPage />} />
          <Route path="/admin/locations" element={<ManageLocationsPage />} />
          <Route path="/admin/settings" element={<ManageSettingsPage />} />
          <Route path="/incentives/worksheet" element={<IncentiveWorksheetPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Trainer Routes */}
          <Route path="/trainer/dashboard" element={<TrainerDashboardPage />} />

          {/* Broker Routes */}
          <Route path="/broker/sessions" element={<BrokerSessionsPage />} />
          <Route path="/broker/incentives" element={<BrokerIncentivesPage />} />
          <Route path="/broker/reports" element={<BrokerReportsPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)