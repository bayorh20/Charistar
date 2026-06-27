import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { safeStorage, safeSessionStorage } from '../utils/storage';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled React Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    // Clear storage/caches and reload to recover
    try {
      safeSessionStorage.clear();
      safeStorage.removeItem('fm_retry_lazy');
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          const promises = registrations.map(r => r.unregister());
          if (window.caches) {
            promises.push(
              caches.keys().then((names) => Promise.all(names.map(name => caches.delete(name))))
            );
          }
          Promise.all(promises).then(() => {
            window.location.reload();
          }).catch(() => {
            window.location.reload();
          });
        });
        return;
      }
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isOfflineError = !navigator.onLine || 
        (this.state.error && (
          this.state.error.message === "OfflineChunkLoadError" ||
          this.state.error.toString().includes("OfflineChunkLoadError") ||
          this.state.error.message.includes("Failed to fetch dynamically imported module") ||
          this.state.error.message.includes("Loading chunk")
        ));

      if (isOfflineError) {
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100vw',
            background: 'var(--bg-app, #FDFDFD)',
            color: 'var(--text-main, #4D423E)',
            fontFamily: 'var(--font-primary, system-ui, sans-serif)',
            padding: '24px',
            boxSizing: 'border-box',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Inject keyframes inside a React style block */}
            <style>{`
              @keyframes floatBlob {
                0% { transform: translate(0, 0) scale(1); }
                100% { transform: translate(30px, 20px) scale(1.05); }
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 91, 38, 0.15); }
                50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(255, 91, 38, 0); }
              }
            `}</style>

            {/* Ambient Animated Gradient Mesh Blobs */}
            <div style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 1
            }}>
              <div style={{
                position: 'absolute',
                background: 'var(--primary, #FF5B26)',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                filter: 'blur(100px)',
                opacity: 0.12,
                top: '10%',
                left: '-10%',
                animation: 'floatBlob 12s infinite alternate ease-in-out'
              }} />
              <div style={{
                position: 'absolute',
                background: '#8B5CF6',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                filter: 'blur(110px)',
                opacity: 0.1,
                bottom: '10%',
                right: '-10%',
                animation: 'floatBlob 15s infinite alternate ease-in-out'
              }} />
            </div>

            <div style={{
              background: 'var(--glass-bg, rgba(253, 253, 253, 0.85))',
              border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.4))',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              padding: '40px 24px',
              borderRadius: '28px',
              boxShadow: 'var(--shadow-lg, 0 12px 40px rgba(0, 0, 0, 0.06))',
              maxWidth: '380px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              position: 'relative',
              zIndex: 10
            }}>
              {/* Brand Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'var(--primary, #FF5B26)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px var(--primary-glow, rgba(255, 91, 38, 0.15))'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <span style={{
                  fontFamily: 'var(--font-accent, system-ui, sans-serif)',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(135deg, var(--primary, #FF5B26) 0%, #FF8A65 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>FoodMaxx</span>
              </div>

              <div style={{
                background: 'var(--primary-glow, rgba(255, 91, 38, 0.08))',
                color: 'var(--primary, #FF5B26)',
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '12px',
                animation: 'pulse 2s infinite ease-in-out'
              }}>
                <WifiOff size={30} style={{ strokeWidth: 2.5 }} />
              </div>

              <span style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                padding: '5px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}>
                Offline Mode
              </span>

              <h1 style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                margin: 0,
                fontFamily: 'var(--font-accent, system-ui, sans-serif)',
                letterSpacing: '-0.3px'
              }}>
                Connection Lost
              </h1>

              <p style={{
                fontSize: '0.84rem',
                color: 'var(--text-muted, #9A9189)',
                lineHeight: 1.5,
                margin: 0
              }}>
                We're having trouble connecting to FoodMaxx. Please check your internet connection and try again.
              </p>

              <button
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'var(--primary, #FF5B26)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '12px 24px',
                  fontSize: '0.86rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 4px 14px var(--primary-glow, rgba(255, 91, 38, 0.25))',
                  transition: 'transform 0.2s ease, background-color 0.2s ease'
                }}
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        );
      }

      // Default Unhandled Exception UI
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          background: 'var(--bg-app, #FDFDFD)',
          color: 'var(--text-main, #4D423E)',
          fontFamily: 'var(--font-primary, system-ui, sans-serif)',
          padding: '24px',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--bg-card, #FFFFFF)',
            padding: '32px 24px',
            borderRadius: '24px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
            maxWidth: '400px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={28} />
            </div>
            
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              margin: '8px 0 0 0',
              fontFamily: 'var(--font-accent, system-ui, sans-serif)'
            }}>
              Something Went Wrong
            </h1>
            
            <p style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted, #9A9189)',
              lineHeight: 1.5,
              margin: 0
            }}>
              The application encountered an unexpected rendering error. We have logged this event and prepared a recovery boot.
            </p>
            
            {this.state.error && (
              <div style={{
                textAlign: 'left',
                background: '#FFF5F2',
                color: '#D32F2F',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                maxWidth: '100%',
                maxHeight: '150px',
                border: '1px solid #FFCDD2',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                <strong>Error:</strong> {this.state.error.message || this.state.error.toString()}
                {this.state.error.stack && (
                  <div style={{ marginTop: '8px', opacity: 0.8, fontSize: '0.7rem', maxHeight: '100px', overflowY: 'auto' }}>
                    {this.state.error.stack}
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'var(--primary, #FF5B26)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '20px',
                padding: '12px 24px',
                fontSize: '0.84rem',
                fontWeight: '800',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 14px rgba(255, 91, 38, 0.25)',
                transition: 'transform 0.15s ease'
              }}
            >
              <RefreshCw size={16} />
              <span>Recover & Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
