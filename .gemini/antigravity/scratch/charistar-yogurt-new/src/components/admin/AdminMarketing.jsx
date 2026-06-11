import React, { useState } from 'react';
import { Send, Zap, MessageSquare, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminMarketing({ users }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('/');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setSuccess('');
    setError('');

    try {
      await addDoc(collection(db, 'campaigns'), {
        title: title || 'Charistar Update',
        message,
        url,
        status: 'active',
        createdAt: serverTimestamp(),
        targetAudience: 'all'
      });
      setSuccess('Campaign broadcast triggered successfully!');
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const usersWithTokens = users.filter(u => u.fcmToken).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview Card */}
      <div className="glass-panel p-8.5 rounded-[1.8rem] border border-charistar-green/30 bg-[#0c0c0c]/80 shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-charistar-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <h2 className="text-2xl font-black text-white mb-2.5 flex items-center gap-2.5 tracking-tight">
          <Zap className="text-charistar-green animate-pulse" size={24} />
          Marketing Command Center
        </h2>
        <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xl">
          Instantly display a beautiful glassmorphic pop-up notification on the screen of every client currently browsing the app in real-time. Direct, responsive engagement in one click.
        </p>
        
        <div className="mt-8 flex items-center gap-4.5 bg-[#050505]/60 p-5 rounded-[1.2rem] border border-white/10 max-w-md">
          <div className="w-12 h-12 bg-charistar-green/10 rounded-xl flex items-center justify-center text-charistar-green">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Target Audience</p>
            <p className="text-lg font-black text-white leading-tight mt-0.5">All Active Users <span className="text-xs font-semibold text-gray-400">({users.length} registered)</span></p>
          </div>
        </div>
      </div>

      {/* Campaign Form */}
      <form onSubmit={handleSendCampaign} className="glass-panel p-8.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/80 shadow-[0_15px_40px_rgba(0,0,0,0.4)] space-y-6">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 ml-1">Compose Campaign Broadcast</h3>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4.5 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        
        {success && (
          <div className="bg-charistar-green/10 border border-charistar-green/20 text-charistar-green p-4.5 rounded-2xl text-xs flex items-center gap-2 font-bold">
            <Zap size={14} className="animate-bounce" /> {success}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2.5 ml-1">Notification Title</label>
          <input
            type="text"
            required
            placeholder="e.g. ⚡ Flash Sale: 20% Off!"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#050505]/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-charistar-green focus:bg-[#050505]/80 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2.5 ml-1">Message Body</label>
          <textarea
            required
            placeholder="Tap to claim your discount before it expires!"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows="4"
            className="w-full bg-[#050505]/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-charistar-green focus:bg-[#050505]/80 transition-colors resize-none leading-relaxed"
          ></textarea>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2.5 ml-1">On-Click Route / Link</label>
          <input
            type="text"
            placeholder="e.g. /shop"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full bg-[#050505]/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-charistar-green focus:bg-[#050505]/80 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="w-full bg-charistar-green text-black font-black uppercase tracking-widest text-xs py-4.5 rounded-xl mt-6 flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95 shadow-sm font-black"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Send size={16} /> Broadcast Live Popup
            </>
          )}
        </button>
      </form>
    </div>
  );
}
