import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Star, Heart, Plus, Search, Trash2, TrendingUp, Clock, SlidersHorizontal, X } from 'lucide-react';
import { playTick } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';
import FoodCard from './FoodCard';
import CategoryScroller, { getPastelColor } from './CategoryScroller';
import SkeletonCard from './SkeletonCard';

export default function SearchScreen() {
  const {
    favorites,
    toggleFavorite,
    setCustomizingItem,
    addToCart,
    soundEnabled,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
    theme,
    categories,
    menuItems
  } = useContext(AppContext);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Filter Drawer States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(6000);
  const [localMaxPrice, setLocalMaxPrice] = useState(6000);
  const [minRating, setMinRating] = useState(0);
  const [selectedDietary, setSelectedDietary] = useState([]);

  // Sync localMaxPrice with maxPrice if maxPrice changes externally (e.g. reset)
  useEffect(() => {
    setLocalMaxPrice(maxPrice);
  }, [maxPrice]);

  const handleResetFilters = () => {
    setMaxPrice(6000);
    setLocalMaxPrice(6000);
    setMinRating(0);
    setSelectedDietary([]);
    playTick(soundEnabled);
  };

  const applyFilters = React.useCallback((items) => {
    return items.filter(item => {
      // Price filter
      if (item.price > maxPrice) return false;
      // Rating filter
      if (item.rating < minRating) return false;
      // Dietary filters — use item.tags array if available, else fallback to name/category
      if (selectedDietary.includes('vegetarian')) {
        const tags = item.tags || [];
        if (!tags.includes('vegetarian') && !tags.includes('vegan')) return false;
      }
      if (selectedDietary.includes('healthy')) {
        const tags = item.tags || [];
        if (!tags.includes('healthy') && !tags.includes('natural') && !tags.includes('salad')) return false;
      }
      if (selectedDietary.includes('popular') && !item.popular) return false;
      return true;
    });
  }, [maxPrice, minRating, selectedDietary]);

  const activeFilterCount = (maxPrice < 6000 ? 1 : 0) + (minRating > 0 ? 1 : 0) + selectedDietary.length;
  const hasActiveFilters = activeFilterCount > 0;

  // ✅ FIXED: highlightText now uses a fresh regex each call — no lastIndex bug
  const highlightText = (text, highlight) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const escaped = highlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase()
            ? <mark key={i} className="search-highlight">{part}</mark>
            : part
        )}
      </span>
    );
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim() === '') {
      setDebouncedQuery('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setIsSearching(false);
      addSearchHistory(query.trim());
    }, 150);

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [query]);

  const trendingTags = [];

  const handleSearchSubmit = (term) => {
    setQuery(term);
    setDebouncedQuery(term);
    setIsSearching(false);
    playTick(soundEnabled);
  };

  const handleItemClick = (item, e) => {
    if (item.customizable) {
      setCustomizingItem(item);
    } else {
      addToCart(item, [], 1, e);
      playTick(soundEnabled);
    }
  };

  // Filter by category when not searching (Memoized)
  const browseItems = React.useMemo(() => {
    const base = menuItems.filter(item =>
      activeCategory === 'all' || item.category === activeCategory
    );
    return applyFilters(base);
  }, [activeCategory, applyFilters, menuItems]);

  // Search results (Memoized)
  const searchResults = React.useMemo(() => {
    const base = debouncedQuery.trim()
      ? menuItems.filter(item =>
          item.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(debouncedQuery.toLowerCase())
        )
      : [];
    return applyFilters(base);
  }, [debouncedQuery, applyFilters, menuItems]);

  const isSearchMode = query.trim() !== '';

  const activeItemsCount = React.useMemo(() => {
    const activeBase = isSearchMode
      ? (debouncedQuery.trim()
          ? menuItems.filter(item =>
              item.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              item.description.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(debouncedQuery.toLowerCase())
            )
          : [])
      : menuItems.filter(item => activeCategory === 'all' || item.category === activeCategory);
    return applyFilters(activeBase).length;
  }, [isSearchMode, debouncedQuery, activeCategory, applyFilters, menuItems]);

  return (
    <div className="search-screen-container">

      {/* Screen Title */}
      <div className="search-screen-top-bar">
        <h2 className="screen-page-title">Search</h2>
        <span className="screen-page-subtitle">Find pasta, shawarma, and more</span>
      </div>

      {/* Search Input & Filter Button */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
        <div className="search-bar-container" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pasta, shawarma, jollof..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) handleSearchSubmit(query); }}
            className="search-input"
          />
          {query && (
            <button
              className="search-clear-btn"
              onClick={() => { setQuery(''); setDebouncedQuery(''); setIsSearching(false); }}
              style={{ fontSize: '1.1rem', padding: '8px', margin: '-4px', color: 'var(--text-muted)' }}
            >
              ×
            </button>
          )}
        </div>

        <button
          onClick={() => { setIsFilterOpen(true); playTick(soundEnabled); }}
          className={`filter-toggle-btn ${hasActiveFilters ? 'active' : ''}`}
          aria-label="Filter search results"
          style={{
            background: hasActiveFilters ? 'var(--primary)' : 'var(--bg-card)',
            color: hasActiveFilters ? '#FFFFFF' : 'var(--text-main)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            height: '46px',
            width: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-smooth)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <SlidersHorizontal size={18} />
          {hasActiveFilters && (
            <span className="filter-badge">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Active Filters Pill Bar */}
      {hasActiveFilters && (
        <div className="active-filters-bar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {maxPrice < 6000 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 91, 38, 0.08)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(255, 91, 38, 0.2)', flexShrink: 0 }}>
              <span>Max: ₦{maxPrice.toLocaleString()}</span>
              <button onClick={() => { setMaxPrice(6000); playTick(soundEnabled); }} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px' }}>×</button>
            </div>
          )}
          {minRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 91, 38, 0.08)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(255, 91, 38, 0.2)', flexShrink: 0 }}>
              <Star size={10} fill="currentColor" style={{ color: 'var(--primary)' }} />
              <span>{minRating}+ stars</span>
              <button onClick={() => { setMinRating(0); playTick(soundEnabled); }} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px' }}>×</button>
            </div>
          )}
          {selectedDietary.map(dietId => {
            const label = dietId === 'vegetarian' ? 'Vegetarian' : dietId === 'healthy' ? 'Healthy' : 'Popular';
            return (
              <div key={dietId} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 91, 38, 0.08)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(255, 91, 38, 0.2)', flexShrink: 0 }}>
                <span>{label}</span>
                <button onClick={() => { setSelectedDietary(prev => prev.filter(x => x !== dietId)); playTick(soundEnabled); }} style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px' }}>×</button>
              </div>
            );
          })}
          <button 
            onClick={handleResetFilters} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* BROWSE MODE: no search query */}
      {!isSearchMode && (
        <div className="search-explore-view anim-fade">

          {/* Trending */}
          {trendingTags.length > 0 && (
            <div className="search-section" style={{ marginBottom: '24px' }}>
              <div className="section-header-row" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                  <span className="section-headline" style={{ fontSize: '1rem' }}>Trending Now</span>
                </div>
              </div>
              <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSearchSubmit(tag)}
                    style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
                  >
                    <span style={{ fontSize: '14px' }}>🔥</span> {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cuisine / Category Tiles — loaded live from Firestore via context */}
          {categories.length > 0 && (
            <>
              <div className="section-header-row" style={{ marginBottom: '12px' }}>
                <span className="section-headline" style={{ fontSize: '1rem' }}>Cuisines</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {/* All Foods tile always first */}
                <div
                  onClick={() => { setActiveCategory('all'); playTick(soundEnabled); }}
                  style={{ background: '#F3E5F5', borderRadius: '12px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', border: activeCategory === 'all' ? '2px solid var(--primary)' : '2px solid transparent', transition: '0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <span style={{ fontSize: '24px' }}>🍽️</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#1A1A1A' }}>All Food</span>
                </div>
                {/* Dynamic categories from Firestore */}
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    onClick={() => { setActiveCategory(prev => prev === cat.id ? 'all' : cat.id); playTick(soundEnabled); }}
                    style={{ background: getPastelColor(cat.id, idx), borderRadius: '12px', padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', border: activeCategory === cat.id ? '2px solid var(--primary)' : '2px solid transparent', transition: '0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <span style={{ fontSize: '24px' }}>{cat.icon || '🍴'}</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#1A1A1A', textAlign: 'center', lineHeight: 1.2 }}>{cat.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Dynamic Category Results or Popular Items */}
          <div className="section-header-row" style={{ marginBottom: '12px' }}>
            <span className="section-headline" style={{ fontSize: '1rem' }}>
              {activeCategory === 'all' ? 'Popular Near You' : `${browseItems.length} options found`}
            </span>
          </div>
          
          {browseItems.length > 0 ? (
            <div className="food-list" style={{ paddingBottom: '120px' }}>
              {browseItems.slice(0, activeCategory === 'all' && !hasActiveFilters ? 6 : browseItems.length).map((item) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onClickCard={() => setCustomizingItem(item)}
                  onAdd={(e) => { e.stopPropagation(); handleItemClick(item, e); }}
                  highlight=""
                  viewMode="list" // Use the beautiful list mode by default on Explore
                />
              ))}
            </div>
          ) : (
            <div className="no-results anim-scale-in" style={{
              padding: '40px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-color)', borderRadius: '18px',
              textAlign: 'center', marginTop: '16px', marginBottom: '120px'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🥗</span>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>No dishes match your filters</div>
              <button 
                onClick={handleResetFilters}
                style={{
                  background: 'var(--primary)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  marginTop: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 91, 38, 0.15)'
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* SEARCHING: skeleton loaders */}
      {isSearchMode && isSearching && (
        <div className="search-results-view anim-fade" style={{ marginTop: '4px' }}>
          <div className="section-header-row" style={{ marginBottom: '12px' }}>
            <span className="section-headline" style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Searching for "{query}"...
            </span>
          </div>
          <div className="food-grid">
            {[1, 2].map((n) => (
              <SkeletonCard key={n} viewMode="grid" />
            ))}
          </div>
        </div>
      )}

      {/* SEARCH RESULTS */}
      {isSearchMode && !isSearching && (
        <div className="search-results-view anim-fade" style={{ marginTop: '4px' }}>
          <div className="section-header-row" style={{ marginBottom: '12px' }}>
            <span className="section-headline" style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Results for "{debouncedQuery}"
            </span>
            <span className="cart-qty-badge" style={{ fontSize: '0.68rem' }}>
              {searchResults.length} found
            </span>
          </div>

          {searchResults.length > 0 ? (
            <div className="food-grid">
              {searchResults.map((item) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onClickCard={() => setCustomizingItem(item)}
                  onAdd={(e) => { e.stopPropagation(); handleItemClick(item, e); }}
                  highlight={debouncedQuery}
                  highlightFn={highlightText}
                />
              ))}
            </div>
          ) : (
            <div className="no-results anim-scale-in" style={{
              padding: '40px 16px', background: 'var(--bg-card)',
              border: '1px solid var(--border-color)', borderRadius: '18px',
              textAlign: 'center', marginTop: '16px'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🔍</span>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>No results match filters</div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', maxWidth: '200px', margin: '6px auto 0', lineHeight: 1.4 }}>
                Try adjusting your price range or rating filters!
              </p>
              <button 
                onClick={handleResetFilters}
                style={{
                  background: 'var(--primary)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  marginTop: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 91, 38, 0.15)'
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* FILTER DRAWER BOTTOM SHEET */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            className="drawer-overlay" 
            onClick={() => setIsFilterOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 1100 }}
          >
            <motion.div 
              className="drawer-sheet" 
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 150 || velocity.y > 500) {
                  setIsFilterOpen(false);
                }
              }}
              style={{
                maxHeight: '80vh',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                background: 'var(--bg-card)'
              }}
            >
              <div className="drawer-drag-handle" style={{ background: 'var(--border-color)', width: '40px', height: '4px', borderRadius: '2px', margin: '12px auto 6px auto' }}></div>

              <div className="drawer-header" style={{ padding: '16px 20px 12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="drawer-title" style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Filter Dishes</h3>
                  {hasActiveFilters && (
                    <span className="cart-qty-badge" style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      Reset
                    </button>
                  )}
                  <button className="btn-close" onClick={() => setIsFilterOpen(false)} style={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifySelf: 'center', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <X size={16} style={{ margin: 'auto' }} />
                  </button>
                </div>
              </div>

              <div className="drawer-content" style={{ padding: '20px', overflowY: 'auto' }}>
                {/* PRICE RANGE */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>Max Price</span>
                    <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--primary)' }}>₦{localMaxPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="6000"
                    step="100"
                    value={localMaxPrice}
                    onChange={(e) => {
                      setLocalMaxPrice(Number(e.target.value));
                    }}
                    onMouseUp={() => {
                      setMaxPrice(localMaxPrice);
                      playTick(soundEnabled);
                    }}
                    onTouchEnd={() => {
                      setMaxPrice(localMaxPrice);
                      playTick(soundEnabled);
                    }}
                    onKeyUp={(e) => {
                      if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
                        setMaxPrice(localMaxPrice);
                        playTick(soundEnabled);
                      }
                    }}
                    style={{
                      width: '100%',
                      accentColor: 'var(--primary)',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'var(--border-color)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                    <span>₦800</span>
                    <span>₦3,400</span>
                    <span>₦6,000</span>
                  </div>
                </div>

                {/* RATING */}
                <div style={{ marginBottom: '24px' }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '10px' }}>
                    Minimum Rating
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[0, 4.5, 4.7, 4.8].map((ratingVal) => (
                      <button
                        key={ratingVal}
                        onClick={() => {
                          setMinRating(ratingVal);
                          playTick(soundEnabled);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 6px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          border: minRating === ratingVal ? '2.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                          background: minRating === ratingVal ? 'rgba(255, 91, 38, 0.08)' : 'var(--bg-secondary)',
                          color: minRating === ratingVal ? 'var(--primary)' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {ratingVal === 0 ? 'Any' : (
                          <>
                            <Star size={12} fill="currentColor" />
                            <span>{ratingVal}+</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DIETARY PREFERENCES */}
                <div style={{ marginBottom: '32px' }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '10px' }}>
                    Dietary & Style
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { id: 'vegetarian', label: '🌱 Vegetarian' },
                      { id: 'healthy', label: '🥗 Healthy & Natural' },
                      { id: 'popular', label: '🔥 Popular Choice' }
                    ].map((diet) => {
                      const isSelected = selectedDietary.includes(diet.id);
                      return (
                        <button
                          key={diet.id}
                          onClick={() => {
                            setSelectedDietary(prev =>
                              isSelected ? prev.filter(x => x !== diet.id) : [...prev, diet.id]
                            );
                            playTick(soundEnabled);
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            border: isSelected ? '2.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                            background: isSelected ? 'rgba(255, 91, 38, 0.08)' : 'var(--bg-secondary)',
                            color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          {diet.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* APPLY BUTTON */}
                <button
                  onClick={() => {
                    setMaxPrice(localMaxPrice);
                    setIsFilterOpen(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '14px',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(255, 91, 38, 0.25)',
                    transition: 'all var(--transition-smooth)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Show Results</span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {activeItemsCount} {activeItemsCount === 1 ? 'item' : 'items'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .search-screen-top-bar {
          margin-bottom: 16px;
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
        .search-highlight {
          background: rgba(255, 104, 51, 0.2);
          color: var(--primary);
          border-radius: 3px;
          padding: 0 2px;
          font-weight: 800;
        }
        .filter-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--text-main);
          color: var(--bg-card);
          font-size: 0.62rem;
          font-weight: 900;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid var(--border-color);
        }
        .filter-toggle-btn {
          position: relative;
        }
        .filter-toggle-btn:active {
          transform: scale(0.95);
        }
        .active-filters-bar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
