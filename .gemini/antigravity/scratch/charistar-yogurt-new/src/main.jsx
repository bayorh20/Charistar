import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// ─── Sentry Error Monitoring ────────────────────────────────────────────────
// Catches ALL runtime errors (Firebase permission errors, crashes, unhandled
// promise rejections) and reports them to your Sentry dashboard instantly.
// Set VITE_SENTRY_DSN in your .env.local to activate.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      // Standard browser tracing — works correctly for any SPA
      Sentry.browserTracingIntegration(),
      // Captures unhandled promise rejections (catches Firebase permission errors, network failures)
      Sentry.browserApiErrorsIntegration(),
    ],
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (import.meta.env.DEV) {
        console.warn('[Sentry] Would send in production:', event);
        return null;
      }
      return event;
    },
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{
          minHeight: '100vh',
          background: '#080808',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #22c55e20, #22c55e10)',
            border: '1px solid #22c55e40',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', marginBottom: '1.5rem',
          }}>
            🫙
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '320px' }}>
            {error?.message || 'An unexpected error occurred. Our team has been notified.'}
          </p>
          <button
            onClick={resetError}
            style={{
              background: '#22c55e', color: '#000', fontWeight: 800,
              padding: '0.75rem 2rem', borderRadius: '9999px', border: 'none',
              cursor: 'pointer', fontSize: '0.875rem', letterSpacing: '0.05em',
            }}
          >
            Try Again
          </button>
        </div>
      )}
      showDialog={false}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
