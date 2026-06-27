import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../firebase/config';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { 
  Star, MessageSquare, Reply, Trash2, ShieldAlert, Check, X, 
  MessageCircle, StarHalf, AlertCircle, ShoppingBag, Eye 
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const ReviewManagement = () => {
  const { reviews, orders, logAction } = useApp();
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', '5', '4', '3', 'critical' (1 & 2)
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  // Security passcode modal
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, id, data }

  // 1. Gather all reviews (merge Firestore `/reviews` with orders containing rating fields)
  const orderReviews = orders
    .filter(order => order.rating !== undefined && order.rating !== null)
    .map(order => ({
      id: order.id,
      source: 'order',
      customerName: order.customerName || 'Anonymous Client',
      rating: order.rating,
      comment: order.reviewText || 'No comment provided.',
      date: order.createdAt || order.timestamp || '',
      items: order.cart?.map(c => c.name).join(', ') || 'Menu Items',
      adminReply: order.adminReply || null
    }));

  const firestoreReviews = reviews.map(r => ({
    id: r.id,
    source: 'reviews',
    customerName: r.customerName || 'Anonymous Client',
    rating: r.rating || 0,
    comment: r.comment || '',
    date: r.date || r.createdAt || '',
    items: r.items || 'General Menu Feedback',
    adminReply: r.adminReply || null
  }));

  const allReviews = [...firestoreReviews, ...orderReviews].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  // Filter reviews
  const filteredReviews = allReviews.filter(rev => {
    if (ratingFilter === 'all') return true;
    if (ratingFilter === 'critical') return rev.rating <= 2;
    return rev.rating === Number(ratingFilter);
  });

  // 2. Calculations for Stats cards
  const totalCount = allReviews.length;
  const avgRating = totalCount > 0 
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
    : '0.0';

  const starsDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = allReviews.filter(r => r.rating === star).length;
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return { star, count, percentage };
  });

  // ── High-Risk Security Actions ─────────────────────────────────────────────
  const triggerReviewAction = (type, id, data = null) => {
    setPendingAction({ type, id, data });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, id, data } = pendingAction;
    
    try {
      if (type === 'delete_review') {
        const review = allReviews.find(r => r.id === id);
        
        if (review?.source === 'order') {
          // Delete rating/review text on the order document
          const docRef = doc(db, 'orders', id);
          await updateDoc(docRef, { rating: null, reviewText: null, adminReply: null });
        } else {
          // Delete from `/reviews` collection
          const docRef = doc(db, 'reviews', id);
          await deleteDoc(docRef);
        }
        logAction(`Deleted customer review from ${review?.customerName || 'Anonymous'}`);
        setSelectedReview(null);
      } else if (type === 'save_reply') {
        const review = allReviews.find(r => r.id === id);
        const replyText = data.replyText;

        if (review?.source === 'order') {
          const docRef = doc(db, 'orders', id);
          await updateDoc(docRef, { adminReply: replyText });
        } else {
          const docRef = doc(db, 'reviews', id);
          await updateDoc(docRef, { adminReply: replyText });
        }
        logAction(`Replied to review by ${review?.customerName}: "${replyText}"`);
        setIsReplyOpen(false);
        setReplyInput('');
      } else if (type === 'delete_reply') {
        const review = allReviews.find(r => r.id === id);
        if (review?.source === 'order') {
          const docRef = doc(db, 'orders', id);
          await updateDoc(docRef, { adminReply: null });
        } else {
          const docRef = doc(db, 'reviews', id);
          await updateDoc(docRef, { adminReply: null });
        }
        logAction(`Deleted admin reply on review by ${review?.customerName}`);
      }
    } catch (err) {
      alert("Failed to modify review document: " + err.message);
    }

    setPendingAction(null);
  };

  const openReplyWindow = (review) => {
    setSelectedReview(review);
    setReplyInput(review.adminReply || '');
    setIsReplyOpen(true);
  };

  const renderStars = (rating) => {
    const starArr = [];
    for (let i = 1; i <= 5; i++) {
      starArr.push(
        <Star 
          key={i} 
          size={14} 
          className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'} 
        />
      );
    }
    return <div className="flex gap-0.5">{starArr}</div>;
  };

  return (
    <div className="space-y-6">
      
      {/* ── Summary & Distribution Pane ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rating Score Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-orange-500/5 rounded-full flex items-center justify-center text-orange-500">
            <Star size={64} className="fill-orange-500/10 text-transparent" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Average Rating Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black text-slate-800 dark:text-white">{avgRating}</span>
              <span className="text-sm font-bold text-slate-400">/ 5.0</span>
            </div>
            <div className="mt-2">{renderStars(Math.round(Number(avgRating)))}</div>
          </div>
          <p className="text-[10.5px] text-slate-450 font-bold mt-6">Based on {totalCount} total verified customer reviews</p>
        </div>

        {/* Rating Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider mb-4 pl-0.5">Rating Distribution</h3>
          <div className="space-y-2">
            {starsDistribution.map(dist => (
              <div key={dist.star} className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="w-12 text-left">{dist.star} Stars</span>
                <div className="flex-1 h-2.5 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-100/50 dark:border-slate-800">
                  <div 
                    className="h-full bg-orange-500 rounded-full" 
                    style={{ width: `${dist.percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right font-black text-slate-700 dark:text-slate-300">{dist.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Filters ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All Reviews', value: 'all' },
          { label: '5-Star Feedback', value: '5' },
          { label: '4-Star Feedback', value: '4' },
          { label: '3-Star Feedback', value: '3' },
          { label: 'Critical Reviews (1-2★)', value: 'critical' }
        ].map(btn => (
          <button
            key={btn.value}
            onClick={() => setRatingFilter(btn.value)}
            className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap border transition-all ${
              ratingFilter === btn.value
                ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Review Cards List ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReviews.map(rev => (
          <div key={rev.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative">
            <div>
              {/* Header: Star count + date */}
              <div className="flex items-center justify-between">
                {renderStars(rev.rating)}
                <span className="text-[10px] font-bold text-slate-400">
                  {rev.date ? new Date(rev.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                </span>
              </div>

              {/* Customer context */}
              <div className="mt-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-[11px] font-black flex items-center justify-center text-slate-600 dark:text-slate-400 uppercase">
                  {rev.customerName.charAt(0)}
                </span>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">{rev.customerName}</h4>
                  {rev.source === 'order' && (
                    <span className="text-[9px] font-bold text-orange-500 flex items-center gap-0.5 uppercase mt-0.5">
                      <ShoppingBag size={10} /> Verified Order #{rev.id}
                    </span>
                  )}
                </div>
              </div>

              {/* Items ordered info */}
              <p className="text-[10px] font-bold text-slate-400 mt-2 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md inline-block">
                Bought: {rev.items}
              </p>

              {/* Review Text */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold mt-3 italic">
                "{rev.comment}"
              </p>

              {/* Admin reply panel */}
              {rev.adminReply ? (
                <div className="mt-4 p-3.5 bg-orange-50/40 dark:bg-orange-500/5 rounded-2xl border border-orange-100/50 dark:border-orange-500/10 text-xs font-semibold relative">
                  <div className="flex items-center justify-between text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> Response Sent</span>
                    <button 
                      onClick={() => triggerReviewAction('delete_reply', rev.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors uppercase font-black text-[9px]"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mt-1.5 italic">"{rev.adminReply}"</p>
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-slate-50 dark:border-slate-700/60">
              {!rev.adminReply && (
                <button
                  onClick={() => openReplyWindow(rev)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-orange-50 dark:bg-slate-700 dark:hover:bg-orange-500/10 text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700 transition-all"
                >
                  <Reply size={12} />
                  <span>Reply</span>
                </button>
              )}
              {rev.adminReply && (
                <button
                  onClick={() => openReplyWindow(rev)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-orange-50 dark:bg-slate-700 dark:hover:bg-orange-500/10 text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700 transition-all"
                >
                  <Reply size={12} />
                  <span>Edit Response</span>
                </button>
              )}
              <button
                onClick={() => triggerReviewAction('delete_review', rev.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl font-bold text-xs border border-slate-100 dark:border-slate-700 transition-all"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>

          </div>
        ))}
        {filteredReviews.length === 0 && (
          <div className="col-span-full bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center rounded-3xl">
            <span className="text-3xl">⭐</span>
            <p className="text-sm font-bold text-slate-400 mt-2">No reviews found matching this filter.</p>
          </div>
        )}
      </div>

      {/* ── MODAL: ADMIN REPLY FORM ───────────────────────────────────────────── */}
      {isReplyOpen && selectedReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-999 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => {
                setIsReplyOpen(false);
                setSelectedReview(null);
                setReplyInput('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-2 pl-0.5 flex items-center gap-1.5">
              <MessageCircle size={16} className="text-orange-500" />
              <span>Draft Review Response</span>
            </h3>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-900 text-xs font-semibold text-slate-500 mb-4 mt-2">
              <p className="font-extrabold text-slate-800 dark:text-white">Customer Comment:</p>
              <p className="italic mt-1">"{selectedReview.comment}"</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                triggerReviewAction('save_reply', selectedReview.id, { replyText: replyInput });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Response Comment</label>
                <textarea 
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Thank the customer for their review and state what actions you have taken..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsReplyOpen(false);
                    setSelectedReview(null);
                    setReplyInput('');
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 rounded-xl font-bold text-xs"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs disabled:opacity-50"
                >
                  Publish Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SECURITY PASSCODE MODAL ─────────────────────────────────────────── */}
      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => {
          setPasscodeOpen(false);
          setPendingAction(null);
        }}
        onVerified={handleVerifiedAction}
        actionName={pendingAction ? pendingAction.type.replace('_', ' ') : 'Delete Review'}
      />

    </div>
  );
};

export default ReviewManagement;
