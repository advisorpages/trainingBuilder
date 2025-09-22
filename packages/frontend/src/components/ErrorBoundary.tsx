import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          backgroundColor: '#ffebee',
          minHeight: '100vh',
          color: '#c62828'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            🚨 Something went wrong!
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            A React error was caught by the Error Boundary.
          </p>
          <div style={{
            backgroundColor: '#ffcdd2',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <strong>Error Details:</strong><br/>
            {this.state.error?.name}: {this.state.error?.message}<br/>
            <br/>
            <strong>Stack Trace:</strong><br/>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.error?.stack}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;