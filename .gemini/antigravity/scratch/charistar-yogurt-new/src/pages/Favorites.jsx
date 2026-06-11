import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Plus } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useFavorites } from '../hooks/useFavorites';
import { useCart } from '../contexts/CartContext';
import { products as localProducts } from '../data/products';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, isFavorite, toggleFavorite, loading: favsLoading } = useFavorites();
  const { addToCart } = useCart();
  const [products, setProducts] = useState(localProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(fetched);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching live products:", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const favoriteProducts = products.filter(p => isFavorite(p.id));
  const isLoading = loading || favsLoading;

  return (
    <div 
      className="min-h-screen bg-charistar-dark pb-32 font-sans animate-fadeIn"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur-xl px-6 pt-12 pb-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-transform border border-white/5">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Your Favorites</h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isLoading ? 'Checking items...' : `${favoriteProducts.length} Saved Items`}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="glass-panel p-3 rounded-[2rem] border border-white/5 flex flex-col h-[230px]">
                <div className="w-full aspect-square rounded-2xl bg-white/5 mb-3" />
                <div className="w-2/3 h-3 bg-white/10 rounded-full mb-2" />
                <div className="w-1/2 h-3 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 relative animate-float mx-auto">
              <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl"></div>
              <Heart size={40} className="text-red-500 relative z-10" />
            </div>
            <h4 className="text-white text-xl font-black tracking-tight mb-2">No favorites yet</h4>
            <p className="text-gray-400 text-xs font-semibold max-w-[220px] mx-auto mb-8">Tap the heart icon on any product to save it here for quick access later.</p>
            <button 
              onClick={() => navigate('/')}
              className="bg-charistar-green text-black text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favoriteProducts.map((product) => (
              <div 
                key={product.id}
                className="glass-panel p-3 rounded-[2rem] border border-white/5 relative flex flex-col cursor-pointer bg-black/40 group active:scale-[0.98] transition-transform"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Heart Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                  className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-red-500 active:scale-90 transition-transform"
                >
                  <Heart size={14} fill="currentColor" />
                </button>

                {/* Product Image */}
                <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden bg-white/5 relative mb-3">
                  <img src={product.image || product.img} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-[13px] font-black leading-tight line-clamp-2">{product.title}</h3>
                    <p className="text-gray-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{product.category}</p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-charistar-green text-sm font-black">{product.price}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-charistar-green hover:text-black flex items-center justify-center text-white active:scale-90 transition-all shadow"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


