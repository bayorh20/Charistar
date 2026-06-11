import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ReviewModal({ isOpen, onClose, onSubmit }) {
  const { currentUser, openAuthModal } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Disable background scrolling when modal is open
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

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!currentUser) {
      onClose();
      openAuthModal('login');
      return;
    }
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(rating, comment);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overscroll-contain touch-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative z-10 w-full max-w-sm glass-panel bg-[#0a0a0a]/90 rounded-[2rem] border border-white/10 p-6 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-black text-xl tracking-tight">Rate this item</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-semibold">
              {error}
            </div>
          )}

          {/* Star Rating Selection */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  size={40} 
                  className={`transition-colors ${
                    (hoverRating || rating) >= star 
                      ? 'text-[#A3C644] fill-[#A3C644] drop-shadow-sm' 
                      : 'text-white/20'
                  }`} 
                />
              </button>
            ))}
          </div>

          {/* Comment Textarea */}
          <textarea 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you love about it? (Optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[13px] text-white placeholder-gray-500 outline-none focus:border-charistar-green focus:bg-white/10 transition-all min-h-[100px] resize-none mb-6"
          />

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="w-full h-14 rounded-2xl bg-charistar-green text-black font-black uppercase tracking-wider text-xs flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b3e600] transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Submit Review'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


