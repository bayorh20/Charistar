import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Heart, Minus, Plus, Star, Flame, Clock, Check } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { playPop, playTick } from '../utils/sound';

function RollingDigit({ digit }) {
  return (
    <span className="rolling-digit-viewport">
      <span 
        className="rolling-digit-strip" 
        style={{ transform: `translateY(-${digit * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="digit-val">{n}</span>
        ))}
      </span>
    </span>
  );
}

function RollingTimer({ seconds }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  const m1 = Math.floor(mins / 10);
  const m2 = mins % 10;
  const s1 = Math.floor(secs / 10);
  const s2 = secs % 10;

  return (
    <span className="rolling-timer-container">
      <RollingDigit digit={m1} />
      <RollingDigit digit={m2} />
      <span className="timer-separator">:</span>
      <RollingDigit digit={s1} />
      <RollingDigit digit={s2} />
    </span>
  );
}

export default function ProductModal() {
  const { customizingItem, setCustomizingItem, addToCart, soundEnabled, favorites, toggleFavorite } = useContext(AppContext);
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAddedSuccessfully, setIsAddedSuccessfully] = useState(false);

  const [lunchTimeLeft, setLunchTimeLeft] = useState(0);
  const [dinnerTimeLeft, setDinnerTimeLeft] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    const calculateDeadlines = () => {
      const now = new Date();
      
      const lunchDeadline = new Date(now);
      lunchDeadline.setHours(10, 0, 0, 0);
      
      const dinnerDeadline = new Date(now);
      dinnerDeadline.setHours(14, 0, 0, 0);

      const nowMs = now.getTime();

      if (nowMs < lunchDeadline.getTime()) {
        setLunchTimeLeft(Math.floor((lunchDeadline.getTime() - nowMs) / 1000));
      } else {
        setLunchTimeLeft(0);
      }

      if (nowMs < dinnerDeadline.getTime()) {
        setDinnerTimeLeft(Math.floor((dinnerDeadline.getTime() - nowMs) / 1000));
      } else {
        setDinnerTimeLeft(0);
      }
    };

    calculateDeadlines();
    const interval = setInterval(calculateDeadlines, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return 'Closed';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const contentRef = React.useRef(null);
  const errorTimeoutRef = React.useRef(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  const showErrorToast = (msg) => {
    setErrorMsg(msg);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMsg('');
    }, 4000);
    
    // Smooth scroll to top of details card
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Synchronized countdown timer for urgency
  const [timeLeft, setTimeLeft] = useState(() => 600 - (Math.floor(Date.now() / 1000) % 600));
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(600 - (Math.floor(Date.now() / 1000) % 600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset selections when customizing item changes
  useEffect(() => {
    if (customizingItem) {
      const initial = {};
      customizingItem.options?.forEach(opt => {
        if (opt.type === 'single') {
          initial[opt.title] = [opt.items[0]];
        } else {
          initial[opt.title] = [];
        }
      });
      setSelections(initial);
      setQuantity(1);
      setIsDescExpanded(false);
      setErrorMsg('');
      setIsAddedSuccessfully(false);
    }
  }, [customizingItem]);

  // We removed `if (!customizingItem) return null;` so AnimatePresence can handle unmounting.

  const handleSingleSelect = (optionTitle, item) => {
    setSelections(prev => ({
      ...prev,
      [optionTitle]: [item]
    }));
    playTick(soundEnabled);
  };

  const handleMultipleSelect = (optionTitle, optionItem, optionLimit) => {
    setSelections(prev => {
      const currentSelected = prev[optionTitle] || [];
      const exists = currentSelected.some(item => item.name === optionItem.name);
      
      let updated;
      if (exists) {
        updated = currentSelected.filter(item => item.name !== optionItem.name);
      } else {
        if (optionLimit && currentSelected.length >= optionLimit) {
          if (optionLimit === 1) {
            updated = [optionItem];
          } else {
            showErrorToast(`You can select a maximum of ${optionLimit} options for "${optionTitle}"`);
            return prev;
          }
        } else {
          updated = [...currentSelected, optionItem];
        }
      }
      playTick(soundEnabled);
      return {
        ...prev,
        [optionTitle]: updated
      };
    });
  };

  // Calculate dynamic price
  const calculateItemPrice = () => {
    let extraPrice = 0;
    Object.values(selections).forEach(selectedItems => {
      selectedItems.forEach(item => {
        extraPrice += item.price;
      });
    });
    return (customizingItem.price + extraPrice) * quantity;
  };

  const handleAddToCart = (e) => {
    let valid = true;
    customizingItem.options?.forEach(opt => {
      if (opt.required) {
        const selected = selections[opt.title] || [];
        if (opt.type === 'multiple' && opt.max && selected.length !== opt.max) {
          showErrorToast(`Please select exactly ${opt.max} items for "${opt.title}"`);
          valid = false;
        } else if (selected.length === 0) {
          showErrorToast(`Please make a selection for "${opt.title}"`);
          valid = false;
        }
      }
    });

    if (!valid) return;

    const customizations = [];
    Object.entries(selections).forEach(([title, items]) => {
      items.forEach(item => {
        customizations.push({
          category: title,
          name: item.name,
          price: item.price
        });
      });
    });

    addToCart(customizingItem, customizations, quantity, e);
    setIsAddedSuccessfully(true);
    setTimeout(() => {
      setCustomizingItem(null);
    }, 850);
  };

  const truncatedDesc = customizingItem?.description?.slice(0, 100) || '';
  const showSeeMore = (customizingItem?.description?.length || 0) > 100;

  return (
    <AnimatePresence>
      {customizingItem && (
        <motion.div 
          className="detail-modal-overlay" 
          onClick={() => setCustomizingItem(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 1. Top Section (40% height) with Floating Image */}
          <motion.div 
            className="detail-modal-top"
            initial={{ y: "-100%", rotateX: -20, z: -100 }}
            animate={{ y: 0, rotateX: 0, z: 0 }}
            exit={{ y: "-100%", rotateX: -15, z: -80 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
          >
        {customizingItem.videoUrl ? (
          <video
            src={customizingItem.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="detail-modal-banner-img"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <img loading="lazy" decoding="async" src={getOptimizedImageUrl(customizingItem.image, 600, 60)} alt={customizingItem.name} className="detail-modal-banner-img" />
        )}
        
        {/* Floating Controls */}
        <div className="detail-modal-controls">
          <button 
            className="detail-modal-circle-btn" 
            onClick={() => {
              setCustomizingItem(null);
              playTick(soundEnabled);
            }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          
          <button 
            className="detail-modal-circle-btn fav"
            onClick={() => toggleFavorite(customizingItem.id)}
            aria-label="Favorite"
          >
            <Heart size={20} fill={favorites.includes(customizingItem.id) ? "currentColor" : "none"} />
          </button>
        </div>
        </motion.div>

      {/* 2. Replicated Bottom Sheet Card (64% height) */}
      <motion.div 
        className="detail-sheet-card" 
        onClick={(e) => e.stopPropagation()}
        initial={{ y: "100%", rotateX: 20, z: -100, scale: 0.94 }}
        animate={{ y: 0, rotateX: 0, z: 0, scale: 1 }}
        exit={{ y: "100%", rotateX: 15, z: -80, scale: 0.95 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 150 || velocity.y > 500) {
            setCustomizingItem(null);
          }
        }}
      >
        <div className="drawer-drag-handle" style={{ marginTop: '10px', marginBottom: '0px' }}></div>
        
        {/* Floating Error Toast Overlay */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              className="detail-error-toast"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
            >
              <span className="toast-icon">⚠️</span>
              <span className="toast-text">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable details container */}
        <div ref={contentRef} className="detail-sheet-content">
          {/* Animated Urgency Header for trending deals */}
          {customizingItem.popular && (
            <div className="detail-urgency-callout">
              <div className="urgency-tag-flex">
                <span className="urgency-pulse-fire">🔥</span>
                <span className="urgency-text">HOT DEAL: 89% CLAIMED</span>
              </div>
              <div className="urgency-timer-flex">
                <span className="urgency-label">Ends in</span>
                <RollingTimer seconds={timeLeft} />
              </div>
            </div>
          )}

          {/* Title and Quantity Row */}
          <div className="detail-sheet-header-row">
            <h3 className="detail-sheet-title">{customizingItem.name}</h3>
            
            {/* Quantity Selector: Outlined minus, filled plus */}
            <div className="detail-qty-pill">
              <button
                className="detail-qty-btn minus"
                onClick={() => {
                  if (quantity > 1) {
                    setQuantity(q => q - 1);
                    playPop(soundEnabled);
                  }
                }}
                disabled={quantity <= 1}
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="detail-qty-val">{quantity}</span>
              <button
                className="detail-qty-btn plus"
                onClick={() => {
                  setQuantity(q => q + 1);
                  playPop(soundEnabled);
                }}
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          </div>

          <p className="detail-sheet-subtitle">FoodMaxx Express Kitchen</p>

          {/* Description Section */}
          <h4 className="detail-section-headline">Description</h4>
          <p className="detail-description-text">
            {isDescExpanded ? customizingItem.description : truncatedDesc}
            {showSeeMore && !isDescExpanded && (
              <span className="description-see-more" onClick={() => setIsDescExpanded(true)}>
                ...see more
              </span>
            )}
          </p>

          {/* Stats Bar with dividers */}
          <div className="detail-stats-bar">
            <div className="detail-stat-item">
              <span className="detail-stat-val">
                <Star size={12} fill="currentColor" /> {customizingItem.rating}
              </span>
              <span className="detail-stat-label">Rating</span>
            </div>
            <div className="detail-stat-divider"></div>
            <div className="detail-stat-item">
              <span className="detail-stat-val">
                <Flame size={12} fill="currentColor" style={{ color: 'var(--primary)' }} /> {customizingItem.calories ? `${customizingItem.calories} kcal` : 'See menu'}
              </span>
              <span className="detail-stat-label">Calories</span>
            </div>
            <div className="detail-stat-divider"></div>
            <div className="detail-stat-item">
              <span className="detail-stat-val">
                <Clock size={12} /> Pre-Order
              </span>
              <span className="detail-stat-label">Delivery</span>
            </div>
          </div>

          {/* Pre-Order Delivery Notice with urgency countdowns */}
          <div className="product-preorder-notice">
            <div className="preorder-notice-header">
              <div className="preorder-notice-title-row">
                <Clock size={14} className="accent-color" />
                <span>Pre-Order Schedule</span>
              </div>
              <button 
                type="button" 
                className="preorder-info-trigger-btn"
                onClick={() => { setIsInfoOpen(true); playTick(soundEnabled); }}
                aria-label="Delivery information"
              >
                ℹ️ More Info
              </button>
            </div>
            
            <div className="preorder-timers-grid">
              <div className="preorder-timer-card">
                <span className="timer-title">Lunch Closes By:</span>
                <span className={`timer-countdown ${lunchTimeLeft > 0 ? 'active' : 'closed'}`}>
                  {lunchTimeLeft > 0 ? (
                    <strong>{formatCountdown(lunchTimeLeft)}</strong>
                  ) : (
                    'Closed'
                  )}
                </span>
              </div>
              <div className="preorder-timer-card">
                <span className="timer-title">Dinner Closes By:</span>
                <span className={`timer-countdown ${dinnerTimeLeft > 0 ? 'active' : 'closed'}`}>
                  {dinnerTimeLeft > 0 ? (
                    <strong>{formatCountdown(dinnerTimeLeft)}</strong>
                  ) : (
                    'Closed'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Customization Options details */}
          {customizingItem.options?.map((opt) => (
            <div key={opt.title} className="custom-option-section" style={{ marginTop: '16px', marginBottom: '20px' }}>
              <div className="option-section-header" style={{ marginBottom: '8px' }}>
                <h4 className="detail-section-headline" style={{ margin: 0 }}>{opt.title}</h4>
                {opt.required && <span className="option-required-badge">Required</span>}
              </div>

              <div className="option-items-list">
                {opt.items.map((optionItem) => {
                  const isSelected = (selections[opt.title] || []).some(sel => sel.name === optionItem.name);
                  return (
                    <div
                      key={optionItem.name}
                      className={`option-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        opt.type === 'single'
                          ? handleSingleSelect(opt.title, optionItem)
                          : handleMultipleSelect(opt.title, optionItem, opt.max)
                      }
                    >
                      <div className="option-item-label-group" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isSelected && <Check size={14} strokeWidth={3} color={isSelected ? "#ffffff" : "currentColor"} />}
                        <span className="option-item-name">{optionItem.name}</span>
                      </div>

                      <div className="option-item-price-group">
                        {optionItem.price > 0 && (
                          <span className="option-price-tag">+₦{optionItem.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Replicated Footer */}
        <div className="detail-sheet-footer">
          <div className="detail-footer-price-group">
            <span className="detail-footer-price-label">Total Amount</span>
            <span className="detail-footer-price-val">₦{calculateItemPrice().toLocaleString()}</span>
          </div>

          <button 
            className={`btn-detail-add-cart ${isAddedSuccessfully ? 'success' : ''}`} 
            onClick={(e) => handleAddToCart(e)}
            disabled={isAddedSuccessfully}
            style={isAddedSuccessfully ? { background: 'var(--secondary)', border: 'none', color: '#ffffff', pointerEvents: 'none' } : {}}
          >
            {isAddedSuccessfully ? 'Meal added ✓' : 'Add to Cart'}
          </button>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .detail-urgency-callout {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, var(--primary-glow), transparent);
            border: 1.5px solid rgba(255, 91, 38, 0.25);
            border-radius: var(--radius-sm);
            padding: 8px 14px;
            margin-bottom: 16px;
            box-shadow: 0 4px 15px rgba(255, 91, 38, 0.05);
            animation: detail-glow-pulse 2s infinite alternate ease-in-out;
            position: relative;
            overflow: hidden;
          }

          /* Shimmer Sweep Animation Overlay */
          .detail-urgency-callout::after {
            content: '';
            position: absolute;
            top: 0;
            left: -150%;
            width: 60px;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.45),
              transparent
            );
            transform: skewX(-20deg);
            animation: shimmer-sweep 3.5s infinite ease-in-out;
          }

          @keyframes shimmer-sweep {
            0% { left: -150%; }
            30% { left: 150%; }
            100% { left: 150%; }
          }

          @keyframes detail-glow-pulse {
            0% { border-color: rgba(255, 91, 38, 0.15); box-shadow: 0 4px 15px rgba(255, 91, 38, 0.02); }
            100% { border-color: rgba(255, 91, 38, 0.35); box-shadow: 0 4px 15px rgba(255, 91, 38, 0.08); }
          }

          .urgency-tag-flex {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .urgency-pulse-fire {
            font-size: 1.1rem;
            animation: fire-flicker-detail 1.2s infinite alternate ease-in-out;
            display: inline-block;
          }

          @keyframes fire-flicker-detail {
            0% { transform: scale(0.92) rotate(-4deg); }
            100% { transform: scale(1.15) rotate(4deg); }
          }

          .urgency-text {
            font-size: 0.76rem;
            font-weight: 850;
            color: var(--primary);
            letter-spacing: -0.2px;
          }

          .urgency-timer-flex {
            display: flex;
            align-items: center;
            gap: 5px;
            background: var(--bg-card);
            padding: 3px 8px;
            border-radius: 10px;
            border: 1px solid var(--border-color);
          }

          .urgency-label {
            font-size: 0.62rem;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
          }

          /* Rolling numbers styling */
          .rolling-timer-container {
            display: inline-flex;
            align-items: center;
            font-family: var(--font-accent);
            font-weight: 900;
            font-size: 0.78rem;
            color: #DC2626; /* Urgent Red */
            margin-left: 2px;
          }

          .rolling-digit-viewport {
            display: inline-block;
            height: 0.95rem;
            line-height: 0.95rem;
            overflow: hidden;
            position: relative;
            width: 0.48rem;
            text-align: center;
          }

          .rolling-digit-strip {
            display: flex;
            flex-direction: column;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }

          .digit-val {
            height: 0.95rem;
            line-height: 0.95rem;
            display: block;
            font-family: var(--font-accent);
            font-weight: 900;
          }

          .timer-separator {
            margin: 0 1px;
            font-size: 0.75rem;
            font-weight: 900;
            animation: blink-separator 1s infinite alternate step-end;
          }

          @keyframes blink-separator {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          .detail-error-toast {
            position: absolute;
            top: 24px;
            left: 20px;
            right: 20px;
            background: rgba(239, 68, 68, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1.5px solid rgba(255, 255, 255, 0.2);
            border-radius: var(--radius-sm);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 8px 30px rgba(239, 68, 68, 0.25);
            z-index: 3200;
          }

          .dark-mode .detail-error-toast {
            background: rgba(220, 38, 38, 0.95);
            box-shadow: 0 8px 30px rgba(220, 38, 38, 0.35);
          }

          .toast-icon {
            font-size: 1.1rem;
          }

          .toast-text {
            color: #ffffff;
            font-size: 0.8rem;
            font-weight: 800;
            line-height: 1.3;
          }
        `}} />
      </motion.div>

      {/* Pre-Order Details Popover Modal */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div 
            className="preorder-popover-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsInfoOpen(false)}
          >
            <motion.div 
              className="preorder-popover-card"
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popover-header">
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-accent)', color: 'var(--text-main)' }}>How Pre-Order Works</h4>
                <button 
                  type="button" 
                  className="popover-close-btn"
                  onClick={() => { setIsInfoOpen(false); playTick(soundEnabled); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}
                >
                  ✕
                </button>
              </div>
              <div className="popover-body" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4, fontWeight: 550 }}>
                  To ensure maximum freshness and hot deliveries in Ibadan, FoodMaxx operates strictly on a scheduled pre-order model:
                </p>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.35, fontWeight: 500 }}>
                  <li>
                    <strong style={{ color: 'var(--primary)' }}>Lunch Deliveries (11am - 2pm)</strong>: Place your order before <strong style={{ color: 'var(--text-main)' }}>10:00 AM</strong>.
                  </li>
                  <li>
                    <strong style={{ color: 'var(--primary)' }}>Dinner Deliveries (3pm - 6pm)</strong>: Place your order before <strong style={{ color: 'var(--text-main)' }}>2:00 PM</strong>.
                  </li>
                  <li>
                    <strong>Chef Prep Promise</strong>: Batch preparing allows our kitchen to source fresh ingredients daily and ensure delivery exactly on time.
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    )}
    </AnimatePresence>
  );
}
