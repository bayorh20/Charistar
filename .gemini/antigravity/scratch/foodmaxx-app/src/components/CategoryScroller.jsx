import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

const DefaultCategoryIcon = ({ color = '#FF5B26' }) => (
  <svg width="40" height="40" viewBox="0 0 32 32" fill="none" className="fallback-3d-icon">
    <defs>
      <linearGradient id={`goldGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
        <stop offset="50%" stopColor={color} />
        <stop offset="100%" stopColor="#3D2E2A" />
      </linearGradient>
    </defs>
    {/* 3D Cloche Food Platter cover */}
    <path d="M6 22h20v2H6v-2z" fill="#3D2E2A" />
    <path d="M7 21c0-6 4-9.5 9-9.5s9 3.5 9 9.5H7z" fill={`url(#goldGrad-${color.replace('#', '')})`} stroke="#3D2E2A" strokeWidth="1.5" />
    <circle cx="16" cy="9.5" r="2" fill="#3D2E2A" />
    <path d="M10 20c2-3 5-3.5 8-3.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const PASTEL_PALETTE = [
  '#FFF4E3', // Soft warm peach/cream
  '#FFEAE6', // Soft coral/orange
  '#F0E6FF', // Soft lavender purple
  '#FFE3EB', // Soft rose pink
  '#FFFCE6', // Soft custard yellow
  '#E3F5E3', // Soft minty green
  '#FDF2E2', // Soft warm sand/tan
  '#E0F4FF', // Soft sky blue
  '#E2F7F2', // Soft mint/teal
  '#FCE4EC'  // Soft pink-red
];

export const getPastelColor = (id, index) => {
  const normalizedId = String(id).toLowerCase().trim();
  const presetColors = {
    rice: '#FFF4E3',
    ricebowl: '#FFF4E3',
    pasta: '#FFEAE6',
    pastabowl: '#FFEAE6',
    yogurt: '#F0E6FF',
    parfait: '#FFE3EB',
    icecream: '#FFFCE6',
    salad: '#E3F5E3',
    shawarma: '#FDF2E2',
    snacks: '#E0F4FF',
    drinks: '#E0F7FA',
    beverages: '#E0F7FA',
    grills: '#FFEBEE',
    bbq: '#FFEBEE',
    swallow: '#F5EBE6',
    amala: '#F5EBE6'
  };
  if (presetColors[normalizedId]) return presetColors[normalizedId];
  
  if (typeof index === 'number') {
    return PASTEL_PALETTE[index % PASTEL_PALETTE.length];
  }
  
  let hash = 0;
  for (let i = 0; i < normalizedId.length; i++) {
    hash = normalizedId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_PALETTE[Math.abs(hash) % PASTEL_PALETTE.length];
};

const CategoryImage = ({ src, videoUrl, alt, fallbackIcon }) => {
  const [error, setError] = React.useState(false);
  
  // CRITICAL: Reset error state when image source changes (e.g. user uploads new file)
  React.useEffect(() => {
    setError(false);
  }, [src, videoUrl]);

  if (error) {
    return fallbackIcon;
  }

  if (videoUrl) {
    return (
      <video
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={() => setError(true)}
      />
    );
  }

  if (!src) {
    return fallbackIcon;
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      loading="lazy"
      decoding="async"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      onError={() => setError(true)}
    />
  );
};

const CategoryScroller = React.memo(function CategoryScroller({ activeCategory, onSelectCategory }) {
  const { categories, menuItems, pageLayout } = useContext(AppContext);

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (let i = 0; i < menuItems.length; i++) {
      const cat = menuItems[i].category;
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [menuItems]);

  const categoriesSection = pageLayout?.sections?.find(s => s.id === 'categories') || {};
  const layoutMode = categoriesSection.layout || 'grid';

  return (
    <div className={`category-bar layout-${layoutMode}`}>
      {categories.map((cat, idx) => {
        const isActive = activeCategory === cat.id;
        const bgColor = getPastelColor(cat.id, idx);
        
        return (
          <motion.button
            key={cat.id}
            className={`category-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
            aria-label={`Select ${cat.label} category`}
            aria-pressed={isActive}
            style={{ backgroundColor: bgColor }}
            whileHover={{ 
              translateY: -6, 
              rotateX: 12, 
              rotateY: -6, 
              translateZ: 10,
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)'
            }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="category-card-circle" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CategoryImage src={cat.image} videoUrl={cat.videoUrl} alt={cat.label} fallbackIcon={<DefaultCategoryIcon color={bgColor} />} />
            </div>
            <span className="category-card-label">{cat.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

export default CategoryScroller;
