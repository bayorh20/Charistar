import { ArrowLeft, MapPin, ShoppingBag, Star, Check } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { products as localProducts } from '../data/products';
import { useCart } from '../contexts/CartContext';
import { useState, useEffect } from 'react';
import { useReviews } from '../hooks/useReviews';
import ReviewModal from '../components/ReviewModal';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(() => {
    try {
      const cached = localStorage.getItem('charistar_products_cache');
      if (cached) {
        const list = JSON.parse(cached);
        const match = list.find(p => p.id === id || p.id === parseInt(id));
        if (match) return match;
      }
    } catch (e) {}
    return localProducts.find(p => p.id === parseInt(id)) || localProducts[0];
  });
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const { reviews, loading: reviewsLoading, submitReview, averageRating } = useReviews(product?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
    const safeId = String(id || '1');
    const unsub = onSnapshot(doc(db, 'products', safeId), (docSnap) => {
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      }
    }, (err) => {
      console.error('Error listening to live product details:', err);
    });
    return () => unsub();
  }, [id]);

  const handleToggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.some(a => a.name === addon.name);
      if (exists) {
        return prev.filter(a => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const basePrice = product?.price ? parseFloat(String(product.price).replace(/[^\d.]/g, '')) : 0;
  const addonsTotal = selectedAddons.reduce((sum, addon) => {
    const addonPrice = addon.price ? parseFloat(String(addon.price).replace(/[^\d.]/g, '')) : 0;
    return sum + addonPrice;
  }, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedAddons);
    setAdded(true);
    if (navigator.vibrate) navigator.vibrate(20);
    navigate(-1);
  };

  if (!product) return <div className="min-h-screen bg-charistar-dark" />;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="relative bg-[#050505] flex flex-col font-sans overflow-hidden will-change-transform"
      style={{ minHeight: '100dvh', transform: 'translate3d(0,0,0)' }}
    >
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full px-6 pt-12 pb-4 flex justify-between items-center z-20">
        <Link to="/" className="w-11 h-11 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center shadow-sm border border-white/10 hover:bg-black/60 transition-all">
          <ArrowLeft size={20} className="text-white" />
        </Link>
        <button className="w-11 h-11 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center shadow-sm border border-white/10 hover:bg-black/60 transition-all">
          <Star size={20} className="text-charistar-green fill-charistar-green" />
        </button>
      </div>

      {/* Hero Image */}
      <div className="w-full h-[45vh] relative flex-shrink-0 bg-charistar-dark overflow-hidden">
        {(product.image || product.img) ? (
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.03 }}
            src={product.image || product.img}
            alt={product.title}
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <ShoppingBag size={48} className="text-white/20" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/10" />
      </div>

      {/* Scrollable Content */}
      <motion.div 
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 20, delay: 0.05 }}
        className="flex-1 glass-panel-solid rounded-t-[40px] -mt-10 z-10 px-7 pt-8 pb-28 border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] will-change-transform"
        style={{ transform: 'translate3d(0,0,0)' }}
      >

        {/* Title & Price */}
        <div className="flex justify-between items-start mb-2">
          <div className="max-w-[70%]">
            <h1 className="text-[26px] font-extrabold text-white tracking-tight leading-none mb-2">{product.title}</h1>
            <p className="text-charistar-green text-[13px] font-bold tracking-wide uppercase">{product.subtitle}</p>
          </div>
          <span className="text-[28px] font-extrabold text-white tracking-tighter">₦{unitPrice.toLocaleString()}</span>
        </div>

        {/* Rating & Distance */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[14px] font-bold text-white">
              {reviews.length > 0 ? averageRating : 'New'}
              <span className="text-gray-500 font-medium ml-1">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <MapPin size={15} />
            <span className="text-[13px] font-medium">1.5 km away</span>
          </div>
        </div>

        {/* Description */}
        {product.description && product.description.trim() !== '' && (
          <div className="mb-8">
            <h3 className="text-[16px] font-extrabold text-white mb-2">Description</h3>
            <p className="text-[14px] text-gray-400 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>
        )}

        {/* Nutrition Panel */}
        {product.nutrition && (product.nutrition.protein || product.nutrition.fats || product.nutrition.carbo) ? (
          <div className="mb-8">
            <h3 className="text-[16px] font-extrabold text-white mb-3.5">Nutrition Facts</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-panel bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                <p className="text-gray-500 text-[8px] font-black uppercase tracking-wider mb-1">Protein</p>
                <p className="text-white font-black text-xs">{product.nutrition.protein || 0}g</p>
              </div>
              <div className="glass-panel bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                <p className="text-gray-500 text-[8px] font-black uppercase tracking-wider mb-1">Fats</p>
                <p className="text-white font-black text-xs">{product.nutrition.fats || 0}g</p>
              </div>
              <div className="glass-panel bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                <p className="text-gray-500 text-[8px] font-black uppercase tracking-wider mb-1">Carbs</p>
                <p className="text-white font-black text-xs">{product.nutrition.carbo || 0}g</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Add-ons */}
        {product.addons && product.addons.length > 0 && (
          <div className="mb-8 animate-fadeIn">
            <h3 className="text-[16px] font-extrabold text-white mb-3 flex items-center gap-2">
              <span className="text-charistar-green">✨</span> Customize Yogurt
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {product.addons.map((addon, index) => {
                const isSelected = selectedAddons.some(a => a.name === addon.name);
                return (
                  <button
                    key={index}
                    onClick={() => handleToggleAddon(addon)}
                    className={`glass-panel rounded-2xl px-4.5 py-3 font-black text-xs transition-all active:scale-95 duration-200 border flex items-center gap-2 ${
                      isSelected 
                        ? 'border-charistar-green bg-charistar-green/15 text-white shadow-[0_0_15px_rgba(37,211,102,0.2)]' 
                        : 'border-white/5 bg-white/5 text-gray-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    <span>{addon.name}</span>
                    <span className="text-charistar-green font-extrabold">+{addon.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[16px] font-extrabold text-white">Customer Reviews</h3>
            <button onClick={() => setIsReviewModalOpen(true)} className="text-charistar-green text-xs font-bold uppercase tracking-widest hover:underline">
              Write Review
            </button>
          </div>
          {reviewsLoading ? (
            <p className="text-gray-500 text-xs animate-pulse">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-xs italic bg-white/5 p-4 rounded-2xl text-center border border-white/5">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-charistar-green/20 flex items-center justify-center text-charistar-green font-bold text-[10px]">
                        {review.userName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-white text-xs font-bold">{review.userName || 'User'}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={10} className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-400 text-xs leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Fixed Bottom Bar — sits permanently in the floating navigation bar area */}
      <motion.div
        initial={{ y: 120, x: "-50%", scale: 0.8, opacity: 0 }}
        animate={{ y: 0, x: "-50%", scale: 1, opacity: 1 }}
        exit={{ y: 120, x: "-50%", scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] h-[4.5rem] px-3 py-2 glass-nav rounded-[2.5rem] border border-white/10 shadow-neon z-30 flex items-center gap-3 overflow-hidden"
      >
        {/* Quantity */}
        <div className="glass-panel h-full rounded-[2.2rem] flex items-center justify-between px-3 min-w-[100px]">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 flex items-center justify-center text-white hover:text-charistar-green text-[18px] font-medium">-</button>
          <span className="font-extrabold text-[14px] text-white">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 flex items-center justify-center text-white hover:text-charistar-green text-[18px] font-medium">+</button>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          className={`flex-1 h-full rounded-[2.2rem] flex justify-center items-center gap-2 shadow-sm transition-all ${
            added ? 'bg-emerald-500' : 'bg-charistar-green hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {added ? (
            <>
              <Check size={16} className="text-black" strokeWidth={3} />
              <span className="text-black font-extrabold text-[13px] tracking-wide">Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={16} className="text-black" strokeWidth={2.5} />
              <span className="text-black font-extrabold text-[13px] tracking-wide">
                Add to Cart • ₦{totalPrice.toLocaleString()}
              </span>
            </>
          )}
        </button>
      </motion.div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={submitReview}
      />
    </motion.div>
  );
}
