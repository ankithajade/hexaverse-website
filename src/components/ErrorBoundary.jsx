import { Component } from 'react';

/**
 * Top-level React Error Boundary.
 * Catches uncaught runtime exceptions during rendering and displays a clean,
 * diagnosable fallback UI instead of blanking out the whole website.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg, #E9F5FA)',
            color: 'var(--text, #12242B)',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(4, 36, 43, 0.12)',
              border: '1px solid rgba(4, 36, 43, 0.10)',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '12px', color: '#dc2626' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '16px', lineHeight: '1.5' }}>
              An uncaught application error occurred during rendering. Details:
            </p>
            <pre
              style={{
                background: '#f3f4f6',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                overflowX: 'auto',
                marginBottom: '24px',
                color: '#1f2937',
              }}
            >
              {this.state.error?.toString() || 'Unknown Error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#04788f',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
