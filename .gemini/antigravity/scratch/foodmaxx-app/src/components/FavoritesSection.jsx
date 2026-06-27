import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Star, Heart, Plus, Bike } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export default function FavoritesSection() {
  const {
    favorites,
    toggleFavorite,
    setCustomizingItem,
    addToCart,
    soundEnabled,
    menuItems
  } = useContext(AppContext);

  // Filter menu items that are favorited (memoized)
  const favoriteItems = useMemo(() => {
    return menuItems.filter(item => favorites.includes(item.id));
  }, [favorites, menuItems]);

  const handleAddClick = (item, e) => {
    e.stopPropagation();
    if (item.customizable) {
      setCustomizingItem(item);
    } else {
      addToCart(item, [], 1);
    }
  };

  return (
    <div className="favorites-container">
      <div className="section-header-row" style={{ marginBottom: '16px' }}>
        <h3 className="section-headline" style={{ fontSize: '1.25rem' }}>Your Favorites</h3>
        <span className="cart-qty-badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: 'var(--radius-xs)' }}>
          {favoriteItems.length} Saved
        </span>
      </div>

      {favoriteItems.length > 0 ? (
        <div className="food-grid anim-fade">
          {favoriteItems.map((item) => (
            <div
              key={item.id}
              className="food-card"
              onClick={() => item.customizable ? setCustomizingItem(item) : addToCart(item, [], 1)}
            >
              {/* Image with Rating and Fav Outline */}
              <div className="food-card-img-container">
                <img loading="lazy" decoding="async" src={getOptimizedImageUrl(item.image, 400, 50)} alt={item.name} className="food-card-img" />
                
                <div className="food-card-rating">
                  <Star size={10} fill="currentColor" />
                  <span>{item.rating}</span>
                </div>

                <button 
                  className="food-card-fav" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  aria-label="Remove from favorites"
                >
                  <Heart size={14} fill="currentColor" />
                </button>
              </div>

              {/* Card Text details */}
              <div className="food-card-details">
                <div className="food-name-row">
                  <h4 className="food-title">{item.name}</h4>
                  <span className="food-price">₦{item.price.toLocaleString()}</span>
                </div>

                <div className="food-metadata-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Bike size={12} style={{ color: 'var(--primary)' }} /> Free delivery
                  </span>
                  <span>⏱️ Pre-Order</span>
                </div>

                {/* Tag chips */}
                <div className="food-chips-row">
                  <span className="food-chip">{item.category}</span>
                  {item.popular && <span className="food-chip">POPULAR</span>}
                  <span className="food-chip">Ibadan</span>
                </div>

                {/* Floating Add Card button */}
                <button
                  className="food-add-fab"
                  onClick={(e) => handleAddClick(item, e)}
                  aria-label="Add item"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results anim-scale-in" style={{ padding: '40px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '18px', textAlign: 'center', marginTop: '24px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px', animation: 'float 3s infinite' }}>❤️</span>
          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem', fontFamily: 'var(--font-accent)' }}>No Favorites Yet</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '220px', margin: '6px auto 0 auto', lineHeight: 1.4 }}>
            Tap the heart icon on any mouthwatering Ibadan delicacies to save them here for quick access!
          </p>
        </div>
      )}
    </div>
  );
}
