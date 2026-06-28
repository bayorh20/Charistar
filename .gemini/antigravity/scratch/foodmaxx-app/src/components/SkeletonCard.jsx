import React from 'react';

export default function SkeletonCard({ viewMode = 'classic' }) {
  if (viewMode === 'grid') {
    return (
      <div className="skeleton-card grid-skeleton">
        <div className="skeleton-image skeleton-shimmer" />
        <div className="skeleton-grid-row">
          <div className="skeleton-title skeleton-shimmer" style={{ width: '55%', height: '16px', margin: 0 }} />
          <div className="skeleton-title skeleton-shimmer" style={{ width: '25%', height: '16px', margin: 0 }} />
        </div>
        <div className="skeleton-grid-row" style={{ marginTop: '8px' }}>
          <div className="skeleton-text skeleton-shimmer" style={{ width: '45%', height: '12px', margin: 0 }} />
          <div className="skeleton-text skeleton-shimmer" style={{ width: '15%', height: '12px', margin: 0 }} />
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="skeleton-card list-skeleton">
        <div className="skeleton-image skeleton-shimmer" style={{ position: 'absolute', inset: 0, height: '100%', borderRadius: '20px', zIndex: 1, marginBottom: 0 }} />
        <div className="skeleton-list-overlay">
          <div className="skeleton-list-details">
            <div className="skeleton-title skeleton-shimmer" style={{ width: '80%', height: '18px', margin: 0 }} />
            <div className="skeleton-text skeleton-shimmer" style={{ width: '50%', height: '12px', margin: 0 }} />
          </div>
          <div className="skeleton-title skeleton-shimmer" style={{ width: '20%', height: '18px', margin: 0 }} />
        </div>
        <div className="skeleton-fab skeleton-shimmer" style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 3 }} />
      </div>
    );
  }

  // Default: 'classic' / 'default' layout
  return (
    <div className="skeleton-card classic-skeleton">
      <div className="skeleton-image skeleton-shimmer" />
      <div className="skeleton-title skeleton-shimmer" />
      <div className="skeleton-text skeleton-shimmer" />
      <div className="skeleton-tags">
        <div className="skeleton-tag skeleton-shimmer" />
        <div className="skeleton-tag skeleton-shimmer" />
      </div>
      <div className="skeleton-fab skeleton-shimmer" />
    </div>
  );
}
