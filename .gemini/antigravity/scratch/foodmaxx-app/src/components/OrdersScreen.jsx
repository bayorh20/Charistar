import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import OrderTracker from './OrderTracker';
import { Package, RefreshCw, X, Receipt, CheckCircle2, MapPin, ChevronRight, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersScreen() {
  const {
    orderHistory,
    currentOrder,
    reorderItems,
    setIsCartOpen
  } = useContext(AppContext);

  const hasActiveOrder = currentOrder && currentOrder.statusIndex <= 4;
  const [viewingTracker, setViewingTracker] = useState(hasActiveOrder); 
  const [activeTab, setActiveTab] = useState(hasActiveOrder ? 'ONGOING' : 'DELIVERED');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Automatically show tracker and tab when a new active order is created
  useEffect(() => {
    if (currentOrder && currentOrder.statusIndex <= 4) {
      setViewingTracker(true);
      setActiveTab('ONGOING');
    }
  }, [currentOrder?.id]);

  if (viewingTracker && hasActiveOrder) {
    return (
      <div className="orders-screen-container animate-fade-in">
        <div className="orders-page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="checkout-back-btn" onClick={() => setViewingTracker(false)} aria-label="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h2 className="screen-page-title" style={{ margin: 0 }}>Live Tracking</h2>
            <span className="screen-page-subtitle">🛵 Your order is on the way!</span>
          </div>
        </div>
        <OrderTracker />
      </div>
    );
  }

  return (
    <div className="orders-screen-container" style={{ paddingBottom: '100px' }}>
      
      {/* Page Header */}
      <div className="orders-page-header">
        <h2 className="screen-page-title">My Orders</h2>
        <span className="screen-page-subtitle">
          Track and manage your order history
        </span>
      </div>

      {/* Modern Capsule Tab Switcher */}
      <div className="orders-tabs-container">
        {['ONGOING', 'DELIVERED'].map(tab => {
          const isActive = activeTab === tab;
          return (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`orders-tab-btn ${isActive ? 'active' : ''}`}
            >
              <span>{tab}</span>
              {tab === 'ONGOING' && hasActiveOrder && (
                <span className="ongoing-badge-count">1</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="history-section anim-fade">
        {/* ONGOING TAB */}
        {activeTab === 'ONGOING' && (
          hasActiveOrder ? (
            <div className="history-card active-card">
              <div className="card-ambient-glow"></div>
              <div className="history-card-top">
                <div className="history-id-date">
                  <span className="history-id">Order #{currentOrder.id}</span>
                  <span className="history-date">Active Now</span>
                </div>
                <span className="history-status-active">
                  <span className="pulse-dot"></span>
                  {currentOrder.status}
                </span>
              </div>
              
              {currentOrder.payment?.scheduleType && currentOrder.payment.scheduleType !== 'asap' && (
                <div className="scheduled-indicator">
                  <span className="schedule-icon">🕒</span>
                  <span>Scheduled: {currentOrder.payment.scheduleType === 'lunch' ? 'Lunch (12:30PM-2PM)' : currentOrder.payment.scheduleType === 'dinner' ? 'Dinner (6:30PM-8PM)' : new Date(currentOrder.payment.customTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              )}

              <div className="history-card-body">
                {(currentOrder.cart || currentOrder.items || []).map((food, fIdx) => (
                  <div key={fIdx} className="history-food-line">
                    <img loading="lazy" decoding="async" 
                      src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                      alt={food.name}
                      className="history-food-img"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                    />
                    <div className="history-food-info">
                      <span className="history-food-name"><strong className="quantity-highlight">{food.quantity}×</strong> {food.name}</span>
                      {food.customizations && food.customizations.length > 0 && (
                        <span className="history-food-cust">
                          + {typeof food.customizations[0] === 'object' ? food.customizations.map(c => c.name).join(', ') : food.customizations.join(', ')}
                        </span>
                      )}
                    </div>
                    <span className="history-food-price">₦{(food.price * food.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {currentOrder.address && (
                  <div className="delivery-address-row">
                    <MapPin size={12} className="map-pin-icon" />
                    <span>{currentOrder.address.name}</span>
                  </div>
                )}
              </div>

              <div className="history-card-footer">
                <div className="total-group">
                  <span className="total-label">Total Paid</span>
                  <strong className="total-amount">
                    ₦{currentOrder.total.toLocaleString()}
                  </strong>
                </div>
                <button
                  className="btn-track-delivery"
                  onClick={() => setViewingTracker(true)}
                >
                  <span className="btn-icon">⚡</span>
                  <span>Track Live</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-orders-view anim-scale-in">
              <div className="empty-state-icon-box">
                <Package size={38} className="empty-state-icon" />
              </div>
              <h4 className="empty-state-title">No Ongoing Orders</h4>
              <p className="empty-state-desc">
                You don't have any active deliveries right now. Browse our menu to satisfy your cravings!
              </p>
            </div>
          )
        )}

        {/* DELIVERED TAB */}
        {activeTab === 'DELIVERED' && (() => {
          const deliveredOrders = orderHistory.filter(o => o.status === 'Delivered' || o.status === 'Cancelled' || o.statusIndex >= 4);
          return deliveredOrders.length > 0 ? (
            <div className="history-list">
              {deliveredOrders.map((order, idx) => {
                const orderItems = order.cart || order.items || [];
                const isCancelled = order.status === 'Cancelled';
                return (
                  <div 
                    key={order.id || idx} 
                    className="history-card completed-card" 
                    onClick={() => setSelectedReceipt(order)}
                  >
                    <div className="history-card-top">
                      <div className="history-id-date">
                        <span className="history-id">Order #{order.id}</span>
                        <span className="history-date">{order.date || 'Completed'}</span>
                      </div>
                      <span className={`history-status-badge ${isCancelled ? 'cancelled' : 'delivered'}`}>
                        {isCancelled ? '✗ Cancelled' : '✓ Delivered'}
                      </span>
                    </div>
                    
                    <div className="history-card-body">
                      {orderItems.slice(0, 3).map((food, fIdx) => (
                        <div key={fIdx} className="history-food-line compact">
                          <img loading="lazy" decoding="async" 
                            src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                            alt={food.name}
                            className="history-food-img compact"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                          />
                          <div className="history-food-info">
                            <span className="history-food-name compact">{food.quantity}x {food.name}</span>
                          </div>
                        </div>
                      ))}
                      {orderItems.length > 3 && (
                        <div className="more-items-row">
                          <span>+{orderItems.length - 3} more delicious items</span>
                        </div>
                      )}
                    </div>

                    <div className="history-card-footer">
                      <div className="total-group">
                        <span className="total-label">Total Paid</span>
                        <strong className="total-amount price-highlight">
                          ₦{(order.total || 0).toLocaleString()}
                        </strong>
                      </div>
                      <div className="card-actions-row">
                        <button
                          className="btn-reorder-compact"
                          onClick={(e) => {
                            e.stopPropagation();
                            reorderItems(orderItems);
                            setIsCartOpen(true);
                          }}
                        >
                          <RefreshCw size={12} />
                          <span>Reorder</span>
                        </button>
                        <span className="receipt-view-hint">
                          Receipt <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-orders-view anim-scale-in">
              <div className="empty-state-icon-box">
                <Receipt size={38} className="empty-state-icon" />
              </div>
              <h4 className="empty-state-title">No Order History</h4>
              <p className="empty-state-desc">
                Your completed orders, digital receipts, and checkout logs will appear here.
              </p>
            </div>
          );
        })()}
      </div>

      {/* Realistic Serrated-Edge Paper Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="receipt-overlay"
            onClick={() => setSelectedReceipt(null)}
          >
            <motion.div 
              initial={{ scale: 0.92, y: 30 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              className="receipt-modal-card"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="receipt-close-btn"
                aria-label="Close receipt"
              >
                <X size={16} />
              </button>

              <div className="receipt-paper">
                {/* Status Indicator circle */}
                <div className="receipt-success-ring">
                  <CheckCircle2 size={24} color="#10B981" />
                </div>
                <h3 className="receipt-brand">FoodMaxx Receipt</h3>
                <p className="receipt-order-info">Order ID: {selectedReceipt.id}</p>
                <p className="receipt-date-info">{selectedReceipt.date || 'Verified Checkout'}</p>

                <div className="receipt-divider"></div>

                <div className="receipt-items-list">
                  {(selectedReceipt.cart || selectedReceipt.items || []).map((item, i) => (
                    <div key={i} className="receipt-item-row">
                      <img loading="lazy" decoding="async" 
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                        alt={item.name}
                        className="receipt-item-img"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                      />
                      <div className="receipt-item-details">
                        <span className="receipt-item-name">{item.quantity}x {item.name}</span>
                        {item.customizations && item.customizations.length > 0 && (
                          <span className="receipt-item-cust">
                            + {typeof item.customizations[0] === 'object' ? item.customizations.map(c => c.name).join(', ') : item.customizations.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="receipt-item-price">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-summary-totals">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₦{(selectedReceipt.cart || selectedReceipt.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}</span>
                  </div>
                  {selectedReceipt.discount > 0 && (
                    <div className="summary-row discount-row">
                      <span>Discount Coupon</span>
                      <span>-₦{selectedReceipt.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Service Charge</span>
                    <span>₦200</span>
                  </div>
                </div>

                <div className="receipt-divider bold"></div>

                <div className="receipt-grand-total">
                  <span>Amount Paid</span>
                  <span className="grand-amount">₦{(selectedReceipt.total || 0).toLocaleString()}</span>
                </div>
                
                {selectedReceipt.payment?.method && (
                  <div className="receipt-payment-meta">
                    <span>Paid via {selectedReceipt.payment.method}</span>
                  </div>
                )}
              </div>

              <div className="receipt-action-box">
                <button 
                  onClick={() => { 
                    reorderItems(selectedReceipt.cart || selectedReceipt.items || []); 
                    setIsCartOpen(true); 
                    setSelectedReceipt(null); 
                  }}
                  className="receipt-btn-reorder"
                >
                  <RefreshCw size={14} />
                  <span>Reorder items</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .orders-screen-container {
          padding: 16px;
        }

        .orders-page-header {
          margin-bottom: 20px;
        }

        /* Capsule Tab switcher styling */
        .orders-tabs-container {
          display: flex;
          background: rgba(0, 0, 0, 0.04);
          padding: 4px;
          border-radius: var(--radius-xl);
          margin-bottom: 24px;
          border: 1px solid rgba(0, 0, 0, 0.02);
        }
        .dark-mode .orders-tabs-container {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .orders-tab-btn {
          flex: 1;
          padding: 10px 0;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
          border-radius: var(--radius-lg);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .orders-tab-btn.active {
          background: var(--text-main);
          color: var(--bg-card);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .ongoing-badge-count {
          background: var(--primary);
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 0.65rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        /* Order Cards Styling */
        .history-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 18px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .active-card {
          border-color: var(--primary);
          box-shadow: 0 8px 30px rgba(234, 88, 12, 0.06);
        }

        .card-ambient-glow {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
          pointer-events: none;
        }

        .completed-card {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
        }

        .completed-card:hover {
          border-color: rgba(255, 91, 38, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
        }

        .history-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1.5px dashed var(--border-color);
          padding-bottom: 12px;
          margin-bottom: 14px;
        }

        .history-id {
          font-family: var(--font-accent);
          font-weight: 900;
          font-size: 0.88rem;
          color: var(--text-main);
          letter-spacing: -0.2px;
        }

        .history-date {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 700;
          margin-top: 2px;
          display: block;
        }

        .history-status-active {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--primary);
          font-size: 0.72rem;
          font-weight: 900;
          background: var(--bg-accent-soft);
          padding: 5px 10px;
          border-radius: var(--radius-xl);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .history-status-badge {
          font-size: 0.7rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: var(--radius-xl);
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        .history-status-badge.delivered {
          background: rgba(16, 185, 129, 0.08);
          color: var(--secondary);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }

        .history-status-badge.cancelled {
          background: rgba(239, 68, 68, 0.08);
          color: #EF4444;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .scheduled-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--primary);
          font-weight: 800;
          margin-bottom: 12px;
          background: var(--bg-accent-soft);
          padding: 6px 12px;
          border-radius: var(--radius-md);
          width: fit-content;
        }

        .history-card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 14px;
        }

        .history-food-line {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .history-food-img {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .history-food-img.compact {
          width: 26px;
          height: 26px;
          border-radius: 8px;
        }

        .history-food-info {
          flex: 1;
          text-align: left;
          min-width: 0;
        }

        .history-food-name {
          font-size: 0.8rem;
          font-weight: 750;
          color: var(--text-main);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .history-food-name.compact {
          font-size: 0.76rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .quantity-highlight {
          color: var(--primary);
          font-weight: 900;
        }

        .history-food-cust {
          display: block;
          font-size: 0.66rem;
          color: var(--primary);
          font-weight: 800;
          margin-top: 1px;
          line-height: 1.2;
        }

        .history-food-price {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .delivery-address-row {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
        }
        .map-pin-icon {
          color: var(--text-muted);
        }

        .more-items-row {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 800;
          padding-left: 38px;
          text-align: left;
        }

        .history-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 12px;
          margin-top: 6px;
        }

        .total-group {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .total-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }

        .total-amount {
          font-family: var(--font-accent);
          color: var(--text-main);
          font-size: 1.05rem;
          font-weight: 900;
          letter-spacing: -0.2px;
          margin-top: 1px;
        }

        .total-amount.price-highlight {
          color: var(--primary);
        }

        .card-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .receipt-view-hint {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 2px;
        }

        /* Buttons Styling */
        .btn-track-delivery {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--primary);
          color: white;
          border: none;
          font-size: 0.76rem;
          font-weight: 900;
          padding: 10px 18px;
          border-radius: var(--radius-xl);
          transition: all 0.25s;
          box-shadow: 0 4px 12px var(--primary-glow);
          cursor: pointer;
        }

        .btn-track-delivery:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .btn-reorder-compact {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--text-main);
          color: var(--bg-card);
          border: none;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 8px 14px;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-reorder-compact:hover {
          opacity: 0.95;
          transform: scale(1.02);
        }

        /* Empty states styling */
        .empty-orders-view {
          text-align: center;
          padding: 48px 24px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 30px;
          margin-top: 12px;
        }

        .empty-state-icon-box {
          width: 64px;
          height: 64px;
          background: var(--bg-secondary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .empty-state-icon {
          color: var(--text-muted);
          opacity: 0.8;
        }

        .empty-state-title {
          font-family: var(--font-accent);
          font-weight: 900;
          font-size: 1.05rem;
          color: var(--text-main);
          margin: 0 0 6px 0;
        }

        .empty-state-desc {
          font-size: 0.76rem;
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 220px;
          margin: 0 auto;
        }

        .screen-page-title {
          font-family: var(--font-accent);
          font-weight: 950;
          font-size: 1.6rem;
          color: var(--text-main);
          margin: 0 0 2px 0;
          letter-spacing: -0.4px;
        }

        .screen-page-subtitle {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 700;
        }

        /* Serrated-Edge Paper Receipt Overlay and Modal */
        .receipt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .receipt-modal-card {
          width: 100%;
          max-width: 330px;
          position: relative;
          display: flex;
          flex-direction: column;
          filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.25));
        }

        .receipt-close-btn {
          position: absolute;
          top: -42px;
          right: 0;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
          z-index: 10002;
        }
        .receipt-close-btn:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.05);
        }

        .receipt-paper {
          background: white;
          border-radius: 24px 24px 0 0;
          position: relative;
          padding: 24px 24px 28px 24px;
          border: 1.5px solid #E0E0E0;
          border-bottom: none;
          color: #2D3748;
          text-align: center;
        }
        
        .dark-mode .receipt-paper {
          background: #FFFFFF; /* E-receipt looks like a white cash register receipt even in dark mode for realism! */
          color: #2D3748;
          border-color: #E0E0E0;
        }

        /* Jagged triangle serrated border effect */
        .receipt-paper::after {
          content: '';
          position: absolute;
          left: -1.5px;
          right: -1.5px;
          bottom: -11px;
          height: 12px;
          background-image: 
            linear-gradient(-45deg, white 6px, transparent 0), 
            linear-gradient(45deg, white 6px, transparent 0),
            linear-gradient(-45deg, #E0E0E0 7.5px, transparent 0),
            linear-gradient(45deg, #E0E0E0 7.5px, transparent 0);
          background-position: left top;
          background-repeat: repeat-x;
          background-size: 12px 12px;
          z-index: 10;
        }

        .receipt-success-ring {
          width: 48px;
          height: 48px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .receipt-brand {
          font-family: var(--font-accent);
          font-weight: 900;
          font-size: 1.15rem;
          color: #1A202C;
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .receipt-order-info {
          margin: 0;
          font-size: 0.72rem;
          color: #718096;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 0.2px;
        }

        .receipt-date-info {
          margin: 2px 0 0 0;
          font-size: 0.68rem;
          color: #A0AEC0;
          font-weight: 700;
        }

        .receipt-divider {
          border-top: 1.5px dashed #E2E8F0;
          margin: 16px 0;
        }
        .receipt-divider.bold {
          border-top: 2px dashed #718096;
        }

        .receipt-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .receipt-item-row {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
        }

        .receipt-item-img {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid #E2E8F0;
        }

        .receipt-item-details {
          flex: 1;
          min-width: 0;
        }

        .receipt-item-name {
          color: #1A202C;
          font-weight: 700;
          font-size: 0.78rem;
          display: block;
        }

        .receipt-item-cust {
          display: block;
          font-size: 0.64rem;
          color: var(--primary);
          font-weight: 800;
          margin-top: 1px;
          line-height: 1.2;
        }

        .receipt-item-price {
          color: #2D3748;
          font-weight: 800;
          font-size: 0.78rem;
        }

        .receipt-summary-totals {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.74rem;
          color: #718096;
          font-weight: 700;
        }

        .discount-row {
          color: #E53E3E;
        }

        .receipt-grand-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          color: #1A202C;
          font-weight: 800;
          font-size: 0.82rem;
        }

        .grand-amount {
          color: var(--primary);
          font-size: 1.15rem;
          font-family: var(--font-accent);
          font-weight: 950;
        }

        .receipt-payment-meta {
          font-size: 0.65rem;
          color: #A0AEC0;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 12px;
          letter-spacing: 0.4px;
        }

        /* Reorder box below receipt tear-off */
        .receipt-action-box {
          margin-top: 12px;
          z-index: 5;
        }

        .receipt-btn-reorder {
          width: 100%;
          padding: 13px;
          border-radius: 16px;
          border: none;
          background: white;
          color: #1A1A1A;
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          transition: all 0.2s;
        }
        .receipt-btn-reorder:hover {
          transform: scale(1.02);
        }
      `}} />
    </div>
  );
}
