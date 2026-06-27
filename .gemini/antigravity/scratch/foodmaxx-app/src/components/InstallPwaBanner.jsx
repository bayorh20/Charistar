import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { playTick } from '../utils/sound';

export default function InstallPwaBanner() {
  const { deferredPrompt, setDeferredPrompt, marketingConfig } = useContext(AppContext);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setShowBanner(false);
      return;
    }
    if (deferredPrompt) {
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    playTick(true);
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    playTick(true);
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            bottom: '80px', // Right above the bottom nav
            left: '16px',
            right: '16px',
            zIndex: 9999,
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid var(--glass-border)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {/* App Icon Mockup */}
          <img loading="lazy" decoding="async" 
            src={marketingConfig?.appLogoUrl || "/icon-192.png"} 
            alt="FoodMaxx Logo" 
            style={{
              width: '48px', 
              height: '48px', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(255, 91, 38, 0.12)', 
              flexShrink: 0,
              objectFit: 'cover'
            }}
          />

          {/* Text Content */}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-main)' }}>
              {marketingConfig?.pwaInstallTitle || `Install ${marketingConfig?.appName || 'FoodMaxx'}`}
            </h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', lineHeight: 1.3 }}>
              {marketingConfig?.pwaPromptText || 'Get the full app experience. Order faster and track deliveries!'}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <button
              onClick={handleDismiss}
              style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
            <button
              onClick={handleInstallClick}
              style={{ 
                background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '20px', 
                padding: '8px 16px', fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                boxShadow: '0 4px 12px var(--primary-glow)'
              }}
            >
              Get App
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
