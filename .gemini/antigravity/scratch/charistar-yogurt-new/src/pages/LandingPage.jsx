import { Search, MapPin, Bell, ChevronDown, Plus, Heart, Sparkles, Milk, IceCream, Citrus, CupSoda, Star, Soup, Truck, Clock3, Gift, Flame, Percent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { products as localProducts } from '../data/products';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme, THEMES } from '../contexts/ThemeContext';

// Module-level constant — defined BEFORE the component so it's always available
const DEFAULT_SECTIONS = [
  {
    id: 'default-grid',
    title: "Our Yogurts & Drinks",
    type: "grid",
    category: "All",
    icon: "Milk",
    sortOrder: 0
  },
  {
    id: 'default-banner',
    title: "Grab a bowl of Parfait",
    subtitle: "Layered, fresh & made to order daily",
    buttonText: "Order Parfait",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80",
    type: "banner",
    category: "Parfait",
    icon: "Soup",
    sortOrder: 1
  },
  {
    id: 'default-scroll',
    title: "Fresh Parfaits List",
    type: "horizontal_scroll",
    category: "Parfait",
    icon: "IceCream",
    sortOrder: 2
  }
];

// Memoized GPU-Accelerated Product Card with Instant Pre-loader on hover/touch
const ProductCard = memo(({ item, index, onAddToCart, onNavigate, onLike }) => {
  const handlePreload = () => {
    if (item.image || item.img) {
      const img = new Image();
      img.src = item.image || item.img;
    }
  };

  const style = item.displayStyle || 'Standard';

  // Base Grid Spans
  let spanClass = "col-span-1";
  if (style === 'Featured') spanClass = "col-span-1 sm:col-span-2";
  if (style === 'Banner') spanClass = "col-span-2 sm:col-span-2 lg:col-span-4";
  if (style === 'Compact List') spanClass = "col-span-2 sm:col-span-2 md:col-span-2";

  if (style === 'Minimal') {
    return (
      <div 
        className={`glass-panel rounded-2xl p-5 border border-white/10 flex justify-between items-center group cursor-pointer ${spanClass}`} onClick={() => onNavigate(item.id || index)}>
        <div>
          <h4 className="font-extrabold text-[16px] text-white mb-1 group-hover:text-charistar-green transition-colors">{item.title}</h4>
          <p className="text-[12px] text-gray-400 font-medium line-clamp-1">{item.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-[18px] text-white">{item.price}</span>
          <button 
            className="w-10 h-10 bg-charistar-green rounded-xl flex items-center justify-center text-black shadow-sm active:scale-90 transition-transform" 
            onClick={(e) => { e.stopPropagation(); onAddToCart(e, item); }}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  }

  if (style === 'Compact List') {
    return (
      <div className={`glass-panel rounded-2xl p-4 border border-white/10 flex gap-4 items-center group cursor-pointer ${spanClass}`} onClick={() => onNavigate(item.id || index)}>
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
          <img src={item.image || item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-extrabold text-[16px] text-white mb-1 group-hover:text-charistar-green transition-colors leading-tight">{item.title}</h4>
          <p className="text-[12px] text-gray-400 font-medium line-clamp-1 mb-2">{item.subtitle}</p>
          <div className="flex justify-between items-center pr-2">
            <span className="font-extrabold text-[16px] text-white">{item.price}</span>
            <button 
              className="w-9 h-9 bg-charistar-green rounded-xl flex items-center justify-center text-black shadow-sm active:scale-90 transition-transform" 
              onClick={(e) => { e.stopPropagation(); onAddToCart(e, item); }}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isBanner = style === 'Banner';
  const isFeatured = style === 'Featured';
  const isHighlight = style === 'Highlight';

  return (
    <div 
      className={`glass-panel rounded-2xl p-5 relative flex flex-col group will-change-transform ${spanClass} ${isHighlight ? 'border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)] bg-gradient-to-b from-[#1a1a1a] to-black' : 'border border-white/8 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)]'}`}
      style={{ transform: 'translate3d(0,0,0)' }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        className="absolute top-7 right-7 z-10 w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 shadow-sm hover:bg-black/80 transition-colors"
      >
        <Heart size={18} className={item.id === 1 || item.id === 2 ? 'text-charistar-green fill-charistar-green' : 'text-white'} strokeWidth={2} />
      </button>
      
      {/* Product Image navigates to Details Page */}
      <div 
        onClick={() => onNavigate(item.id || index)}
        className={`block tap-target w-full mb-4 rounded-xl overflow-hidden shadow-[0_8px_20px_-8px_rgba(0,0,0,0.4)] border border-white/10 cursor-pointer ${isBanner ? 'h-[300px]' : isFeatured ? 'h-[260px]' : 'h-[220px]'}`}
      >
         <img 
           src={item.image || item.img} 
           alt={item.title} 
           loading="lazy"
           decoding="async"
           className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out" 
         />
      </div>
      
      <div className="px-2">
        {/* Title Link navigates to Details */}
        <div 
          onClick={() => onNavigate(item.id || index)}
          className="hover:text-charistar-green transition-colors inline-block cursor-pointer"
        >
          <h4 className={`font-extrabold tracking-tight mb-2 leading-snug text-white ${isBanner ? 'text-[24px]' : 'text-[18px]'}`}>{item.title}</h4>
        </div>
        <p className="text-[13px] text-gray-400 leading-relaxed mb-5 line-clamp-2 font-medium">{item.subtitle}</p>
        
        <div className="flex justify-between items-center">
          <span className={`font-extrabold tracking-tighter text-white ${isBanner ? 'text-[26px]' : 'text-[22px]'}`}>{item.price}</span>
          {/* Plus button click adds directly to cart instantly */}
          <button 
            className="w-11 h-11 bg-charistar-green rounded-xl flex items-center justify-center text-black shadow-sm active:scale-90 transition-transform" 
            onClick={(e) => { e.stopPropagation(); onAddToCart(e, item); }}
          >
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
});

// Memoized Parfait Card
const ParfaitCard = memo(({ parfait, index, onAddToCart, onNavigate }) => {
  const handlePreload = () => {
    if (parfait.img) {
      const img = new Image();
      img.src = parfait.img;
    }
  };
  return (
    <div 
      className="tap-target flex-shrink-0 w-[180px] glass-panel rounded-2xl p-4 flex flex-col will-change-transform"
      style={{ transform: 'translate3d(0,0,0)' }}
      onMouseEnter={handlePreload}
      onTouchStart={handlePreload}
    >
      <div 
        onClick={() => onNavigate(parfait.id)}
        className="tap-target w-full h-[145px] rounded-xl overflow-hidden mb-3 border border-white/10 cursor-pointer"
      >
        <img src={parfait.img} alt={parfait.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
      </div>
      <h4 className="font-extrabold text-[14px] text-white tracking-tight leading-snug mb-1.5">{parfait.title}</h4>
      <p className="text-[12px] text-gray-500 font-medium mb-3 line-clamp-1">{parfait.sub}</p>
      <div className="flex justify-between items-center mt-auto">
        <span className="font-extrabold text-[15px] text-white">{parfait.price}</span>
        <button
          className="w-8 h-8 bg-charistar-green rounded-lg flex items-center justify-center text-black shadow-sm active:scale-90 transition-transform"
          onClick={(e) => { e.stopPropagation(); onAddToCart(e, parfait); }}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
});


// Memoized Premium Dynamic Auto-playing Hero Carousel Banner with indicators
const HeroCarousel = memo(({ slides }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;
  const safeIndex = index >= slides.length ? 0 : index;
  const slide = slides[safeIndex];
  if (!slide) return null;

  return (
    <section className="relative w-full h-[180px] rounded-[32px] overflow-hidden shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] mb-8 border border-white/5 bg-charistar-gray">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id || safeIndex}
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -25 }}
          transition={{ duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute inset-0 w-full h-full flex flex-row items-center justify-between"
          style={{
            background: slide.background === 'green-gradient' 
              ? 'linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 40%, #0a1a0a 100%)' 
              : 'var(--bg-secondary)'
          }}
        >
          <div className="relative z-10 w-[65%] p-7">
            <h2 className="text-white text-3xl font-extrabold tracking-tight leading-[1.1] mb-3">
              {slide.title} <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-charistar-green to-emerald-400">
                {slide.titleAccent}
              </span>
            </h2>
            <p className="text-gray-400 text-xs font-medium mb-5 tracking-wide">{slide.subtitle}</p>
            <button className="bg-charistar-green text-black font-bold text-[13px] px-6 py-3 rounded-full shadow-sm active:scale-95 transition-transform">
              {slide.btnText || 'Order Now'}
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-charistar-green/20 to-transparent blur-2xl z-0"></div>
          
          {/* Floating Image */}
          <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-[180px] h-[180px] z-10 drop-shadow-xl">
             <img 
               src={slide.imageUrl || "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80"} 
               alt={slide.titleAccent || "Parfait"} 
               decoding="async"
               fetchPriority="high"
               className="w-full h-full object-cover rounded-full border-4 border-white/5 shadow-xl scale-110" 
             />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicator dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-7 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === index ? 'bg-charistar-green w-5' : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
});



export default function LandingPage() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const emoji = hour < 12 ? '🌤️' : hour < 18 ? '☀️' : '🌙';
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('charistar_products_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Also filter inactive from cache to match the live listener behavior
        return Array.isArray(parsed) ? parsed.filter(p => p.active !== false) : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });
  const [loadingData, setLoadingData] = useState(true);
  const { theme, setTheme } = useTheme();

  const handleCycleTheme = () => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };
  
  const [slides, setSlides] = useState([]);
  const [sections, setSections] = useState(DEFAULT_SECTIONS); // now safe — module-level constant
  const yogurtsRef = useRef(null);
  const parfaitRef = useRef(null);

  const ICON_MAP = {
    Milk,
    IceCream,
    Citrus,
    CupSoda,
    Sparkles,
    Soup,
    Star,
    Gift,
    Flame,
    Percent
  };

  const getSectionIconComponent = (iconName) => {
    return ICON_MAP[iconName] || Sparkles;
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'slides'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSlides(fetched);
    }, (err) => {
      console.error("Error fetching slides:", err);
    });
    return () => unsub();
  }, []);

  const activeSlides = slides.filter(s => s.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  const displaySlides = activeSlides.length > 0 ? activeSlides : [
    {
      id: 'default-1',
      title: 'Free Delivery',
      titleAccent: 'For Parfait',
      subtitle: 'Up to 3 times per day',
      btnText: 'Order Now',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
      background: 'charistar-gray'
    }
  ];

  const handleCategoryClick = (catName) => {
    if (catName === 'All') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (catName === 'Parfait') {
      parfaitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      yogurtsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const fetched = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // Only show active products (active is true or undefined — not explicitly false)
        .filter(item => item.active !== false);
      fetched.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? Number(a.sortOrder) : 9999;
        const orderB = b.sortOrder !== undefined ? Number(b.sortOrder) : 9999;
        return orderA - orderB;
      });
      setProducts(fetched);
      try {
        localStorage.setItem('charistar_products_cache', JSON.stringify(fetched));
      } catch (e) {
        console.error("Failed to write to localStorage:", e);
      }
      setLoadingData(false);
    }, (err) => {
      console.error("Error fetching live products:", err);
      setLoadingData(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'homepage_sections'), (snapshot) => {
      if (!snapshot.empty) {
        let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Only update if we got valid sections with a known type — prevents
        // Firestore cache delivering a stale empty/partial snapshot that wipes the UI
        const validSections = fetched.filter(s => s.type && ['grid', 'banner', 'horizontal_scroll'].includes(s.type));
        if (validSections.length > 0) {
          validSections.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setSections(validSections);
        }
        // If sections exist in DB but have no valid types, keep DEFAULT_SECTIONS
      }
      // If snapshot is empty, we intentionally do nothing — DEFAULT_SECTIONS stays
      // (no auto-seeding: non-admin users cannot write to homepage_sections)
    }, (err) => {
      console.error("Error fetching homepage sections:", err);
      // On error, DEFAULT_SECTIONS initialized in useState keeps the UI alive
    });
    return () => unsub();
  }, []);


  const handleRefresh = () => {
    // Already in real-time, no-op or just visually complete
  };

  const handleProfileClick = () => {
    if (!currentUser) navigate('/login');
    else navigate('/profile');
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
    // No need to declare theme here again
  const themeOrder = ['dark', 'light', 'green'];
  const nextTheme = THEMES[themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]];

  const handleAddToCart = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item, 1, e);
  }, [addToCart]);

  const handleCardNavigate = useCallback((id) => {
    navigate(`/product/${id}`);
  }, [navigate]);

  const handleLike = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.08 }}
      className="bg-charistar-dark min-h-screen"
    >
      <div className="perspective-container min-h-full w-full">
        <div 
          className="px-5 pt-5 bg-transparent min-h-full font-sans pb-32 under-sheet-content"
          style={{ willChange: 'transform' }}
        >
          <header className="mb-6 pt-1">
            <div className="flex justify-between items-center gap-4 mb-2">
              <div>
                <p className="text-[12px] text-gray-500 font-medium mb-1">
                  {greeting}, {currentUser ? (currentUser.name || currentUser.displayName || '').split(' ')[0] : 'Guest'}! {emoji}
                </p>
                <h1 className="text-[28px] font-black text-white leading-tight tracking-tight">
                  What do you{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-charistar-green via-emerald-300 to-charistar-green bg-[length:200%_auto] animate-shimmer">
                    crave
                  </span>?
                </h1>
              </div>

              {/* Theme switcher + Avatar row */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Theme cycle button */}
                <button
                  onClick={handleCycleTheme}
                  title="Personalize Theme"
                  className="tap-target w-10 h-10 rounded-2xl glass-panel border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)] active:scale-90 hover:scale-105"
                  style={{ transition: 'transform 80ms ease' }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{THEMES[theme].emoji}</span>
                  <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary, #a0a0a0)' }}>{THEMES[theme].label}</span>
                </button>

                {/* Avatar */}
                <div className="relative tap-target group" onClick={handleProfileClick}>
                  <div className="w-11 h-11 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${displayName}`}
                      alt="User Avatar"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover bg-charistar-green/10"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-charistar-dark rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-charistar-green rounded-full shadow-sm"></span>
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search for yogurt or parfait..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-[13px] font-semibold text-white placeholder-gray-500 outline-none focus:border-charistar-green focus:bg-white/[0.08] transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/shop?q=${encodeURIComponent(e.target.value)}`);
                }
              }}
            />
          </div>

          {/* Hero Banner Slider */}
          <HeroCarousel slides={displaySlides} />



          {/* Dynamic Homepage Sections */}
          <div className="space-y-10">
            {sections.map((section) => {
              const IconComponent = getSectionIconComponent(section.icon);
              const sectionCategory = section.category || 'All';
              
              // Filter products based on the section's configured category.
              const filterCat = sectionCategory;
              
              const filteredList = products.filter(item => filterCat === 'All' || item.category === filterCat);

              if (section.type === 'grid') {
                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-10px" }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    key={section.id}
                  >
                    <div ref={yogurtsRef} className="flex justify-between items-center mb-5 px-1 pt-2">
                      <h3 className="font-bold text-[18px] text-white tracking-tight">
                        {section.title}
                      </h3>
                      <button 
                        onClick={() => {
                          if (section.category !== 'All') {
                            handleCategoryClick(section.category);
                          } else {
                            navigate('/shop');
                          }
                        }}
                        className="text-[13px] text-gray-500 font-semibold hover:text-charistar-green transition-colors"
                      >
                        See all
                      </button>
                    </div>

                    <div className="flex flex-col gap-6 px-1">
                      {filteredList.length === 0 ? (
                        <p className="text-gray-500 text-xs italic bg-white/5 p-6 rounded-2xl text-center border border-white/5">
                          No products found in this section.
                        </p>
                      ) : (
                        filteredList.map((item, i) => (
                          <motion.div
                            key={item.id || i}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: "-30px" }}
                            transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.3), ease: "easeOut" }}
                          >
                            <ProductCard 
                              item={item}
                              index={i}
                              onAddToCart={handleAddToCart}
                              onNavigate={handleCardNavigate}
                              onLike={handleLike}
                            />
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                );
              }

              if (section.type === 'horizontal_scroll') {
                return (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-10px" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    key={section.id}
                  >
                    <div className="flex justify-between items-center mb-5 px-1">
                      <h3 className="font-bold text-[18px] text-white tracking-tight">
                        {section.title}
                      </h3>
                      <button 
                        onClick={() => {
                          if (section.category !== 'All') {
                            handleCategoryClick(section.category);
                          } else {
                            navigate('/shop');
                          }
                        }}
                        className="text-[13px] text-gray-500 font-semibold hover:text-charistar-green transition-colors"
                      >
                        See all
                      </button>
                    </div>

                    <div className="flex gap-4 px-1 overflow-x-auto no-scrollbar pb-2">
                      {filteredList.length === 0 ? (
                        <p className="text-gray-500 text-xs italic bg-white/5 p-6 rounded-2xl text-center border border-white/5 w-full">
                          No products configured.
                        </p>
                      ) : (
                        filteredList.map((item, i) => (
                          <ParfaitCard 
                            key={item.id || i}
                            parfait={{
                              id: item.id,
                              title: item.title,
                              sub: item.subtitle,
                              price: item.price ? (String(item.price).startsWith('₦') ? item.price : `₦${item.price}`) : '₦0',
                              img: item.image || item.img
                            }}
                            index={i}
                            onAddToCart={handleAddToCart}
                            onNavigate={handleCardNavigate}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                );
              }

              if (section.type === 'banner') {
                return (
                  <motion.section 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-10px" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    key={section.id} 
                    ref={parfaitRef} 
                    className="relative w-full h-[200px] rounded-[32px] overflow-hidden shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] my-4 border border-white/5" 
                    style={{background: 'linear-gradient(135deg, #0d1f0d 0%, #1a3a1a 40%, #0a1a0a 100%)'}}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-charistar-green/10 via-transparent to-emerald-900/20 z-0" />
                    <div className="absolute -right-10 -top-10 w-[200px] h-[200px] rounded-full bg-charistar-green/15 blur-[50px] z-0" />

                    <div className="relative z-10 flex flex-col justify-between h-full p-7">
                      <div>
                        <h2 className="text-white text-[22px] font-extrabold tracking-tight leading-[1.15] mb-2">
                          {section.title}
                        </h2>
                        {section.subtitle && (
                          <p className="text-gray-400 text-[13px] font-medium mb-5">{section.subtitle}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              if (section.category) {
                                handleCategoryClick(section.category);
                              }
                            }}
                            className="bg-charistar-green text-black font-bold text-[13px] px-5 py-2.5 rounded-full shadow-sm active:scale-95 transition-transform"
                          >
                            {section.buttonText || 'Explore'}
                          </button>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock3 size={13} />
                            <span className="text-[12px] font-semibold">Ready in 10 min</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {section.image && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[120px] h-[120px] z-10 drop-shadow-xl">
                        <img
                          src={section.image}
                          alt="Promo banner"
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover rounded-full border-4 border-charistar-green/30 shadow-sm"
                        />
                      </div>
                    )}
                  </motion.section>
                );
              }

              return null;
            })}
          </div>

        </div>
      </div>
    </motion.div>
  );
}

