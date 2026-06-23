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
import Loader from '../components/Loader';

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
    import('./ProductDetails').catch(() => {});
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
      className={`flex flex-col group will-change-transform cursor-pointer ${spanClass}`}
      style={{ transform: 'translate3d(0,0,0)' }}
      onClick={() => onNavigate(item.id || index)}
    >
      {/* Product Image Frame with reduced curve */}
      <div className={`w-full overflow-hidden relative mb-3 bg-[#0a0a0a] rounded-2xl shadow-[0_8px_20px_-8px_rgba(0,0,0,0.4)] ${isHighlight ? 'border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)] bg-gradient-to-b from-[#1a1a1a] to-black' : 'border border-white/5'} ${isBanner ? 'aspect-[21/9]' : 'aspect-[4/4.5]'}`}>
        
        {/* Like Button inside image */}
        <button 
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md shadow-sm hover:bg-black/60 transition-colors border border-white/10"
        >
          <Heart size={16} className={item.id === 1 || item.id === 2 ? 'text-charistar-green fill-charistar-green' : 'text-white'} strokeWidth={2} />
        </button>

        <img 
          src={item.image || item.img} 
          alt={item.title} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out" 
        />
        
        {/* Floating Add to Cart Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(e, item);
          }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-[12px] bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-charistar-green hover:text-black hover:border-transparent hover:scale-110 active:scale-90 transition-all shadow-lg z-20"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
      
      {/* Typography Under the Photo */}
      <div className="px-1 block">
        <h4 className={`text-white font-extrabold leading-snug line-clamp-2 tracking-tight group-hover:text-charistar-green transition-colors ${isBanner ? 'text-[22px] mb-1' : 'text-[15px] mb-0.5'}`}>{item.title}</h4>
        <span className={`text-charistar-green font-bold opacity-100 ${isBanner ? 'text-lg' : 'text-[14px]'}`}>{item.price}</span>
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
    import('./ProductDetails').catch(() => {});
  };
  return (
    <div 
      className="tap-target flex-shrink-0 w-[150px] flex flex-col group will-change-transform cursor-pointer"
      style={{ transform: 'translate3d(0,0,0)' }}
      onMouseEnter={handlePreload}
      onTouchStart={handlePreload}
      onClick={() => onNavigate(parfait.id)}
    >
      <div className="w-full aspect-[4/4.5] overflow-hidden relative mb-2.5 bg-[#0a0a0a] rounded-2xl shadow-sm border border-white/5">
        <img 
          src={parfait.img} 
          alt={parfait.title} 
          loading="lazy" 
          decoding="async" 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out" 
        />
        
        <button
          className="absolute bottom-2 right-2 w-8 h-8 rounded-[10px] bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-charistar-green hover:text-black transition-colors active:scale-90 shadow-sm z-20"
          onClick={(e) => { e.stopPropagation(); onAddToCart(e, parfait); }}
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-0.5">
        <h4 className="text-white font-extrabold text-[13px] leading-snug line-clamp-2 tracking-tight group-hover:text-charistar-green transition-colors mb-0.5">{parfait.title}</h4>
        <span className="text-charistar-green font-bold text-[12px]">{parfait.price}</span>
      </div>
    </div>
  );
});


// Memoized Flat Auto-playing Banner Carousel
const FlatBannerCarousel = memo(({ slides }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (!slides || slides.length === 0) return null;
  const safeIndex = index >= slides.length ? 0 : index;
  const slide = slides[safeIndex];
  if (!slide) return null;

  return (
    <section className="relative w-full h-[150px] sm:h-[180px] rounded-2xl overflow-hidden mb-6 shadow-sm border border-white/5 bg-[#121212]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id || safeIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image */}
          <img 
            src={slide.imageUrl || "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80"} 
            alt={slide.title} 
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover" 
          />
          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          
          {/* Text Content */}
          <div className="absolute inset-0 flex flex-col justify-center p-5 z-10 w-[75%]">
            <span className="inline-block text-[9px] font-bold tracking-[0.1em] text-charistar-green uppercase mb-1">
              Featured
            </span>
            <h2 className="text-white text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1.5">
              {slide.title} {slide.titleAccent && <span className="text-charistar-green">{slide.titleAccent}</span>}
            </h2>
            <p className="text-gray-300 text-[11px] sm:text-xs font-medium line-clamp-2 w-full">{slide.subtitle}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Flat Indicator Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-5 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'bg-charistar-green w-5' : 'bg-white/40 w-1.5 hover:bg-white/80'
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
  const [loadingData, setLoadingData] = useState(() => {
    try {
      const cached = localStorage.getItem('charistar_products_cache');
      if (cached && JSON.parse(cached).length > 0) return false;
    } catch (e) {}
    return true;
  });
  const { theme, setTheme } = useTheme();

  const handleCycleTheme = () => {
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    setTheme(themeKeys[nextIndex]);
  };
  
  const [slides, setSlides] = useState([]);
  const [sections, setSections] = useState(DEFAULT_SECTIONS); // now safe — module-level constant
  const [searchQuery, setSearchQuery] = useState('');
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
      id: 'default-fura',
      title: "Fresh millet & greek yogurt blend",
      titleAccent: "Fura da Nono",
      subtitle: "Sourced locally, prepared cleanly, delivered fresh.",
      btnText: "Order Parfait",
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80",
      background: "green-gradient"
    },
    {
      id: 'default-zobo',
      title: "Hibiscus infused berry goodness",
      titleAccent: "Zobo Berry",
      subtitle: "Vibrant local flavors meets premium yogurt layers.",
      btnText: "Order Parfait",
      imageUrl: "https://images.unsplash.com/photo-1488477304112-49658c47eefb?w=600&q=80",
      background: "dark-gradient"
    },
    {
      id: 'default-tigernut',
      title: "Rich Kunu Aya inspired blend",
      titleAccent: "Tigernut Coconut",
      subtitle: "Creamy, lactose-free natural nourishment.",
      btnText: "Order Now",
      imageUrl: "https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=600&q=80",
      background: "green-gradient"
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
      className="bg-charistar-dark min-h-screen relative overflow-hidden"
    >
      {/* Ambient Lighting Orbs */}
      <div className="ambient-orb w-64 h-64 top-[-5%] left-[-10%]" style={{ '--orb-color': 'rgba(163, 198, 68, 0.4)' }} />
      <div className="ambient-orb w-72 h-72 top-[40%] right-[-15%]" style={{ animationDelay: '2s', '--orb-color': 'rgba(4, 120, 87, 0.4)' }} />
      <div className="ambient-orb w-80 h-80 bottom-[-10%] left-[20%]" style={{ animationDelay: '4s', '--orb-color': 'rgba(163, 198, 68, 0.15)' }} />

      <div className="perspective-container min-h-full w-full relative z-10">
        <div 
          className="px-5 pt-5 bg-transparent min-h-full font-sans pb-32 under-sheet-content"
          style={{ willChange: 'transform' }}
        >
          {/* Sticky Header & Search */}
          <div className="sticky top-0 z-40 bg-charistar-dark/80 backdrop-blur-xl -mx-5 px-5 pb-4 pt-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <header className="mb-4">
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
                        src={`https://api.dicebear.com/9.x/micah/svg?seed=${displayName}&backgroundColor=transparent`}
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
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                <Search size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Search for yogurt or parfait..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-[13px] font-semibold text-white placeholder-gray-500 outline-none focus:border-charistar-green focus:bg-white/[0.08] transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/shop?q=${encodeURIComponent(e.target.value)}`);
                  }
                }}
              />
            </div>
          </div>

          <div className="mt-4">
            {/* Flat Top Banner Slider */}
            <FlatBannerCarousel slides={displaySlides} />
          </div>
          {/* Dynamic Homepage Sections */}
          <div className="space-y-10">
            {sections.map((section) => {
              const IconComponent = getSectionIconComponent(section.icon);
              const sectionCategory = section.category || 'All';
              
              // Filter products based on the section's configured category and search query
              const filterCat = sectionCategory;
              
              const filteredList = products.filter(item => {
                const matchesCategory = filterCat === 'All' || item.category === filterCat;
                const matchesSearch = !searchQuery || 
                  (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (item.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch;
              });

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

                    <div className="grid grid-cols-2 gap-4 px-1">
                      {loadingData ? (
                        <Loader type="skeleton" count={3} />
                      ) : filteredList.length === 0 ? (
                        <p className="text-gray-500 text-xs italic bg-white/5 p-6 rounded-2xl text-center border border-white/5">
                          No products found in this section.
                        </p>
                      ) : (
                        filteredList.map((item, i) => (
                          <motion.div
                            key={item.id || i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02, y: -4 }}
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

