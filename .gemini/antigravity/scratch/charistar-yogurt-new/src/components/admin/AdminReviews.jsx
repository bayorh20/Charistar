import React, { useState } from 'react';
import { MessageSquare, Star, Reply, Trash2, ShieldCheck, Check, Smile, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([
    { id: 'REV-01', user: 'funmi@covenant.edu', product: 'Classic Berry Parfait', rating: 5, comment: 'Absolutely delicious! The greek yogurt was perfectly thick and the berries were fresh. Will order again.', sentiment: 'positive', reply: 'Thank you Funmi! We pride ourselves in serving only the freshest fruits!', date: 'Today' },
    { id: 'REV-02', user: 'kunle@gmail.com', product: 'Greek Yogurt Combo', rating: 4, comment: 'Nice thick texture. A bit too sweet for my liking, but overall a solid healthy choice.', sentiment: 'positive', reply: '', date: 'Yesterday' },
    { id: 'REV-03', user: 'obi_chinedu@unilag.edu', product: 'Granola Oats Delight', rating: 2, comment: 'The granola was a bit soggy this time. Hopefully it was just a one-off issue.', sentiment: 'negative', reply: '', date: '2 days ago' }
  ]);

  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handlePostReply = (e) => {
    e.preventDefault();
    if (!selectedReview || !replyText) return;

    setReviews(prev => prev.map(r => {
      if (r.id === selectedReview.id) {
        return {
          ...r,
          reply: replyText
        };
      }
      return r;
    }));

    setSelectedReview(null);
    setReplyText('');
    alert("Reply dispatched successfully to client feedback wall!");
  };

  const handleRemoveReview = (id) => {
    if (window.confirm("Are you sure you want to flag or hide this review from the public catalog?")) {
      setReviews(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <MessageSquare className="text-charistar-green" size={24} />
            Reviews & Catalog Feedback
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Monitor product ratings, customer satisfaction sentiment, and publish official corporate replies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reviews Feed Wall */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-black text-base tracking-tight mb-5">Feedback Feed</h3>
            
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-black text-sm tracking-tight">{review.user}</h4>
                      <p className="text-[10px] text-charistar-green font-bold mt-1">Product: {review.product} • {review.date}</p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 px-3 py-1.5 rounded-full">
                      <Star size={11} className="fill-amber-400 text-amber-400 animate-pulse" />
                      <span className="text-xs font-black text-white">{review.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 font-medium leading-relaxed italic bg-black/10 p-3.5 rounded-xl border border-white/5">
                    "{review.comment}"
                  </p>

                  {review.reply ? (
                    <div className="bg-[#050505]/40 border-l-2 border-charistar-green p-4 rounded-r-xl space-y-1 ml-4">
                      <span className="text-[9px] text-charistar-green font-black uppercase tracking-widest block">Official corporate Response:</span>
                      <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic">"{review.reply}"</p>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        onClick={() => setSelectedReview(review)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-charistar-green/10 border border-charistar-green/20 text-charistar-green hover:bg-charistar-green/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Reply size={12} /> Post Reply
                      </button>
                      <button 
                        onClick={() => handleRemoveReview(review.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                        title="Flag or Hide"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment Analysis Widgets */}
        <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between">
          <div>
            <h3 className="text-white font-black text-xs tracking-wider uppercase mb-5 flex items-center gap-2">
              <Smile className="text-charistar-green animate-bounce" size={14} style={{ animationDuration: '3s' }} />
              Sentiment Tracker
            </h3>
            <p className="text-xs text-gray-400 font-semibold leading-relaxed mb-6">
              Track overall client satisfaction metrics, average ratings, and positive sentiment ratios.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-gray-300">Average Store Rating</span>
                <span className="text-xs font-black text-white">4.8 / 5.0</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-gray-300">Positive Sentiment Ratio</span>
                <span className="text-xs font-black text-charistar-green">94.2%</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-gray-300">Needs Response</span>
                <span className="text-xs font-black text-amber-400">2 Reviews</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 mt-6">
            <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black block mb-2.5">Catalog Moderation Status</span>
            <div className="bg-[#050505]/40 border border-white/5 p-4 rounded-xl flex items-center gap-3">
              <ShieldCheck size={16} className="text-charistar-green" />
              <p className="text-[10px] font-black text-white uppercase tracking-wider">Automated Profanity Shield</p>
            </div>
          </div>
        </div>

      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setSelectedReview(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Post Reply</h2>
              <p className="text-gray-400 text-xs font-semibold mb-6">Replying to review by <span className="text-white font-black">{selectedReview.user}</span></p>

              <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 text-[11px] font-medium leading-relaxed italic text-gray-300 mb-6">
                "{selectedReview.comment}"
              </div>

              <form onSubmit={handlePostReply} className="space-y-6">
                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Official Response</label>
                  <textarea 
                    required 
                    rows="3"
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)} 
                    placeholder="Type your official reply..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green focus:bg-black/30 outline-none transition-all resize-none leading-relaxed" 
                  />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setSelectedReview(null)} className="flex-1 py-4 bg-white/5 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-4 bg-charistar-green text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#b3e600] transition-colors shadow-sm font-black">
                    Post Reply
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
