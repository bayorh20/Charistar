import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function PullToRefresh({ children, onRefresh }) {
  const [pullDist, setPullDist] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const scrollRef = useRef(null);

  const MAX_PULL = 120;
  const THRESHOLD = 80;

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only allow pull if we are at the very top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && window.scrollY === 0) {
        // Prevent default scrolling when pulling down at the top
        e.preventDefault();
        
        // Add some resistance to the pull
        const resistance = diff * 0.4;
        setPullDist(Math.min(resistance, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDist >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        // Snap the goo back up immediately while showing the spinner
        setPullDist(0);
        
        if (onRefresh) {
          await onRefresh();
        } else {
          // Default silent refresh delay (simulate network)
          await new Promise(res => setTimeout(res, 1500));
        }
        
        setIsRefreshing(false);
      } else {
        // User didn't pull far enough, snap back
        setPullDist(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDist, isRefreshing, onRefresh]);

  // Calculate SVG Path for Gooey Effect
  // viewBox is "0 0 100 100" (width 100, height scales)
  // We draw a curve from top left (0,0) to top right (100,0)
  // The control points pull the center down based on pullDist.
  
  const curveDepth = Math.min(pullDist, MAX_PULL);
  
  const svgPath = `
    M 0 0 
    L 100 0 
    C 100 ${curveDepth * 0.2}, 75 ${curveDepth}, 50 ${curveDepth}
    C 25 ${curveDepth}, 0 ${curveDepth * 0.2}, 0 0 
    Z
  `;

  return (
    <div className="relative w-full h-full min-h-screen bg-charistar-dark overflow-hidden">
      
      {/* Gooey SVG Overlay */}
      <div 
        className="fixed top-0 left-0 w-full flex justify-center z-40 pointer-events-none"
        style={{ height: MAX_PULL }}
      >
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="w-full absolute top-0 left-0 transition-all duration-100 ease-out"
          style={{ height: pullDist > 0 ? pullDist : 0, opacity: pullDist > 0 ? 1 : 0 }}
        >
          <path 
            d={svgPath} 
            fill="var(--accent)" 
            style={{ transition: 'd 0.1s ease-out' }} 
          />
        </svg>

        {/* Pull Indicator Icon */}
        <div 
          className="absolute flex items-center justify-center transition-all duration-100"
          style={{ 
            top: pullDist / 2, 
            opacity: pullDist / THRESHOLD 
          }}
        >
          <div className="w-2 h-2 rounded-full bg-[var(--accent-text)]"></div>
        </div>
      </div>

      {/* Refresh Spinner State */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.5 }}
            animate={{ opacity: 1, y: 30, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.5 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-[var(--accent)] text-[var(--accent-text)] p-3 rounded-full shadow-[0_0_20px_var(--accent)]"
          >
            <Loader2 size={24} className="animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div 
        className="w-full min-h-screen"
        animate={{ y: isRefreshing ? 20 : pullDist * 0.2 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
