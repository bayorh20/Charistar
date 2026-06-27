import React, { useState } from 'react';
import { Star, Heart, Plus, Bike, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';


let sharedObserver = null;
const registeredCallbacks = new WeakMap();

function getSharedObserver() {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = registeredCallbacks.get(entry.target);
          if (callback) {
            callback();
          }
        }
      });
    }, { threshold: 0.05 });
  }
  return sharedObserver;
}

const FoodCard = React.memo(function FoodCard({ 
  item, 
  isFav, 
  toggleFavorite, 
  onAdd, 
  onClickCard,
  highlight = "", 
  highlightFn = null,
  viewMode = 'grid',
  hideRating = false
}) {

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const optionGroups = item.options || [];
  const [activeOptIndex, setActiveOptIndex] = useState(0);
  const [quickSelections, setQuickSelections] = useState({});
  const [swipeDirection, setSwipeDirection] = useState(0);

  // High-performance scroll reveal intersection observer
  const [isVisible, setIsVisible] = useState(false);
  const domRef = React.useRef();

  React.useEffect(() => {
    const currentEl = domRef.current;
    if (!currentEl) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = getSharedObserver();
    if (!observer) {
      setIsVisible(true);
      return;
    }

    registeredCallbacks.set(currentEl, () => {
      setIsVisible(true);
      observer.unobserve(currentEl);
      registeredCallbacks.delete(currentEl);
    });
    observer.observe(currentEl);

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
        registeredCallbacks.delete(currentEl);
      }
    };
  }, []);

  const handleFabClick = (e) => {
    e.stopPropagation();
    if (item.customizable && optionGroups.length > 0) {
      setQuickSelections({});
      setActiveOptIndex(0);
      setSwipeDirection(0);
      setShowQuickAdd(true);
    } else {
      onAdd(item, e);
    }
  };

  const handleSwipeLeft = () => {
    if (activeOptIndex < optionGroups.length - 1) {
      setSwipeDirection(1);
      setActiveOptIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (activeOptIndex > 0) {
      setSwipeDirection(-1);
      setActiveOptIndex(prev => prev - 1);
    }
  };

  const handleSelectOption = (optItem) => {
    const currentOptGroup = optionGroups[activeOptIndex];
    if (!currentOptGroup) return;

    setQuickSelections(prev => {
      const groupTitle = currentOptGroup.title;
      const currentSel = prev[groupTitle] || [];
      const exists = currentSel.some(x => x.name === optItem.name);
      
      let nextSel;
      if (exists) {
        nextSel = currentSel.filter(x => x.name !== optItem.name);
      } else {
        const isMultiple = currentOptGroup.type === 'multiple';
        const max = currentOptGroup.max || (isMultiple ? 99 : 1);
        
        if (max === 1) {
          nextSel = [optItem];
        } else if (currentSel.length < max) {
          nextSel = [...currentSel, optItem];
        } else {
          return prev; // ignore max limit overflow
        }
      }
      
      return {
        ...prev,
        [groupTitle]: nextSel
      };
    });
  };

  const handleQuickAddConfirm = (e) => {
    e.stopPropagation();
    const customizations = [];
    Object.keys(quickSelections).forEach(groupTitle => {
      const selectedItems = quickSelections[groupTitle] || [];
      selectedItems.forEach(item => {
        customizations.push({
          category: groupTitle,
          name: item.name,
          price: item.price
        });
      });
    });
    onAdd(item, e, customizations);
    setShowQuickAdd(false);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 140 : -140,
      opacity: 0,
      scale: 0.94
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 380, damping: 28 }
    },
    exit: (direction) => ({
      x: direction < 0 ? 140 : -140,
      opacity: 0,
      scale: 0.94,
      transition: { duration: 0.15 }
    })
  };

  const renderQuickAddOverlay = () => {
    const currentOptGroup = optionGroups[activeOptIndex];
    if (!showQuickAdd || !currentOptGroup) return null;

    const selectedItems = quickSelections[currentOptGroup.title] || [];
    const isMultiple = currentOptGroup.type === 'multiple';
    const maxVal = currentOptGroup.max || (isMultiple ? 99 : 1);

    const isQuickAddValid = optionGroups.every(group => {
      if (!group.required) return true;
      const selections = quickSelections[group.title] || [];
      return selections.length > 0;
    });

    return (
      <motion.div 
        className="card-quick-add-overlay" 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="quick-add-header">
          <div className="quick-add-stepper">
            {optionGroups.map((group, idx) => (
              <span 
                key={group.title} 
                className={`step-dot ${idx === activeOptIndex ? 'active' : ''} ${
                  (quickSelections[group.title] || []).length > 0 ? 'completed' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSwipeDirection(idx > activeOptIndex ? 1 : -1);
                  setActiveOptIndex(idx);
                }}
              />
            ))}
          </div>
          <button 
            className="quick-add-close" 
            onClick={(e) => { e.stopPropagation(); setShowQuickAdd(false); }}
          >
            <X size={12} />
          </button>
        </div>
        
        <div className="quick-add-body-wrapper">
          {activeOptIndex > 0 && (
            <button className="swipe-arrow arrow-left" onClick={(e) => { e.stopPropagation(); handleSwipeRight(); }}>
              <ChevronLeft size={14} />
            </button>
          )}

          <div className="quick-add-swipe-container">
            <AnimatePresence initial={false} custom={swipeDirection} mode="wait">
              <motion.div
                key={activeOptIndex}
                custom={swipeDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="quick-add-carousel-pane"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(e, { offset, velocity }) => {
                  if (offset.x > 40) {
                    handleSwipeRight();
                  } else if (offset.x < -40) {
                    handleSwipeLeft();
                  }
                }}
              >
                <div className="quick-add-title-group">
                  <span className="quick-add-option-title">{currentOptGroup.title}</span>
                  {maxVal > 1 && (
                    <span className="quick-add-selection-limit">
                      ({selectedItems.length}/{maxVal})
                    </span>
                  )}
                </div>

                <div className="quick-add-grid">
                  {currentOptGroup.items.slice(0, 3).map((optItem) => {
                    const isSelected = selectedItems.some(x => x.name === optItem.name);
                    return (
                      <button
                        key={optItem.name}
                        className={`quick-add-pill ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleSelectOption(optItem); }}
                      >
                        <span className="pill-name">{optItem.name}</span>
                        {optItem.price > 0 ? (
                          <span className="pill-price">+₦{optItem.price.toLocaleString()}</span>
                        ) : (
                          <span className="pill-price-free">Free</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {activeOptIndex < optionGroups.length - 1 && (
            <button className="swipe-arrow arrow-right" onClick={(e) => { e.stopPropagation(); handleSwipeLeft(); }}>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        
        <div className="quick-add-footer">
          <motion.button 
            className="quick-add-more" 
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickAdd(false);
              if (onClickCard) {
                onClickCard(item);
              } else {
                onAdd(item, e);
              }
            }}
          >
            Customizer ➔
          </motion.button>
          
          <button 
            className={`quick-add-btn-confirm ${isQuickAddValid ? 'active' : ''}`}
            disabled={!isQuickAddValid}
            onClick={handleQuickAddConfirm}
          >
            <Check size={14} strokeWidth={3.5} />
          </button>
        </div>
      </motion.div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div 
        ref={domRef}
        className={`premium-banner-card scroll-reveal ${isVisible ? 'revealed' : ''}`}
        onClick={(e) => onClickCard ? onClickCard(item) : onAdd(item, e)}
      >
        {/* Background Image Container */}
        <div className="card-image-wrapper">
          <img loading="lazy" decoding="async" src={isVisible ? getOptimizedImageUrl(item.image, 400, 50) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} alt={item.name} className="card-bg-image" />
          <div className="card-image-overlay" />
        </div>

        {/* Floating Badges */}
        <div className="card-top-badges">
          {!hideRating && (
            <div className="card-badge-rating">
              <Star size={10} fill="currentColor" />
              <span>{item.rating}</span>
            </div>
          )}
          <button
            className={`card-badge-fav ${isFav ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
            aria-label="Toggle favorite"
          >
            <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Overlaid Banner Details Panel */}
        <div className="banner-details-panel">
          <div className="banner-info-left">
            <h4 className="banner-title">
              {highlight && highlightFn ? highlightFn(item.name, highlight) : item.name}
            </h4>
            <div className="banner-info-meta">
              <span className="meta-item">⏱️ Pre-Order</span>
              <span className="meta-item" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Bike size={11} style={{ color: 'var(--primary)' }} /> Free Delivery
              </span>
            </div>
          </div>
          
          <div className="banner-info-right">
            {item.promoPrice ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                <span className="banner-price" style={{ color: 'var(--primary)' }}>₦{item.promoPrice.toLocaleString()}</span>
                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>₦{item.price.toLocaleString()}</span>
              </div>
            ) : (
              <span className="banner-price">₦{item.price.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Floating Action Button (FAB) */}
        <button
          className="banner-add-fab"
          onClick={handleFabClick}
          aria-label={`Add ${item.name} to cart`}
        >
          <Plus size={18} strokeWidth={3} />
        </button>

        {renderQuickAddOverlay()}
      </div>
    );
  }

  if (viewMode === 'classic') {
    return (
      <div 
        ref={domRef}
        className={`food-card scroll-reveal ${isVisible ? 'revealed' : ''}`}
        onClick={(e) => onClickCard ? onClickCard(item) : onAdd(item, e)}
      >
        <div className="food-card-img-container">
          <img loading="lazy" decoding="async" src={isVisible ? getOptimizedImageUrl(item.image, hideRating ? 240 : 400, 50) : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} alt={item.name} className="food-card-img" />
          {item.promoPrice && (
            <span className="promo-discount-badge">
              -{Math.round(((item.price - item.promoPrice) / item.price) * 100)}% OFF
            </span>
          )}
          {!hideRating && (
            <div className="food-card-rating">
              <Star size={10} fill="currentColor" />
              <span>{item.rating}</span>
            </div>
          )}
          <button
            className="food-card-fav"
            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
            aria-label="Toggle favorite"
          >
            <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="food-card-details">
          <div className="food-name-row">
            <h4 className="food-title">
              {highlight && highlightFn ? highlightFn(item.name, highlight) : item.name}
            </h4>
            {item.promoPrice ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                <span className="food-price" style={{ color: 'var(--primary)' }}>₦{item.promoPrice.toLocaleString()}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 'normal' }}>₦{item.price.toLocaleString()}</span>
              </div>
            ) : (
              <span className="food-price">₦{item.price.toLocaleString()}</span>
            )}
          </div>

          <div className="food-metadata-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Bike size={11} style={{ color: 'var(--primary)' }} /> Free delivery
            </span>
            <span>⏱️ Pre-Order</span>
          </div>

          <div className="food-chips-row">
            <span className="food-chip">{item.category}</span>
            {item.popular && <span className="food-chip">POPULAR</span>}
          </div>

          <button
            className="food-add-fab"
            onClick={handleFabClick}
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>

        {renderQuickAddOverlay()}
      </div>
    );
  }

  // ── Grid / Default card view ──────────────────────────────────────────────
  return (
    <div
      ref={domRef}
      className={`premium-food-card scroll-reveal ${isVisible ? 'revealed' : ''}`}
      onClick={(e) => onClickCard ? onClickCard(item) : onAdd(item, e)}
    >
      {/* Image */}
      <div className="card-image-wrapper-standalone">
        <img
          loading="lazy"
          decoding="async"
          src={isVisible ? getOptimizedImageUrl(item.image, 360, 50) : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '20px' }}
        />
        {item.promoPrice && (
          <span className="promo-discount-badge">
            -{Math.round(((item.price - item.promoPrice) / item.price) * 100)}% OFF
          </span>
        )}

        {/* Heart Favorite Button */}
        <button
          className={`card-badge-fav-scallop ${isFav ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item.id); }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          aria-label="Toggle favorite"
        >
          <Heart size={14} fill={isFav ? '#FF5B26' : 'none'} stroke={isFav ? '#FF5B26' : 'currentColor'} />
        </button>

        {/* Add FAB */}
        <button
          className="card-add-fab-scallop"
          onClick={handleFabClick}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          aria-label={`Add ${item.name} to cart`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="plus-3d-svg">
            <path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Details below photo */}
      <div className="premium-card-details">
        <div className="card-info-main-below">
          <h4 className="card-title-below">
            {highlight && highlightFn ? highlightFn(item.name, highlight) : item.name}
          </h4>
          {item.promoPrice ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
              <span className="card-price-below" style={{ color: 'var(--primary)' }}>₦{item.promoPrice.toLocaleString()}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 'normal' }}>₦{item.price.toLocaleString()}</span>
            </div>
          ) : (
            <span className="card-price-below">₦{item.price.toLocaleString()}</span>
          )}
        </div>

        <div className="card-info-meta-below">
          <div className="delivery-row">
            <Bike size={13} className="scooter-svg" style={{ strokeWidth: 2.5 }} />
            <span className="delivery-text">Free Delivery</span>
          </div>
          {!hideRating && (
            <div className="rating-row">
              <Star size={13} fill="#FF5B26" stroke="#FF5B26" />
              <span className="rating-text">{item.rating}</span>
            </div>
          )}
        </div>
      </div>

      {renderQuickAddOverlay()}
    </div>
  );
});
export default FoodCard;

