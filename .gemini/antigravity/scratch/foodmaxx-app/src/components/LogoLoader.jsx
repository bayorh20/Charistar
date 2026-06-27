import React from 'react';

export default function LogoLoader({ size = 68, fullscreen = false }) {
  return (
    <div 
      className={`logo-loader-container ${fullscreen ? 'fullscreen' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: fullscreen ? '100vh' : '100%',
        background: fullscreen ? 'var(--bg-app)' : 'transparent',
        position: fullscreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        gap: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div className="kinetic-cube-viewport">
        <div className="kinetic-cube">
          <div className="cube-face front">
            <span className="cube-emoji">🍲</span>
            <span className="cube-text">Amala</span>
          </div>
          <div className="cube-face back">
            <span className="cube-emoji">🍛</span>
            <span className="cube-text">Jollof</span>
          </div>
          <div className="cube-face right">
            <span className="cube-emoji">🍗</span>
            <span className="cube-text">Suya</span>
          </div>
          <div className="cube-face left">
            <span className="cube-emoji">🥬</span>
            <span className="cube-text">Moin Moin</span>
          </div>
          <div className="cube-face top">
            <span className="cube-emoji">🥤</span>
            <span className="cube-text">Drinks</span>
          </div>
          <div className="cube-face bottom">
            <span className="cube-emoji">🍰</span>
            <span className="cube-text">Sweets</span>
          </div>
        </div>
      </div>
      <span className="logo-loader-text" style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '12px' }}>
        Preparing Delights...
      </span>
    </div>
  );
}
