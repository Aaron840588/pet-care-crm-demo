import React from 'react';

/**
 * Error Boundary (CQ8) — prevents blank-screen crashes
 * Wraps each lazy-loaded view to isolate failures
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(err, info) {
    console.error('[Kat CRM] Unhandled error:', err, info?.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐾</div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            marginBottom: '10px',
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: 'var(--gray)',
            fontSize: '13px',
            marginBottom: '8px',
            lineHeight: 1.6,
          }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p style={{ color: 'var(--gray)', fontSize: '12px', marginBottom: '24px' }}>
            Your data is safe — this is just a display glitch.
          </p>
          <button
            onClick={this.reset}
            style={{
              padding: '12px 28px',
              background: 'var(--lime)',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              touchAction: 'manipulation',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
