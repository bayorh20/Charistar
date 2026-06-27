import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ShoppingBag, Sun, Moon } from 'lucide-react';
import { playTick } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header({ onCartOpen }) {
  const {
    soundEnabled,
    theme,
    setTheme,
    cartTotalItems,
    setShowProfile,
    marketingConfig
  } = useContext(AppContext);

  const [pulseBadge, setPulseBadge] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (cartTotalItems > 0) {
      setPulseBadge(true);
      const timer = setTimeout(() => setPulseBadge(false), 450);
      return () => clearTimeout(timer);
    }
  }, [cartTotalItems]);

  return (
    <header className="app-header">
      {/* Top row with Profile & theme toggle/cart */}
      <div className="header-top" style={{ marginBottom: 0 }}>
        <div className="header-profile-location">
          <button
            className="header-avatar-btn"
            onClick={() => {
              setShowProfile(true);
              playTick(soundEnabled);
            }}
            aria-label="Open profile"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <img loading="lazy" decoding="async" 
              src={marketingConfig?.appLogoUrl || "/icon-192.png"} 
              alt="Profile Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          </button>
        </div>

        {/* Right buttons: Theme Toggle & Shopping Cart */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="header-btn"
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
              playTick(soundEnabled);
            }}
            aria-label="Toggle theme"
            style={{ color: 'var(--text-main)', overflow: 'hidden' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -20, rotate: -90, opacity: 0 }}
                animate={{ y: 0, rotate: 0, opacity: 1 }}
                exit={{ y: 20, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </motion.div>
            </AnimatePresence>
          </button>

          <button
            className="header-btn"
            onClick={() => {
              setIsFlipping(true);
              onCartOpen();
              playTick(soundEnabled);
            }}
            aria-label="Open cart"
            style={{ position: 'relative' }}
          >
            <motion.div
              animate={isFlipping ? { rotateY: 360 } : { rotateY: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              onAnimationComplete={() => setIsFlipping(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ShoppingBag size={18} />
            </motion.div>
            {cartTotalItems > 0 && (
              <span className={`header-cart-badge ${pulseBadge ? 'badge-bounce-active' : ''}`}>{cartTotalItems}</span>
            )}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .header-cart-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--primary);
          color: #FFFFFF;
          text-shadow: 0px 1px 2px rgba(0,0,0,0.3);
          font-size: 0.6rem;
          font-weight: 800;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid var(--bg-card);
        }
      `}} />
    </header>
  );
}
