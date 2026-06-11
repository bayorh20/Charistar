import React, { useState, useEffect, memo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../contexts/CartContext';
import { products as localProducts } from '../data/products';

// Memoized GPU-Accelerated Shop Card with Hover/Touch Details Preloader
const ShopProductCard = memo(({ product, onAddToCart, onNavigate }) => {
  const handlePreload = () => {
    if (product.image || product.img) {
      const img = new Image();
      img.src = product.image || product.img;
    }
  };

  const style = product.displayStyle || 'Standard';

  // Base Grid Spans
  let spanClass = "col-span-1";
  if (style === 'Featured') spanClass = "col-span-1 sm:col-span-2";
  if (style === 'Banner') spanClass = "col-span-2 sm:col-span-2 lg:col-span-4";
  if (style === 'Compact List') spanClass = "col-span-2 sm:col-span-2 md:col-span-2";

  if (style === 'Minimal') {
    return (
      <div className={`glass-panel rounded-2xl p-5 border border-white/10 flex justify-between items-center group cursor-pointer ${spanClass}`} onClick={() => onNavigate(product.id)}>
        <div>
          <h4 className="font-extrabold text-[16px] text-white mb-1 group-hover:text-charistar-green transition-colors">{product.title}</h4>
          <p className="text-[12px] text-gray-400 font-medium line-clamp-1">{product.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-[18px] text-white">{product.price}</span>
          <button 
            className="w-10 h-10 bg-charistar-green rounded-xl flex items-center justify-center text-black shadow-sm active:scale-90 transition-transform" 
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  }

  if (style === 'Compact List') {
    return (
      <div className={`glass-panel rounded-2xl p-4 border border-white/10 flex gap-4 items-center group cursor-pointer ${spanClass}`} onClick={() => onNavigate(product.id)}>
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
          <img src={product.image || product.img} alt={product.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-extrabold text-[16px] text-white mb-1 group-hover:text-charistar-green transition-colors leading-tight">{product.title}</h4>
          <p className="text-[12px] text-gray-400 font-medium line-clamp-1 mb-2">{product.subtitle}</p>
          <div className="flex justify-between items-center pr-2">
            <span className="font-extrabold text-[16px] text-white">{product.price}</span>
            <button 
              className="w-9 h-9 bg-charistar-green rounded-xl flex items-center justify-center text-black shadow-sm active:scale-90 transition-transform" 
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
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
      className={`flex flex-col group will-change-transform animate-fadeIn ${spanClass}`}
      onMouseEnter={handlePreload}
      onTouchStart={handlePreload}
    >
      <div 
        onClick={() => onNavigate(product.id)}
        className="block relative cursor-pointer"
      >
        {/* Product Image Frame */}
        <div className={`w-full rounded-[2rem] overflow-hidden bg-[#0a0a0a] relative mb-4 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.4)] ${isHighlight ? 'border-2 border-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.2)]' : 'border border-white/5'} ${isBanner ? 'aspect-[21/9]' : isFeatured ? 'aspect-square' : 'aspect-[4/5]'}`}>
          <img 
            src={product.image || product.img} 
            alt={product.title} 
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out" 
          />
          
          {/* Floating Add to Cart Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-charistar-green hover:text-black hover:border-transparent hover:scale-110 active:scale-90 transition-all shadow-lg z-20"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Elegant Typography Outside the Card */}
      <div 
        onClick={() => onNavigate(product.id)}
        className="px-1 block cursor-pointer"
      >
        <h3 className={`text-white font-black leading-snug line-clamp-2 mb-2 tracking-tight group-hover:text-charistar-green transition-colors ${isBanner ? 'text-[24px]' : 'text-[15px]'}`}>{product.title}</h3>
        <span className={`text-white font-bold opacity-90 ${isBanner ? 'text-xl' : 'text-sm'}`}>{product.price || "0.00"}</span>
      </div>
    </div>
  );
});



export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const { addToCart } = useCart();
  
  const handleAddToCart = useCallback((prod) => {
    addToCart(prod);
  }, [addToCart]);

  const handleNavigate = useCallback((id) => {
    navigate(`/product/${id}`);
  }, [navigate]);

  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('charistar_products_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('charistar_products_cache');
      return !(cached && JSON.parse(cached).length > 0);
    } catch (e) {
      return true;
    }
  });
  
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const cats = Array.from(new Set(products.map(p => p.category)));
      setCategories(cats.map(name => ({ name })));
    }
  }, [products]);

  const displayCategories = ['All', ...(categories.length > 0 ? categories.map(c => c.name) : ['Parfait', 'Yogurt', 'Drinks', 'Smoothie'])];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const fetched = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.active !== false);
      fetched.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? Number(a.sortOrder) : 9999;
        const orderB = b.sortOrder !== undefined ? Number(b.sortOrder) : 9999;
        return orderA - orderB;
      });
      setProducts(fetched);
      try {
        localStorage.setItem('charistar_products_cache', JSON.stringify(fetched));
      } catch (e) {}
      setLoading(false);
    }, (err) => {
      console.error("Error fetching live products:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Update URL as user types
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesQuery = product.title.toLowerCase().includes(query.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(query.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div 
      className="min-h-screen bg-[#050505] pb-32 font-sans animate-fadeIn"
    >
      {/* Immersive Glass Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/70 backdrop-blur-[30px] pt-12 pb-3 px-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <h1 className="text-3xl font-black text-white tracking-tighter mb-5">Menu</h1>
        
        {/* Floating Capsule Search */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-charistar-green">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search our catalog..." 
            className="w-full bg-white/10 border border-white/5 rounded-full pl-12 pr-12 py-3.5 text-[14px] font-semibold text-white placeholder-gray-400 outline-none focus:border-charistar-green/50 focus:bg-white/[0.12] transition-all shadow-inner"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Elegant Minimal Categories */}
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-1">
          {displayCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="relative py-2 flex flex-col items-center flex-shrink-0 group"
            >
              <span className={`text-[13px] font-bold tracking-wide transition-colors duration-300 ${
                activeCategory === cat ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
              }`}>
                {cat}
              </span>
              {activeCategory === cat && (
                <div 
                  className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-charistar-green shadow-[0_0_8px_#A3C644]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 animate-pulse">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="flex flex-col">
                <div className="w-full aspect-[4/5] rounded-[2rem] bg-white/5 border border-white/5 relative mb-4 shadow-sm" />
                <div className="px-1 space-y-2">
                  <div className="w-1/3 h-2.5 bg-white/10 rounded-full" />
                  <div className="w-3/4 h-3 bg-white/15 rounded-full" />
                  <div className="w-1/2 h-3.5 bg-white/20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="relative w-32 h-32 mb-8 flex justify-center items-center">
              <div className="absolute inset-0 bg-charistar-green/5 rounded-full blur-3xl"></div>
              <Search size={48} className="text-gray-600 drop-shadow-xl z-10" strokeWidth={1} />
              <div 
                className="absolute -top-2 -right-2 text-3xl z-20 animate-bounce"
              >
                👀
              </div>
            </div>
            <h4 className="text-white text-2xl font-black tracking-tighter mb-3">Nothing Found</h4>
            <p className="text-gray-500 text-sm font-semibold max-w-[240px] mx-auto mb-8 leading-relaxed">
              We couldn't find anything matching "{query}".
            </p>
            <button 
              onClick={() => { setQuery(''); setActiveCategory('All'); }}
              className="bg-white text-black text-xs font-black uppercase tracking-widest px-8 py-4 rounded-[1.5rem] hover:scale-105 active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,255,255,0.15)]"
            >
              Reset Search
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8">
            {filteredProducts.map((product) => (
              <ShopProductCard 
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


