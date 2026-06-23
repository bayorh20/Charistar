import { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, MapPin, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function MorphingProductModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // DOM side effects: scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.__lenis?.stop();
    } else {
      document.body.style.overflow = '';
      window.__lenis?.start();
    }
    return () => {
      document.body.style.overflow = '';
      window.__lenis?.start();
    };
  }, [isOpen]);

  // State reset: runs after DOM effect, only when modal opens
  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    if (navigator.vibrate) navigator.vibrate(20);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  return (
    <>
      {/* Dimmed Frosted Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 z-[60] flex items-center justify-center p-5 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        {/* Morphing Center Panel */}
        <div 
          className={`w-full max-w-[340px] bg-[#111] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[32px] flex flex-col overflow-hidden relative transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.85] opacity-0 translate-y-8'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors z-20"
          >
            <X size={16} className="text-gray-300" />
          </button>

          {/* Header Image Area */}
          <div className="relative w-full h-[220px] bg-charistar-gray flex items-center justify-center overflow-hidden border-b border-white/5">
            <div className="absolute w-[200px] h-[200px] bg-charistar-green/20 rounded-full blur-[60px] pointer-events-none" />
            <img
              src={product.image || product.img}
              alt={product.title}
              loading="eager"
              decoding="async"
              className="w-[160px] h-[160px] object-cover rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.4)] border-[4px] border-[#111] z-10"
            />
          </div>

          {/* Details Body */}
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 pr-3">
                <h2 className="text-[20px] font-black text-white tracking-tight leading-tight mb-0.5">{product.title}</h2>
                <p className="text-charistar-green text-[11px] font-bold tracking-widest uppercase">{product.subtitle}</p>
              </div>
              <span className="text-[22px] font-black text-white tracking-tighter">{product.price}</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star size={13} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[12px] font-bold text-white">4.8</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin size={12} />
                <span className="text-[12px] font-medium">1.5 km away</span>
              </div>
            </div>

            {product.description && product.description.trim() !== '' && (
              <p className="text-[13px] text-gray-400 leading-relaxed font-medium mb-5 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Quantity & CTA Row */}
            <div className="flex items-center gap-3">
              {/* Quantity selector */}
              <div className="bg-white/5 border border-white/10 h-12 rounded-2xl flex items-center px-1 w-[100px]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center text-white text-xl active:scale-90 transition-transform"
                >
                  −
                </button>
                <span className="flex-1 text-center font-extrabold text-[14px] text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center text-white text-xl active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className={`flex-1 h-12 rounded-2xl flex justify-center items-center gap-2 font-extrabold text-[14px] tracking-wide transition-all active:scale-[0.97] ${
                  added
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-charistar-green text-black shadow-sm'
                }`}
              >
                {added ? (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} strokeWidth={2.5} />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

