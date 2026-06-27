import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Trash2, Plus, Minus, Ticket, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playPop, playTick } from '../utils/sound';

export default function CartDrawer({ isOpen, onClose }) {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartTotalItems,
    setActiveScreen,
    soundEnabled,
    unlockedPerks,
    marketingConfig
  } = useContext(AppContext);

  const [voucherCode, setVoucherCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  // We removed `if (!isOpen) return null;` so AnimatePresence can handle unmounting.

  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      setVoucherError('Please enter a voucher code');
      return;
    }
    // Look up coupon from Firestore-managed marketing config
    const coupons = marketingConfig?.coupons || {};
    const coupon = coupons[code];
    if (coupon && coupon.active) {
      const discount = coupon.discountPercent || 10;
      setDiscountPercent(discount);
      setVoucherSuccess(`${discount}% Discount applied! 🎉`);
      setVoucherError('');
      playTick(soundEnabled);
    } else {
      setVoucherError('Invalid or expired voucher code.');
      setVoucherSuccess('');
    }
  };

  const handleCheckoutClick = () => {
    onClose();
    setActiveScreen('checkout');
    playTick(soundEnabled);
  };

  const hasUnlockedDiscount = unlockedPerks.includes('ten_percent_off');
  const effectiveDiscountPercent = hasUnlockedDiscount ? Math.max(discountPercent, 10) : discountPercent;

  const subtotal = cartSubtotal;
  const serviceCharge = subtotal > 0 ? 200 : 0;
  const discountAmount = Math.round(subtotal * (effectiveDiscountPercent / 100));
  const total = Math.max(0, subtotal + serviceCharge - discountAmount);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="drawer-overlay" 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
        >
          <motion.div 
            className="drawer-sheet cart-drawer-sheet" 
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, rotateY: 90, z: -150, x: "100%", scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0, z: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: 90, z: -150, x: "100%", scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            style={{ transformOrigin: "right center", transformStyle: "preserve-3d" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x > 120 || velocity.x > 400) {
                onClose();
              }
            }}
          >
            <div className="drawer-drag-handle"></div>

        {/* Header */}
        <div className="drawer-header">
          <div className="cart-title-row">
            <h3 className="drawer-title">Your Cart</h3>
            <span className="cart-qty-badge">{cartTotalItems} Items</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content cart-drawer-content">
          {cart.length > 0 ? (
            <>
              {/* Cart Items List */}
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div key={item.uniqueId} className="cart-item-card anim-scale-in">
                    <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="cart-item-thumb" />
                    
                    <div className="cart-item-details">
                      <div className="cart-item-meta-top">
                        <span className="cart-item-name">{item.name}</span>
                        <button
                          className="cart-item-delete"
                          onClick={() => removeFromCart(item.uniqueId)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Customizations display */}
                      {item.customizations?.length > 0 && (
                        <div className="cart-item-customizations">
                          {item.customizations.map((c, idx) => (
                            <span key={idx} className="cart-custom-pill">
                              {c.name} {c.price > 0 && `(+₦${c.price})`}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="cart-item-price-quantity">
                        <span className="cart-item-price">₦{(item.price * item.quantity).toLocaleString()}</span>
                        
                        {/* Quantity picker */}
                        <div className="qty-picker compact">
                          <button
                            className="qty-btn"
                            onClick={() => updateCartQuantity(item.uniqueId, item.quantity - 1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => updateCartQuantity(item.uniqueId, item.quantity + 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code Section */}
              <div className="promo-section">
                <div className="promo-input-group">
                  <Ticket size={16} className="promo-icon" />
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="promo-input"
                  />
                  <button className="btn-promo-apply" onClick={handleApplyVoucher}>
                    Apply
                  </button>
                </div>
                {voucherError && <div className="promo-error-msg">{voucherError}</div>}
                {voucherSuccess && (
                  <div className="promo-success-msg">
                    <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {voucherSuccess}
                  </div>
                )}
              </div>

              {/* Summary Calculations */}
              <div className="cart-summary-card">
                <div className="summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Delivery Fee</span>
                  <span className="summary-value success-text">FREE</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Service Charge</span>
                  <span className="summary-value">₦{serviceCharge.toLocaleString()}</span>
                </div>
                 {discountAmount > 0 && (
                   <div className="summary-row discount">
                     <span className="summary-label">Promo Discount ({effectiveDiscountPercent}%)</span>
                     <span className="summary-value">-₦{discountAmount.toLocaleString()}</span>
                   </div>
                 )}
                 {hasUnlockedDiscount && discountPercent < 10 && (
                   <div className="promo-success-msg" style={{ margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem' }}>
                     <Sparkles size={10} />
                     <span>10% Loyalty Reward Applied Automatically</span>
                   </div>
                 )}
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span className="summary-label-total">Total</span>
                  <span className="summary-value-total">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-cart-view anim-scale-in">
              <div className="empty-state-svg-container">
                <svg viewBox="0 0 100 100" width="80" height="80" className="empty-state-svg-anim">
                  {/* Floating particles */}
                  <circle cx="20" cy="30" r="2" fill="var(--primary)" opacity="0.5" className="empty-state-steam" />
                  <circle cx="80" cy="25" r="3" fill="var(--primary)" opacity="0.3" className="empty-state-steam" />
                  <circle cx="50" cy="15" r="1.5" fill="var(--primary)" opacity="0.4" className="empty-state-steam" />
                  
                  {/* Cart container outlines */}
                  <path d="M20,40 L30,40 L45,75 L80,75 L90,48 L32,48" stroke="var(--text-muted)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="48" cy="84" r="5.5" fill="var(--text-muted)" />
                  <circle cx="77" cy="84" r="5.5" fill="var(--text-muted)" />
                  
                  {/* Heart badge floating out of cart */}
                  <path d="M55,38 C52,35 48,35 46,38 C44,35 40,35 37,38 C35,41 37,45 46,51 C55,45 57,41 55,38 Z" fill="var(--primary)" className="empty-state-steam" />
                </svg>
              </div>
              <h4 className="empty-cart-title">Your Cart is Empty</h4>
              <p className="empty-cart-text" style={{ marginBottom: '18px' }}>Add some delicious meals to get started with your orders</p>
              <button className="btn-promo-apply" onClick={onClose} style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 800 }}>
                Explore Menu ➔
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="drawer-footer-actions">
            <button className="btn-checkout-primary" onClick={handleCheckoutClick}>
              <span>Proceed to Checkout</span>
              <span className="checkout-total-badge">₦{total.toLocaleString()}</span>
            </button>
          </div>
        )}

      <style dangerouslySetInnerHTML={{ __html: `
        .profile-panel-sheet {
          max-height: 92vh;
          max-height: 92dvh;
        }

        .cart-drawer-sheet {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          margin: 10px;
          margin-bottom: calc(86px + env(safe-area-inset-bottom, 0px));
          max-height: calc(88vh - 96px - env(safe-area-inset-bottom, 0px));
          max-height: calc(88dvh - 96px - env(safe-area-inset-bottom, 0px));
        }

        .cart-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cart-qty-badge {
          background: var(--primary-glow);
          color: var(--primary);
          font-size: 0.7rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: var(--radius-xs);
        }

        .cart-drawer-content {
          padding: 16px;
        }

        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .cart-item-card {
          display: flex;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px;
          gap: 12px;
          align-items: center;
        }

        .cart-item-thumb {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }

        .cart-item-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .cart-item-meta-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .cart-item-name {
          font-size: 0.84rem;
          font-weight: 700;
          color: var(--text-main);
          max-width: 170px;
          line-height: 1.25;
        }

        .cart-item-delete {
          color: var(--text-muted);
          padding: 2px;
        }

        .cart-item-delete:hover {
          color: #ef4444;
        }

        .cart-item-customizations {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin: 6px 0;
        }

        .cart-custom-pill {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          font-size: 0.65rem;
          color: var(--text-muted);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .cart-item-price-quantity {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }

        .cart-item-price {
          font-family: var(--font-accent);
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        .qty-picker.compact {
          padding: 2px;
        }

        .qty-picker.compact .qty-btn {
          width: 24px;
          height: 24px;
        }

        .qty-picker.compact .qty-value {
          width: 20px;
          font-size: 0.8rem;
        }

        /* Promo section */
        .promo-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px;
          margin-bottom: 20px;
        }

        .promo-input-group {
          display: flex;
          align-items: center;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 6px 10px;
        }

        .promo-icon {
          color: var(--text-muted);
          margin-right: 6px;
        }

        .promo-input {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 600;
          background: transparent;
          color: var(--text-main);
          text-transform: uppercase;
        }

        .promo-input::placeholder {
          text-transform: none;
        }

        .btn-promo-apply {
          background: var(--primary);
          color: var(--text-white);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 4px;
        }

        .promo-error-msg {
          color: #ef4444;
          font-size: 0.7rem;
          font-weight: 700;
          margin-top: 6px;
          padding-left: 4px;
        }

        .promo-success-msg {
          color: var(--secondary);
          font-size: 0.7rem;
          font-weight: 700;
          margin-top: 6px;
          padding-left: 4px;
        }

        /* Calculation card */
        .cart-summary-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .summary-row.discount {
          color: var(--secondary);
        }

        .summary-value {
          color: var(--text-main);
          font-weight: 700;
        }

        .success-text {
          color: var(--secondary);
          font-weight: 800;
        }

        .summary-divider {
          height: 1px;
          background: var(--border-color);
          margin: 4px 0;
        }

        .summary-row.total {
          color: var(--text-main);
          font-size: 0.95rem;
        }

        .summary-label-total {
          font-weight: 800;
          font-family: var(--font-accent);
        }

        .summary-value-total {
          font-family: var(--font-accent);
          font-weight: 900;
          color: var(--primary);
        }

        /* Empty Cart */
        .empty-cart-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 10px;
        }

        .empty-cart-emoji {
          font-size: 3rem;
          margin-bottom: 12px;
          animation: float 3s infinite;
        }

        .empty-cart-title {
          font-family: var(--font-accent);
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .empty-cart-text {
          font-size: 0.8rem;
          color: var(--text-muted);
          max-width: 220px;
          line-height: 1.4;
        }

        /* Footer Checkout Bar */
        .drawer-footer-actions {
          padding: 14px 16px 24px 16px;
          border-top: 1px solid var(--border-color);
          background: var(--bg-card);
        }

        .btn-checkout-primary {
          width: 100%;
          background: var(--primary);
          color: var(--text-white);
          border-radius: var(--radius-xl);
          padding: 16px 20px;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 14px var(--primary-glow);
        }

        .btn-checkout-primary:hover {
          background: var(--primary-hover);
        }

        .checkout-total-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 800;
        }
      `}} />
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
  );
}
