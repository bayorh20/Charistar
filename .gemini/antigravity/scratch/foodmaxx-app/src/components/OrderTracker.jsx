import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Phone, Check, Clock, Bike, ChevronRight, X, ShieldAlert, Star } from 'lucide-react';
import { playNotificationChime } from '../utils/sound';

export default function OrderTracker() {
  const { currentOrder, cancelActiveOrder, soundEnabled, setActiveScreen, rateOrder, setCurrentOrder } = useContext(AppContext);
  const [showRiderModal, setShowRiderModal] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleRatingSubmit = (e) => {
    e.preventDefault();
    rateOrder(currentOrder.id, rating, reviewText);
    setCurrentOrder(null);
    setActiveScreen('home');
  };

  if (!currentOrder) {
    return (
      <div className="no-active-order anim-scale-in">
        <span className="no-order-icon">🥡</span>
        <h4>No Active Orders</h4>
        <p>You haven\'t placed any orders recently. Head back home to browse our delicious menu!</p>
        <button className="btn-back-home" onClick={() => setActiveScreen('home')}>Go to Menu</button>
      </div>
    );
  }

  // Map statusIndex (0 to 4) to progress percentage (0 to 100)
  const getTargetProgress = (index) => {
    if (index === 0) return 0;
    if (index === 1) return 10;
    if (index === 2) return 50;
    if (index === 3) return 85;
    if (index === 4) return 100;
    return 0;
  };

  const riderProgress = getTargetProgress(currentOrder.statusIndex);

  const getCoordinatesAlongPath = (percent) => {
    const startX = 50, startY = 60;
    const endX = 350, endY = 60;
    const t = percent / 100;
    return {
      x: startX + (endX - startX) * t,
      y: startY + (endY - startY) * t
    };
  };

  const riderPos = getCoordinatesAlongPath(riderProgress);

  const steps = [
    { label: 'Order Received', desc: 'Kitchen is confirming your basket' },
    { label: 'Preparing in Kitchen', desc: 'Chef Olaiya is cooking your food' },
    { label: 'Ready for Pickup', desc: 'Waiting for rider to pick up food' },
    { label: 'Rider Dispatched', desc: 'Rider Segun is on his way to you' },
    { label: 'Delivered', desc: 'Enjoy your warm FoodMaxx feast!' }
  ];

  return (
    <div className="tracker-container anim-fade">
      
      {/* Dynamic Status Header */}
      <div className="tracker-status-card">
        <div className="tracker-status-top">
          <div className="status-eta-group">
            <span className="status-eta-label">Estimated Delivery</span>
            <h2 className="status-eta-time">
              {currentOrder.statusIndex === 4 
                ? 'Delivered' 
                : `${Math.max(1, Math.round(25 * (100 - riderProgress) / 100))} mins • ${Math.max(0.1, parseFloat((4.2 * (100 - riderProgress) / 100).toFixed(1)))} km left`}
            </h2>
          </div>
          <div className="tracker-status-icon-box anim-float">
            <Bike size={24} className="rider-icon-color" />
          </div>
        </div>
        
        {currentOrder.payment?.scheduleType && currentOrder.payment.scheduleType !== 'asap' && (
          <div style={{ padding: '0 16px 12px 16px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
            🕒 Scheduled for: {currentOrder.payment.scheduleType === 'lunch' ? 'Lunch (12:30PM-2PM)' : currentOrder.payment.scheduleType === 'dinner' ? 'Dinner (6:30PM-8PM)' : new Date(currentOrder.payment.customTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        )}

        {currentOrder.notes && currentOrder.notes.trim() && (
          <div style={{ margin: '0 16px 14px 16px', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>📝</span>
            <div>
              <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Rider Instructions</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.4 }}>{currentOrder.notes}</span>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="tracker-progress-track">
          <div className="tracker-progress-fill" style={{ width: `${riderProgress}%`, transition: 'width 1s cubic-bezier(0.25, 0.8, 0.25, 1)' }}></div>
        </div>
        <div className="tracker-status-badge">
          <span className="pulse-dot"></span>
          <span>{currentOrder.status}</span>
        </div>
      </div>

      {/* Elegant minimalist map tracking */}
      <div className="map-section" style={{ background: 'transparent', border: 'none', padding: '10px 0', boxShadow: 'none' }}>
        <div className="tracking-map-container" style={{ background: 'transparent', height: '120px', width: '100%' }}>
          <svg className="map-svg" viewBox="0 0 400 120" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
            {/* Background dashed line */}
            <line x1="50" y1="60" x2="350" y2="60" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 8" />
            
            {/* Active filled line */}
            <line 
              x1="50" 
              y1="60" 
              x2="350" 
              y2="60" 
              stroke="var(--primary)" 
              strokeWidth="4" 
              strokeLinecap="round" 
              style={{
                transform: `scaleX(${riderProgress / 100})`,
                transformOrigin: '50px 60px',
                transition: 'transform 1s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            />
            
            {/* Kitchen Node */}
            <circle cx="50" cy="60" r="10" fill="var(--bg-app)" stroke="var(--text-muted)" strokeWidth="3" />
            <text x="50" y="95" textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--text-muted)">Kitchen</text>

            {/* Destination Node */}
            <circle cx="350" cy="60" r="10" fill="var(--bg-app)" stroke="var(--secondary)" strokeWidth="3" />
            <text x="350" y="95" textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--text-main)">{currentOrder.address?.name || 'Destination'}</text>

            {/* Pulsing Destination Rings (only if near or delivered) */}
            {(currentOrder.statusIndex === 3 || currentOrder.statusIndex === 4) && (
              <g transform="translate(350,60)">
                <circle r="20" fill="rgba(16, 185, 129, 0.15)" className="radar-circle" />
                <circle r="30" fill="rgba(16, 185, 129, 0.08)" className="radar-circle" style={{ animationDelay: '0.5s' }} />
              </g>
            )}

            {/* Moving Rider Pin */}
            {currentOrder.statusIndex >= 1 && currentOrder.statusIndex < 4 && (
              <g 
                transform={`translate(${riderPos.x}, ${riderPos.y})`} 
                className="map-rider-dot"
                style={{
                  transition: 'transform 1s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
              >
                <circle r="16" fill="var(--bg-app)" stroke="var(--primary)" strokeWidth="3" />
                <circle r="8" fill="var(--primary)" />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Delivery Steps Timeline */}
      <div className="timeline-section">
        <h4 className="section-title-sm">Order Progress</h4>
        <div className="timeline-list">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentOrder.statusIndex;
            const isActive = idx === currentOrder.statusIndex;
            
            return (
              <div key={idx} className={`timeline-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                <div className="timeline-connector-container">
                  <div className={`timeline-indicator-dot ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    {isCompleted ? <Check size={10} strokeWidth={3} /> : <div className="dot-inner"></div>}
                  </div>
                  {idx < steps.length - 1 && <div className="timeline-line"></div>}
                </div>
                <div className="timeline-details">
                  <div className="timeline-step-label">{step.label}</div>
                  <div className="timeline-step-desc">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating & Review Form (Only show when Delivered) */}
      {currentOrder.statusIndex === 4 && (
        <div className="timeline-section anim-scale-in" style={{ borderColor: 'var(--secondary)', borderStyle: 'solid', borderWidth: '1.5px' }}>
          <h4 className="section-title-sm" style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <span>🎉</span> Delivered! Share your feedback
          </h4>
          <form onSubmit={handleRatingSubmit} style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '14px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <Star 
                    size={28} 
                    fill={star <= rating ? 'var(--accent)' : 'none'} 
                    color={star <= rating ? 'var(--accent)' : 'var(--text-muted)'} 
                  />
                </button>
              ))}
            </div>
            
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell Chef Olaiya how you enjoyed the warm food... (Optional)"
              style={{
                width: '100%',
                height: '70px',
                fontSize: '0.8rem',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-main)',
                resize: 'none',
                marginBottom: '12px',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-cancel-order"
                onClick={() => {
                  setCurrentOrder(null);
                  setActiveScreen('home');
                }}
                style={{ flex: 1, padding: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-color)' }}
              >
                Skip
              </button>
              <button
                type="submit"
                className="btn-call-rider"
                style={{ flex: 1, background: 'var(--primary)', border: 'none', justifyContent: 'center', padding: '10px', fontSize: '0.78rem', color: 'white' }}
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Call Rider & Cancel actions */}
      <div className="tracker-footer-card">
        <div className="rider-brief-card">
          <div className="rider-avatar">🛵</div>
          <div className="rider-profile">
            <span className="rider-name">Segun Ibadan Express</span>
            <span className="rider-desc">FoodMaxx Delivery Hero</span>
          </div>
          <button className="btn-call-rider" onClick={() => setShowRiderModal(true)}>
            <Phone size={16} fill="currentColor" /> Call
          </button>
        </div>

        {currentOrder.statusIndex <= 1 && (
          <button className="btn-cancel-order" onClick={cancelActiveOrder}>
            Cancel Active Order
          </button>
        )}
      </div>

      {/* Ordered Items Summary */}
      <div className="tracker-items-card" style={{ marginTop: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '16px', border: '1px solid var(--border-color)' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'var(--font-accent)' }}>Active Products</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentOrder.cart.map((food, fIdx) => (
            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <img 
                  src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                  alt={food.name}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                />
                <div>
                  <span><strong style={{ color: 'var(--primary)' }}>{food.quantity}×</strong> {food.name}</span>
                  {food.customizations && food.customizations.length > 0 && (
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '2px' }}>
                      + {typeof food.customizations[0] === 'object' ? food.customizations.map(c => c.name).join(', ') : food.customizations.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontWeight: 600 }}>₦{(food.price * food.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</span>
          <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>₦{currentOrder.total.toLocaleString()}</strong>
        </div>
      </div>

      {/* Mock Rider details popup modal */}
      {showRiderModal && (
        <div className="modal-alert-overlay" onClick={() => setShowRiderModal(false)}>
          <div className="modal-alert-box anim-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="alert-close-btn" onClick={() => setShowRiderModal(false)}>
              <X size={16} />
            </button>
            <span className="alert-emoji">📱</span>
            <h4 className="alert-title">Call Segun (Rider)</h4>
            <p className="alert-desc">You can reach our dispatcher on this hotline to coordinate your delivery.</p>
            <div className="phone-number-box">
              <a href="tel:+234800FOODMAXX" className="tel-link">+234 815 628 3927</a>
            </div>
            <button className="btn-alert-dismiss" onClick={() => setShowRiderModal(false)}>Dismiss</button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .tracker-container {
          padding-bottom: 24px;
        }

        .tracker-status-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }

        .tracker-status-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .status-eta-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-eta-time {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 1.5rem;
          color: var(--text-main);
          margin-top: 2px;
        }

        .tracker-status-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--bg-accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rider-icon-color {
          color: var(--primary);
        }

        .tracker-progress-track {
          height: 6px;
          background: var(--bg-secondary);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .tracker-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary) 30%, var(--secondary) 100%);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .tracker-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--primary);
          background: var(--bg-accent-soft);
          padding: 6px 12px;
          border-radius: var(--radius-xl);
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background: var(--primary);
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        /* Map styling details */
        .map-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 16px;
          margin-bottom: 16px;
        }

        .map-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .map-title {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .map-subtitle-live {
          color: var(--secondary);
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.8px;
        }

        /* Timeline styling */
        .timeline-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 16px;
          margin-bottom: 16px;
        }

        .section-title-sm {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--text-main);
          margin-bottom: 16px;
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
        }

        .timeline-item {
          display: flex;
          gap: 14px;
        }

        .timeline-connector-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .timeline-indicator-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          background: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-white);
          z-index: 10;
        }

        .timeline-indicator-dot.completed {
          background: var(--secondary);
          border-color: var(--secondary);
        }

        .timeline-indicator-dot.active {
          background: var(--bg-accent-soft);
          border-color: var(--primary);
        }

        .dot-inner {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border-color);
        }

        .timeline-indicator-dot.active .dot-inner {
          background: var(--primary);
          animation: pulse 1s infinite;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: var(--border-color);
          min-height: 34px;
          margin: 4px 0;
        }

        .timeline-item.completed .timeline-line {
          background: var(--secondary);
        }

        .timeline-details {
          padding-top: 1px;
        }

        .timeline-step-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .timeline-item.active .timeline-step-label {
          color: var(--primary);
        }

        .timeline-item.completed .timeline-step-label {
          color: var(--text-main);
        }

        .timeline-step-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 2px;
          margin-bottom: 16px;
        }

        /* Footer Brief card */
        .tracker-footer-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rider-brief-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rider-avatar {
          font-size: 1.8rem;
          background: var(--bg-secondary);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rider-profile {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .rider-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .rider-desc {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .btn-call-rider {
          background: var(--secondary);
          color: var(--text-white);
          border-radius: var(--radius-xl);
          padding: 8px 16px;
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.15);
        }

        .btn-call-rider:hover {
          opacity: 0.95;
        }

        .btn-cancel-order {
          background: transparent;
          border: 1.5px solid var(--border-color);
          color: #ef4444;
          font-weight: 700;
          font-size: 0.8rem;
          border-radius: var(--radius-xl);
          padding: 12px;
          text-align: center;
        }

        .btn-cancel-order:hover {
          background: rgba(239, 68, 68, 0.05);
          border-color: #ef4444;
        }

        /* Mock Rider dialog popup */
        .modal-alert-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modal-alert-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          width: 100%;
          max-width: 300px;
          text-align: center;
          position: relative;
          box-shadow: var(--shadow-lg);
        }

        .alert-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          color: var(--text-muted);
        }

        .alert-emoji {
          font-size: 2.2rem;
          margin-bottom: 8px;
          display: inline-block;
        }

        .alert-title {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        .alert-desc {
          font-size: 0.76rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 16px;
        }

        .phone-number-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 10px;
          margin-bottom: 18px;
        }

        .tel-link {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--primary);
          text-decoration: none;
        }

        .btn-alert-dismiss {
          width: 100%;
          background: var(--primary);
          color: var(--text-white);
          padding: 10px;
          border-radius: var(--radius-xl);
          font-weight: 700;
          font-size: 0.8rem;
        }

        .no-active-order {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
        }

        .no-order-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        .btn-back-home {
          background: var(--primary);
          color: var(--text-white);
          padding: 10px 20px;
          border-radius: var(--radius-xl);
          font-weight: 700;
          font-size: 0.8rem;
          margin-top: 16px;
        }
      `}} />
    </div>
  );
}
