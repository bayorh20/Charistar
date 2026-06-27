import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import OrderTracker from './OrderTracker';
import { Package, RefreshCw, X, Receipt, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersScreen() {
  const {
    orderHistory,
    currentOrder,
    reorderItems,
    setIsCartOpen
  } = useContext(AppContext);

  const hasActiveOrder = currentOrder && currentOrder.statusIndex <= 4;
  const [viewingTracker, setViewingTracker] = useState(hasActiveOrder); // Default to tracker if they just placed an order
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
      <div className="orders-screen-container">
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
          Track and manage your history
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        {['ONGOING', 'DELIVERED'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: '12px',
              background: activeTab === tab ? 'var(--text-main)' : 'transparent',
              color: activeTab === tab ? 'var(--bg-card)' : 'var(--text-muted)',
              fontSize: '13px', fontWeight: '800', transition: '0.2s', cursor: 'pointer'
            }}
          >
            {tab} {tab === 'ONGOING' && hasActiveOrder && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', marginLeft: '4px' }}>1</span>}
          </button>
        ))}
      </div>

      <div className="history-section anim-fade">
        {/* ONGOING TAB */}
        {activeTab === 'ONGOING' && (
          hasActiveOrder ? (
            <div className="history-card" style={{ borderColor: 'var(--primary)', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)' }}>
              <div className="history-card-top">
                <div className="history-id-date">
                  <span className="history-id">{currentOrder.id}</span>
                  <span className="history-date">Today</span>
                </div>
                <span className="history-status-active" style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(234,88,12,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  <span className="pulse-dot" style={{ display: 'inline-block', width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', marginRight: '4px', animation: 'pulse 1.5s infinite' }}></span>
                  {currentOrder.status}
                </span>
              </div>
              
              {currentOrder.payment?.scheduleType && currentOrder.payment.scheduleType !== 'asap' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 'bold' }}>
                  🕒 Scheduled for: {currentOrder.payment.scheduleType === 'lunch' ? 'Lunch (12:30PM-2PM)' : currentOrder.payment.scheduleType === 'dinner' ? 'Dinner (6:30PM-8PM)' : new Date(currentOrder.payment.customTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              )}

              <div className="history-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {(currentOrder.cart || currentOrder.items || []).map((food, fIdx) => (
                  <div key={fIdx} className="history-food-line" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                      alt={food.name}
                      style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                    />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '750', color: 'var(--text-main)' }}>{food.quantity}× {food.name}</span>
                      {food.customizations && food.customizations.length > 0 && (
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '2px' }}>
                          + {typeof food.customizations[0] === 'object' ? food.customizations.map(c => c.name).join(', ') : food.customizations.join(', ')}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800' }}>₦{(food.price * food.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {currentOrder.address && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={11} /> {currentOrder.address.name}
                  </div>
                )}
              </div>

              <div className="history-card-footer">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Total Paid</span>
                  <strong style={{ fontFamily: 'var(--font-accent)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 900 }}>
                    ₦{currentOrder.total.toLocaleString()}
                  </strong>
                </div>
                <button
                  className="btn-reorder"
                  style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                  onClick={() => setViewingTracker(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><circle cx="12" cy="12" r="10"/><path d="m12 16 4-4-4-4"/><path d="M8 12h8"/></svg>
                  Track Delivery
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-orders-view anim-scale-in">
              <div className="empty-state-svg-container">
                <Package size={48} color="var(--border-color)" />
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem', fontFamily: 'var(--font-accent)', marginTop: '12px' }}>
                No Ongoing Orders
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '220px', margin: '8px auto 0', lineHeight: 1.5 }}>
                You don't have any active deliveries right now.
              </p>
            </div>
          )
        )}

        {/* DELIVERED TAB */}
        {activeTab === 'DELIVERED' && (() => {
          const deliveredOrders = orderHistory.filter(o => o.status === 'Delivered' || o.status === 'Cancelled' || o.statusIndex >= 4);
          return deliveredOrders.length > 0 ? (
            <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {deliveredOrders.map((order, idx) => {
                const orderItems = order.cart || order.items || [];
                return (
                  <div key={order.id || idx} className="history-card" onClick={() => setSelectedReceipt(order)} style={{ cursor: 'pointer' }}>
                    <div className="history-card-top">
                      <div className="history-id-date">
                        <span className="history-id">{order.id}</span>
                        <span className="history-date">{order.date || 'Completed'}</span>
                      </div>
                      <span className="history-status-delivered" style={{
                        background: order.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: order.status === 'Cancelled' ? '#EF4444' : 'var(--secondary)',
                        border: order.status === 'Cancelled' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        {order.status === 'Cancelled' ? '✗ Cancelled' : '✓ Delivered'}
                      </span>
                    </div>
                    
                    <div className="history-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                      {orderItems.slice(0, 3).map((food, fIdx) => (
                        <div key={fIdx} className="history-food-line" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                            alt={food.name}
                            style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                          />
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)' }}>{food.quantity}× {food.name}</span>
                          </div>
                        </div>
                      ))}
                      {orderItems.length > 3 && (
                        <div className="history-food-line" style={{ paddingLeft: '38px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>+{orderItems.length - 3} more items</span>
                        </div>
                      )}
                    </div>

                    <div className="history-card-footer">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Total Paid</span>
                        <strong style={{ fontFamily: 'var(--font-accent)', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 900 }}>
                          ₦{(order.total || 0).toLocaleString()}
                        </strong>
                      </div>
                      <button
                        className="btn-reorder"
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderItems(orderItems);
                          setIsCartOpen(true);
                        }}
                      >
                        <RefreshCw size={13} />
                        Reorder
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-orders-view anim-scale-in">
              <div className="empty-state-svg-container">
                <Receipt size={48} color="var(--border-color)" />
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem', fontFamily: 'var(--font-accent)', marginTop: '12px' }}>
                No Delivered Orders
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '220px', margin: '8px auto 0', lineHeight: 1.5 }}>
                Your completed orders and receipts will appear here.
              </p>
            </div>
          )
        })()}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setSelectedReceipt(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', borderRadius: '24px', width: '100%', maxWidth: '340px', padding: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', position: 'relative', border: '1px solid var(--border-color)' }}
            >
              <button onClick={() => setSelectedReceipt(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckCircle2 size={24} color="#10B981" />
                </div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: 'var(--text-main)' }}>E-Receipt</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Order {selectedReceipt.id} • {selectedReceipt.date}</p>
              </div>
 
              <div style={{ borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)', padding: '16px 0', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(selectedReceipt.cart || selectedReceipt.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                      src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'} 
                      alt={item.name}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'; }}
                    />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '13px' }}>{item.quantity}x {item.name}</span>
                      {item.customizations && item.customizations.length > 0 && (
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '2px' }}>
                          + {typeof item.customizations[0] === 'object' ? item.customizations.map(c => c.name).join(', ') : item.customizations.join(', ')}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '13px' }}>₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
 
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>Total Paid</span>
                <span style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: '900' }}>₦{(selectedReceipt.total || 0).toLocaleString()}</span>
              </div>
 
              <button 
                onClick={() => { reorderItems(selectedReceipt.cart || selectedReceipt.items || []); setIsCartOpen(true); setSelectedReceipt(null); }}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--text-main)', color: 'var(--bg-card)', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <RefreshCw size={16} /> Reorder These Items
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .orders-page-header {
          margin-bottom: 16px;
        }

        .history-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 14px;
          transition: all 0.2s;
        }

        .history-card:hover {
          border-color: rgba(255, 104, 51, 0.2);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .history-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1.5px dashed var(--border-color);
          padding-bottom: 10px;
          margin-bottom: 10px;
        }

        .history-id-date { display: flex; flex-direction: column; }
        .history-id {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 0.82rem;
          color: var(--text-main);
        }
        .history-date {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-top: 2px;
        }

        .history-status-delivered {
          background: rgba(16, 185, 129, 0.1);
          color: var(--secondary);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .history-food-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .history-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-color);
          padding-top: 10px;
        }

        .btn-reorder {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--primary);
          color: #fff;
          font-size: 0.74rem;
          font-weight: 800;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          transition: all 0.2s;
          box-shadow: 0 2px 8px var(--primary-glow);
        }

        .btn-reorder:hover { background: var(--primary-hover); transform: translateY(-1px); }

        .empty-orders-view {
          text-align: center;
          padding: 40px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          margin-top: 8px;
        }

        .screen-page-title {
          font-family: var(--font-accent);
          font-weight: 900;
          font-size: 1.5rem;
          color: var(--text-main);
          margin: 0 0 2px 0;
        }

        .screen-page-subtitle {
          font-size: 0.76rem;
          color: var(--text-muted);
          font-weight: 600;
        }
      `}} />
    </div>
  );
}
