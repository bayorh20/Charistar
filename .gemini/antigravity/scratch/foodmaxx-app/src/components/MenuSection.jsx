import React, { useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Star, Heart, Plus, Clock, ShoppingCart, ChevronLeft, ChevronRight, LayoutGrid, AlignJustify } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTick, playPop } from '../utils/sound';
import HeroSlider from './HeroSlider';
import FoodCard from './FoodCard';
import CategoryScroller from './CategoryScroller';

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

export default function MenuSection() {
  const context = useContext(AppContext);
  const {
    selectedCategory,
    setSelectedCategory,
    setCustomizingItem,
    addToCart,
    soundEnabled,
    favorites,
    toggleFavorite,
    currentOrder,
    setActiveScreen,
    isLoading,
    userProfile,
    categories,
    menuItems,
    pageLayout,
    marketingConfig
  } = context;

  // Derive section visibility + config from pageLayout (set by admin Page Builder)
  const getSectionConfig = (id) => {
    if (!pageLayout?.sections) return { visible: true };
    return pageLayout.sections.find(s => s.id === id) || { visible: true };
  };
  const greetingConfig     = getSectionConfig('greeting');
  const heroConfig         = getSectionConfig('hero');
  const announcementConfig = getSectionConfig('announcement');
  const categoriesConfig   = getSectionConfig('categories');
  const trendingConfig     = getSectionConfig('trending');
  const dishesConfig       = getSectionConfig('dishes');

  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  // Default view mode can be set by admin via Page Builder
  const [viewMode, setViewMode] = useState(() => {
    const dishesSection = pageLayout?.sections?.find(s => s.id === 'dishes');
    return dishesSection?.defaultView || 'classic';
  });

  // Keep viewMode state in sync when database configurations load/change
  useEffect(() => {
    if (dishesConfig?.defaultView) {
      setViewMode(dishesConfig.defaultView);
    }
  }, [dishesConfig?.defaultView]);

  const popularItems = useMemo(() => {
    const source = trendingConfig.filterSource || 'popular';
    let items = [];
    if (source === 'discount') {
      items = menuItems.filter(item => item.promoPrice && item.promoPrice < item.price);
    } else if (source === 'all') {
      items = [...menuItems];
    } else {
      items = menuItems.filter(item => item.popular);
    }
    
    // Sort items by salesCount desc to order by actual popularity
    items.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    
    const limit = trendingConfig.displayLimit || 6;
    return items.slice(0, limit);
  }, [menuItems, pageLayout]);

  // Countdown timer for animated urgency (synchronized with app epoch and custom timer settings)
  const [timeLeft, setTimeLeft] = useState(600);
  useEffect(() => {
    const duration = (trendingConfig.timerDurationMinutes || 10) * 60;
    setTimeLeft(duration - (Math.floor(Date.now() / 1000) % duration));
    
    const timer = setInterval(() => {
      const currentDuration = (trendingConfig.timerDurationMinutes || 10) * 60;
      setTimeLeft(currentDuration - (Math.floor(Date.now() / 1000) % currentDuration));
    }, 1000);
    return () => clearInterval(timer);
  }, [trendingConfig.timerDurationMinutes]);

  // Autoscroll for Trending Deals
  const scrollerRef = useRef(null);

  // 3D Curved Scroll Effect for Trending Deals
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update3DTransforms = () => {
      const containerWidth = scroller.clientWidth;
      if (containerWidth <= 0) return;
      const scrollLeft = scroller.scrollLeft;
      const containerCenter = scrollLeft + containerWidth / 2;
      const cards = scroller.children;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardWidth = card.clientWidth;
        const cardCenter = card.offsetLeft + cardWidth / 2;
        const distance = cardCenter - containerCenter;
        
        // Normalize distance relative to half the container's width
        const normalized = distance / (containerWidth / 2);
        // Clamp to avoid extreme distortion at outer bounds
        const clamped = Math.max(-1.5, Math.min(1.5, normalized));

        const rotateY = clamped * -28;
        const translateZ = -Math.abs(clamped) * 70;
        const scale = 1 - Math.abs(clamped) * 0.08;
        const opacity = 1 - Math.min(0.35, Math.abs(clamped) * 0.22);

        card.style.transform = `perspective(1000px) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.transformStyle = 'preserve-3d';
      }
    };

    update3DTransforms();

    scroller.addEventListener('scroll', update3DTransforms, { passive: true });
    window.addEventListener('resize', update3DTransforms);

    // Initial delay safety to allow layout rendering
    const timer = setTimeout(update3DTransforms, 120);

    return () => {
      scroller.removeEventListener('scroll', update3DTransforms);
      window.removeEventListener('resize', update3DTransforms);
      clearTimeout(timer);
    };
  }, [popularItems, selectedCategory, trendingConfig.visible, pageLayout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stable references for Context methods so FoodCards never re-render unnecessarily
  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  });

  const handleAddClickStable = useCallback((item, e, quickCustomizations = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const { setCustomizingItem, addToCart, soundEnabled } = contextRef.current;
    if (item.customizable && !quickCustomizations) {
      setCustomizingItem(item);
      playPop(soundEnabled);
    } else {
      addToCart(item, quickCustomizations || [], 1, e);
    }
  }, []);

  const handleClickCardStable = useCallback((item) => {
    contextRef.current.setCustomizingItem(item);
  }, []);

  const handleToggleFavoriteStable = useCallback((id) => {
    contextRef.current.toggleFavorite(id);
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      return selectedCategory === 'all' || item.category === selectedCategory;
    });
  }, [selectedCategory, menuItems]);

  const sortedSections = useMemo(() => {
    if (!pageLayout?.sections) {
      return [
        { id: 'greeting', visible: true, order: 0 },
        { id: 'hero', visible: true, order: 1 },
        { id: 'announcement', visible: true, order: 2 },
        { id: 'categories', visible: true, order: 3 },
        { id: 'trending', visible: true, order: 4 },
        { id: 'dishes', visible: true, order: 5 }
      ];
    }
    return [...pageLayout.sections].sort((a, b) => a.order - b.order);
  }, [pageLayout]);

  const renderSection = (id) => {
    switch (id) {
      case 'greeting':
        if (greetingConfig.visible === false || selectedCategory !== 'all') return null;
        return (
          <motion.div 
            key="greeting"
            style={{ marginBottom: '22px', marginTop: '6px' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.6px', margin: 0, fontFamily: 'var(--font-accent)' }}>
              {marketingConfig?.greetingHeadline || 'Hey'} {userProfile?.registered && userProfile?.name?.trim() ? userProfile.name.trim().split(' ')[0] : 'Foodie'}! <span className="animated-3d-wink">😉</span>
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600, margin: '2px 0 0 0' }}>
              {marketingConfig?.greetingSubtitle || 'What do you want to eat today?'}
            </p>
          </motion.div>
        );

      case 'hero':
        if (heroConfig.visible === false || selectedCategory !== 'all') return null;
        return <HeroSlider key="hero" config={heroConfig} />;

      case 'announcement':
        if (announcementConfig.visible === false || selectedCategory !== 'all') return null;
        return (
          <div key="announcement" className="delivery-announcement-banner anim-slide-up">
            <div className="banner-accent-line"></div>
            <div className="banner-main-row">
              <div className="banner-icon-wrapper">
                <Clock size={16} className="clock-anim-pulse" />
              </div>
              <div className="banner-text-content">
                <span className="banner-badge-attention">{announcementConfig.badge || 'Pre-Order Only'}</span>
                <span 
                  className="banner-message"
                  dangerouslySetInnerHTML={{ 
                    __html: announcementConfig.text || 'Lunch order closes at <strong>10:00 AM</strong>. Next window: Dinner starts at <strong>3:00 PM</strong>.' 
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'categories':
        if (categoriesConfig.visible === false) return null;
        return (
          <CategoryScroller key="categories" activeCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        );

      case 'trending':
        if (trendingConfig.visible === false || selectedCategory !== 'all' || popularItems.length === 0) return null;
        
        // Dynamic claimed percentage generator based on item ID
        const getClaimedPercentage = (itemId) => {
          let hash = 0;
          for (let i = 0; i < itemId.length; i++) {
            hash = itemId.charCodeAt(i) + ((hash << 5) - hash);
          }
          return 65 + (Math.abs(hash) % 30); // 65% to 95%
        };

        return (
          <div key="trending" className="trending-section" style={{ marginBottom: '30px' }}>
            <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="section-headline" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{trendingConfig.title || 'Trending Deals'}</span>
                {trendingConfig.badgeText !== '' && (
                  <span className="deal-badge">{trendingConfig.badgeText || 'HOT 🔥'}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(trendingConfig.showTimer ?? true) && (
                  <div className="timer-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-glow)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', marginRight: '6px' }}>
                    <span>Ends in:</span>
                    <RollingTimer seconds={timeLeft} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => {
                      scrollerRef.current.scrollBy({ left: -240, behavior: 'smooth' });
                    }}
                    className="carousel-nav-btn"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
                    aria-label="Previous Deal"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      scrollerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
                    }}
                    className="carousel-nav-btn"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s' }}
                    aria-label="Next Deal"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
            
            <div 
              ref={scrollerRef}
              className="trending-scroller curves-scroller-3d"
              style={{ 
                display: 'flex', 
                gap: '16px', 
                overflowX: 'auto', 
                padding: '10px 4px 20px 4px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {popularItems.map((item) => {
                const claimedPercent = getClaimedPercentage(item.id);
                return (
                  <div 
                    key={item.id} 
                    className="trending-card-wrapper"
                    style={{ transition: 'all 0.1s ease', display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <FoodCard
                      item={item}
                      isFav={favorites.includes(item.id)}
                      toggleFavorite={handleToggleFavoriteStable}
                      onClickCard={handleClickCardStable}
                      onAdd={handleAddClickStable}
                      viewMode="classic"
                      hideRating={false}
                    />
                    
                    {/* Visual Claim Urgency Indicator */}
                    <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--primary)' }}>🔥 {claimedPercent}% Claimed</span>
                        <span style={{ marginLeft: 'auto' }}>{Math.round((100 - claimedPercent) * 0.3)} left!</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${claimedPercent}%`, background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'dishes':
        if (dishesConfig.visible === false) return null;
        return (
          <React.Fragment key="dishes">
            {/* Main Dishes Header Row */}
            <div className="section-header-row" style={{ marginTop: '20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-headline" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {selectedCategory === 'all' ? (dishesConfig.title || 'All Dishes') : categories.find(c => c.id === selectedCategory)?.label || 'Dishes'}
              </span>
              
              {/* Layout Toggle Buttons */}
              <div className="view-mode-toggle" style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => { setViewMode('classic'); playTick(soundEnabled); }}
                  style={{
                    background: viewMode === 'classic' ? 'var(--bg-card)' : 'transparent',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: viewMode === 'classic' ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <AlignJustify size={13} strokeWidth={2.5} />
                  <span>Classic</span>
                </button>
                <button 
                  onClick={() => { setViewMode('grid'); playTick(soundEnabled); }}
                  style={{
                    background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LayoutGrid size={13} strokeWidth={2.5} />
                  <span>Grid</span>
                </button>
              </div>
            </div>

            {/* Loading Skeleton or Products List */}
            {isLoading ? (
              <div className="food-grid">
                {[1, 2, 3, 4].map((n) => (
                  <div 
                    key={n} 
                    className="skeleton-card" 
                    style={{ 
                      height: '280px', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '18px', 
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div className="skeleton-image skeleton-shimmer" style={{ width: '100%', height: '160px' }}></div>
                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="skeleton-title skeleton-shimmer" style={{ height: '16px', width: '70%', borderRadius: '4px' }}></div>
                      <div className="skeleton-text skeleton-shimmer" style={{ height: '12px', width: '40%', borderRadius: '4px' }}></div>
                      <div className="skeleton-tags" style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                        <div className="skeleton-tag skeleton-shimmer" style={{ height: '20px', width: '50px', borderRadius: '10px' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="food-grid anim-fade-in hardware-accelerate">
                {filteredItems.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    isFav={favorites.includes(item.id)}
                    toggleFavorite={handleToggleFavoriteStable}
                    onClickCard={handleClickCardStable}
                    onAdd={handleAddClickStable}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div 
                className="no-results anim-fade-in" 
                style={{ padding: '30px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '18px', textAlign: 'center', marginTop: '12px' }}
              >
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔍</span>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>No dishes found</div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', maxWidth: '200px', margin: '4px auto 0 auto' }}>We couldn't find any items matching your filters.</p>
              </div>
            )}
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  return (
    <div className="menu-container">
      {/* Active Order Pill */}
      {currentOrder && currentOrder.statusIndex < 4 && (
        <div 
          className="home-active-order-pill" 
          onClick={() => {
            setActiveScreen('orders');
            playTick(soundEnabled);
          }}
        >
          <div className="home-active-order-left">
            <div style={{ fontSize: '1.4rem' }}>🛵</div>
            <div className="home-active-order-details">
              <span className="home-active-order-title">Tracking Active Order</span>
              <span className="home-active-order-status">
                <span className="pulse-dot"></span>
                {currentOrder.status}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="home-active-order-arrow" />
        </div>
      )}

      {/* Render Dynamic Layout Sections */}
      {sortedSections.map(section => renderSection(section.id))}
    </div>
  );
}
