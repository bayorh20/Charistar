import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Search, MessageSquare, Phone, ShieldCheck,
  ArrowLeft, Sparkles, Inbox, RefreshCw, X, CheckCircle2,
  RotateCcw, Clock, ChevronRight, Archive, Eye, Star
} from 'lucide-react';
import { playTick } from '../utils/sound';

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (status === 'closed') {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
        <CheckCircle2 size={11} />
        Resolved
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      Active
    </span>
  );
};

// ── Star rating for review ────────────────────────────────────────────────────
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`text-xl transition-transform hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const SupportChat = () => {
  const toast = useToast();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'closed'
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [reviewMode, setReviewMode] = useState(false); // shows transcript review panel for closed chats

  // Review form state
  const [reviewNote, setReviewNote] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewSaving, setReviewSaving] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesThreadRef = useRef(null);
  const isAtBottom = useRef(true);

  // AI Copilot state
  const [showAICopilot, setShowAICopilot] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestedReply, setAiSuggestedReply] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const activeRoom = chatRooms.find(r => r.id === selectedRoomId);

  const getCustomerSentiment = () => {
    if (!activeRoom || !activeRoom.messages || activeRoom.messages.length === 0) {
      return { label: 'Neutral', icon: '😐', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700' };
    }
    const customerMsgs = activeRoom.messages.filter(m => m.sender === 'user').map(m => m.text.toLowerCase());
    if (customerMsgs.length === 0) {
      return { label: 'Neutral', icon: '😐', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700' };
    }

    const negativeWords = ['wrong', 'delay', 'cold', 'bad', 'refund', 'angry', 'slow', 'poor', 'cancel', 'terrible', 'worst', 'disappointed', 'hate', 'spilled'];
    const positiveWords = ['thank', 'great', 'love', 'good', 'quick', 'delicious', 'perfect', 'awesome', 'nice', 'appreciate'];

    let score = 0;
    customerMsgs.forEach(msg => {
      negativeWords.forEach(w => { if (msg.includes(w)) score -= 1; });
      positiveWords.forEach(w => { if (msg.includes(w)) score += 1; });
    });

    if (score < 0) {
      return { label: 'Frustrated', icon: '😠', color: 'text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20' };
    } else if (score > 0) {
      return { label: 'Satisfied', icon: '😊', color: 'text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20' };
    }
    return { label: 'Neutral', icon: '😐', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20' };
  };

  const generateAISuggestion = () => {
    if (!activeRoom || !activeRoom.messages || activeRoom.messages.length === 0) return;
    setAiLoading(true);
    setAiSuggestedReply('');

    setTimeout(() => {
      const customerMsgs = activeRoom.messages.filter(m => m.sender !== 'admin');
      const lastMsg = customerMsgs.length > 0 ? customerMsgs[customerMsgs.length - 1].text : '';
      const text = lastMsg.toLowerCase();

      let suggestion = '';
      if (text.includes('where') || text.includes('delay') || text.includes('status') || text.includes('arrive') || text.includes('track')) {
        suggestion = `Hello ${activeRoom.name || 'there'}! I've checked the status of your order. It is currently being prepared in the kitchen and will be dispatched shortly. Apologies for any wait! 🛵`;
      } else if (text.includes('refund') || text.includes('cancel') || text.includes('money') || text.includes('pay')) {
        suggestion = `Hello ${activeRoom.name || 'there'}. I understand you'd like to request a cancellation or refund. I can assist you with that. Could you please provide your order ID or transaction details so I can check our logs? 💳`;
      } else if (text.includes('wrong') || text.includes('cold') || text.includes('missing') || text.includes('bad') || text.includes('spill') || text.includes('hair') || text.includes('burnt')) {
        suggestion = `I am so sorry for the poor experience with your order, ${activeRoom.name || 'there'}. We want to make this right. Would you prefer a free replacement order sent out immediately, or a full refund back to your wallet? 🍲`;
      } else if (text.includes('discount') || text.includes('coupon') || text.includes('promo') || text.includes('code') || text.includes('freebie')) {
        suggestion = `Hi ${activeRoom.name || 'there'}! As a valued customer, you can use code "MAXSUPPORT10" at checkout for 10% off your next order! 🎁`;
      } else {
        suggestion = `Hello ${activeRoom.name || 'there'}! Thank you for reaching out to FoodMaxx support. I'm happy to help you with that. Could you please share more details about your request? 🌟`;
      }

      setAiSuggestedReply(suggestion);
      setAiLoading(false);
    }, 1000);
  };

  const generateChatSummary = () => {
    if (!activeRoom || !activeRoom.messages || activeRoom.messages.length === 0) return;
    setAiSummaryLoading(true);
    setAiSummary('');

    setTimeout(() => {
      const customerMsgs = activeRoom.messages.filter(m => m.sender === 'user');
      const agentMsgs = activeRoom.messages.filter(m => m.sender === 'admin');

      const issues = [];
      const text = activeRoom.messages.map(m => m.text.toLowerCase()).join(' ');
      
      if (text.includes('where') || text.includes('delay') || text.includes('status')) issues.push('Inquired about order delivery status');
      if (text.includes('refund') || text.includes('cancel')) issues.push('Requested order cancellation/refund');
      if (text.includes('wrong') || text.includes('missing')) issues.push('Reported incorrect/missing items');
      if (text.includes('cold') || text.includes('bad')) issues.push('Complained about food quality');
      if (issues.length === 0) issues.push('General customer service inquiry');

      const summary = `• Customer Query: ${issues.join(', ')}\n• Message Count: ${activeRoom.messages.length} (${customerMsgs.length} user, ${agentMsgs.length} agent)\n• Action Taken: Agent addressed inquiry and provided live resolution.\n• Status: Marked as Resolved.`;

      setAiSummary(summary);
      setAiSummaryLoading(false);
    }, 1200);
  };

  const handleApplySummaryToNotes = () => {
    setReviewNote(aiSummary);
    toast.success('Summary Applied', 'The AI summary has been copied to your review notes.');
  };

  // Auto-generate AI suggestion when room changes or new customer messages arrive
  useEffect(() => {
    if (activeRoom && activeRoom.status !== 'closed') {
      generateAISuggestion();
      setAiSummary('');
    } else {
      setAiSuggestedReply('');
      setAiSummary('');
    }
  }, [selectedRoomId, activeRoom?.messages?.length]);

  // 1. Stream ALL support chat rooms
  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const unsub = onSnapshot(collection(db, 'support_chats'), (snap) => {
      const rooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rooms.sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tB - tA;
      });
      setChatRooms(rooms);
      setLoading(false);
    }, (err) => {
      console.error('Firestore support_chats stream failed:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (isAtBottom.current && messagesThreadRef.current) {
      messagesThreadRef.current.scrollTop = messagesThreadRef.current.scrollHeight;
    }
  }, [activeRoom?.messages]);

  // Force scroll to bottom on room selection change
  useEffect(() => {
    if (messagesThreadRef.current) {
      messagesThreadRef.current.scrollTop = messagesThreadRef.current.scrollHeight;
      isAtBottom.current = true;
    }
  }, [selectedRoomId]);

  // Clear unread when opening
  useEffect(() => {
    if (activeRoom && activeRoom.unread > 0) {
      updateDoc(doc(db, 'support_chats', activeRoom.id), { unread: 0 }).catch(console.error);
    }
  }, [selectedRoomId, activeRoom?.messages?.length]);

  // Reset review form when switching rooms
  useEffect(() => {
    setReviewNote('');
    setReviewRating(activeRoom?.reviewRating || 0);
    setReviewMode(false);
    setShowCloseConfirm(false);
  }, [selectedRoomId]);

  // ── Send Admin Reply ────────────────────────────────────────────────────────
  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyInput.trim() || !selectedRoomId || !activeRoom) return;
    if (activeRoom.status === 'closed') {
      toast.warning('Chat Closed', 'This chat is resolved. Reopen it to send messages.');
      return;
    }

    const newMsg = {
      id: Date.now(),
      sender: 'admin',
      text: replyInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...(activeRoom.messages || []), newMsg];
    setReplyInput('');
    playTick(true);

    // Optimistic update of chatRooms state
    setChatRooms(prevRooms => prevRooms.map(r => r.id === selectedRoomId ? {
      ...r,
      lastMessage: newMsg.text,
      time: newMsg.time,
      unread: 0,
      updatedAt: new Date().toISOString(),
      messages: updatedMessages
    } : r));

    try {
      await setDoc(doc(db, 'support_chats', selectedRoomId), {
        ...activeRoom,
        lastMessage: newMsg.text,
        time: newMsg.time,
        unread: 0,
        updatedAt: new Date().toISOString(),
        messages: updatedMessages
      }, { merge: true });
    } catch (err) {
      toast.error('Send Failed', err.message);
    }
  };

  // ── Close Chat ──────────────────────────────────────────────────────────────
  const handleCloseChat = async () => {
    if (!activeRoom) return;
    try {
      await updateDoc(doc(db, 'support_chats', activeRoom.id), {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy: 'admin',
        lastMessage: '✅ Chat closed by Support Agent',
        updatedAt: new Date().toISOString()
      });
      toast.success('Chat Closed', `Support session with ${activeRoom.name || 'customer'} has been resolved.`);
      setShowCloseConfirm(false);
      setActiveTab('closed');
      setReviewMode(true);
    } catch (err) {
      toast.error('Failed to close chat', err.message);
    }
  };

  // ── Reopen Chat ─────────────────────────────────────────────────────────────
  const handleReopenChat = async () => {
    if (!activeRoom) return;
    try {
      await updateDoc(doc(db, 'support_chats', activeRoom.id), {
        status: 'active',
        closedAt: null,
        updatedAt: new Date().toISOString(),
        lastMessage: '🔄 Chat reopened by Support Agent'
      });
      toast.success('Chat Reopened', `Session with ${activeRoom.name || 'customer'} is now active again.`);
      setActiveTab('active');
      setReviewMode(false);
    } catch (err) {
      toast.error('Failed to reopen chat', err.message);
    }
  };

  // ── Save Review Notes ───────────────────────────────────────────────────────
  const handleSaveReview = async () => {
    if (!activeRoom) return;
    setReviewSaving(true);
    try {
      await updateDoc(doc(db, 'support_chats', activeRoom.id), {
        reviewNote,
        reviewRating,
        reviewedAt: new Date().toISOString()
      });
      toast.success('Review Saved', 'Your notes and rating have been recorded.');
      setReviewMode(false);
    } catch (err) {
      toast.error('Save Failed', err.message);
    } finally {
      setReviewSaving(false);
    }
  };

  // ── Filter lists ────────────────────────────────────────────────────────────
  const search = roomSearch.toLowerCase();
  const allFiltered = chatRooms.filter(r =>
    (r.name || '').toLowerCase().includes(search) ||
    (r.lastMessage || '').toLowerCase().includes(search) ||
    (r.userId || '').toLowerCase().includes(search)
  );
  const activeRooms = allFiltered.filter(r => r.status !== 'closed');
  const closedRooms = allFiltered.filter(r => r.status === 'closed');
  const displayRooms = activeTab === 'active' ? activeRooms : closedRooms;

  const isClosed = activeRoom?.status === 'closed';

  return (
    <div className="h-[calc(100vh-130px)] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm flex">

      {/* ── Left Pane: Rooms List ───────────────────────────────────────────── */}
      <aside className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-100 dark:border-slate-700 shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>

        {/* Header + search */}
        <div className="p-4 border-b border-slate-50 dark:border-slate-700 space-y-3">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-orange-500" />
            <span>Support Queue</span>
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={roomSearch}
              onChange={e => setRoomSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* Active / Closed tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 gap-0.5">
            {[
              { key: 'active', label: 'Active', count: activeRooms.length, icon: MessageSquare },
              { key: 'closed', label: 'Resolved', count: closedRooms.length, icon: Archive }
            ].map(({ key, label, count, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-bold text-[11px] rounded-lg transition-all ${
                  activeTab === key
                    ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon size={11} />
                {label}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === key
                    ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700">
          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="animate-spin text-orange-500" size={14} />
              <span>Streaming chat channels...</span>
            </div>
          ) : displayRooms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <Inbox size={28} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold">
                {activeTab === 'active' ? 'No active support chats' : 'No resolved chats yet'}
              </p>
            </div>
          ) : (
            displayRooms.map(room => {
              const isSelected = room.id === selectedRoomId;
              const hasUnread = room.unread > 0;
              const isClosed = room.status === 'closed';
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    setMobileView('chat');
                    setReviewMode(isClosed);
                  }}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-orange-50/50 dark:bg-orange-500/5'
                      : 'hover:bg-slate-50/40 dark:hover:bg-slate-900/10'
                  } ${hasUnread && !isClosed ? 'bg-orange-500/5' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0 relative ${
                    isClosed
                      ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isClosed ? <CheckCircle2 size={16} /> : (room.name ? room.name.charAt(0).toUpperCase() : 'U')}
                    {hasUnread && !isClosed && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-600 border-2 border-white dark:border-slate-800 rounded-full animate-pulse shadow" />
                    )}
                  </div>

                  {/* Room Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">
                        {room.name || 'Anonymous User'}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-1">{room.time || 'now'}</span>
                    </div>
                    <p className={`text-[11px] mt-1 truncate ${hasUnread && !isClosed ? 'font-black text-slate-800 dark:text-white' : 'font-semibold text-slate-400'}`}>
                      {room.lastMessage || 'Connected to Support.'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-400">UID: {room.userId?.slice(-6) || 'guest'}</span>
                      {room.reviewRating > 0 && (
                        <span className="text-[9px] font-black text-amber-500">{'★'.repeat(room.reviewRating)}</span>
                      )}
                      {isClosed && (
                        <span className="text-[9px] font-black text-green-500 uppercase">Resolved</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Right Pane: Chat Thread ─────────────────────────────────────────── */}
      <section className={`flex-1 flex flex-col bg-slate-50/40 dark:bg-slate-900/10 h-full ${mobileView === 'list' && !selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
        {activeRoom ? (
          <>
            {/* Chat header */}
            <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-5 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 shrink-0"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  isClosed
                    ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                }`}>
                  {isClosed ? <CheckCircle2 size={15} /> : (activeRoom.name ? activeRoom.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                    {activeRoom.name || 'Anonymous Customer'}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 mt-0.5">
                    {activeRoom.phone && <span className="flex items-center gap-0.5"><Phone size={10} />{activeRoom.phone}</span>}
                    <span>• ID: {activeRoom.userId?.slice(-8) || 'guest'}</span>
                    {activeRoom.closedAt && (
                      <span className="flex items-center gap-0.5">
                        <Clock size={9} />
                        {new Date(activeRoom.closedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={activeRoom.status} />

                {/* AI Assistant Toggle Button */}
                <button
                  onClick={() => setShowAICopilot(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase border transition-all ${
                    showAICopilot
                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Sparkles size={11} />
                  <span className="hidden sm:block">AI Copilot</span>
                </button>

                {/* Review toggle (for closed) */}
                {isClosed && (
                  <button
                    onClick={() => setReviewMode(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase border transition-all ${
                      reviewMode
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Eye size={11} />
                    <span className="hidden sm:block">{reviewMode ? 'Chat View' : 'Review'}</span>
                  </button>
                )}

                {/* Close / Reopen */}
                {!isClosed ? (
                  <button
                    onClick={() => setShowCloseConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-[10px] uppercase hover:bg-red-100 transition-all"
                  >
                    <X size={11} />
                    <span className="hidden sm:block">Close Chat</span>
                  </button>
                ) : (
                  <button
                    onClick={handleReopenChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-bold text-[10px] uppercase hover:bg-amber-100 transition-all"
                  >
                    <RotateCcw size={11} />
                    <span className="hidden sm:block">Reopen</span>
                  </button>
                )}
              </div>
            </header>

            {/* Split screen content */}
            <div className="flex-1 flex overflow-hidden relative">
              
              {/* Left Column: Chat Thread / Review Pane */}
              <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {isClosed && reviewMode ? (
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Transcript summary */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-700 flex items-center gap-2">
                        <ShieldCheck size={15} className="text-green-500" />
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Chat Transcript</h3>
                        <span className="ml-auto text-[10px] font-bold text-slate-400">
                          {(activeRoom.messages || []).length} messages
                        </span>
                      </div>
                      <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
                        {(activeRoom.messages || []).map((msg, i) => {
                          const isAdmin = msg.sender === 'admin';
                          const isBot = msg.sender === 'bot';
                          return (
                            <div key={msg.id || i} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                isAdmin ? 'bg-orange-500 text-white' : isBot ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}>
                                {isAdmin ? '🛡' : isBot ? '🤖' : '👤'}
                              </div>
                              <div className={`flex-1 min-w-0 ${isAdmin ? 'text-right' : ''}`}>
                                <div className={`inline-block px-3 py-2 rounded-xl text-xs font-semibold leading-relaxed max-w-[85%] ${
                                  isAdmin ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-300' 
                                          : isBot ? 'bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-400'
                                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {msg.text}
                                </div>
                                <p className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time} · {isAdmin ? 'Support Agent' : isBot ? 'Auto-Bot' : 'Customer'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review form */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Star size={15} className="text-amber-500" />
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Agent Review Notes</h3>
                        {activeRoom.reviewedAt && (
                          <span className="ml-auto text-[10px] font-bold text-green-500 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Reviewed
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-0.5">Session Quality Rating</label>
                        <StarRating
                          value={reviewRating}
                          onChange={setReviewRating}
                        />
                        {reviewRating > 0 && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]} session
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-0.5">Agent Notes / Observations</label>
                        <textarea
                          rows={4}
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                          placeholder="e.g. Customer complained about delayed order. Resolved with refund voucher. Follow up required."
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 leading-relaxed resize-none"
                        />
                      </div>

                      {activeRoom.reviewNote && !reviewNote && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl">
                          <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-1">Previous Notes</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">{activeRoom.reviewNote}</p>
                        </div>
                      )}

                      <button
                        onClick={handleSaveReview}
                        disabled={reviewSaving || (!reviewNote.trim() && !reviewRating)}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} />
                        {reviewSaving ? 'Saving...' : 'Save Review'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Closed banner */}
                    {isClosed && (
                      <div className="mx-4 mt-3 px-4 py-2.5 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                        <p className="text-xs font-bold text-green-700 dark:text-green-400 flex-1">
                          This chat was resolved {activeRoom.closedAt ? `on ${new Date(activeRoom.closedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'by support'}.
                        </p>
                        <button
                          onClick={() => setReviewMode(true)}
                          className="text-[10px] font-black text-green-600 dark:text-green-400 flex items-center gap-1 shrink-0 hover:underline"
                        >
                          View Review <ChevronRight size={10} />
                        </button>
                      </div>
                    )}

                    {/* Conversation Thread */}
                    <div 
                      ref={messagesThreadRef}
                      onScroll={(e) => {
                        const el = e.target;
                        const threshold = 80;
                        isAtBottom.current = (el.scrollHeight - el.scrollTop - el.clientHeight) <= threshold;
                      }}
                      className="flex-1 overflow-y-auto p-6 space-y-4"
                    >
                      {(activeRoom.messages || []).map((msg, index) => {
                        const isAdmin = msg.sender === 'admin';
                        const isBot = msg.sender === 'bot';
                        return (
                          <div
                            key={msg.id || index}
                            className={`flex gap-3 max-w-[80%] ${isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                          >
                            {!isAdmin && (
                              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                                {isBot ? '🤖' : '👤'}
                              </div>
                            )}
                            <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                              isAdmin
                                ? 'bg-orange-500 text-white rounded-tr-none shadow-sm shadow-orange-500/10'
                                : isBot
                                ? 'bg-amber-50 dark:bg-amber-500/5 text-amber-850 dark:text-amber-450 border border-amber-100 dark:border-amber-500/10 rounded-tl-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm'
                            }`}>
                              <p>{msg.text}</p>
                              <div className={`text-[8.5px] font-bold mt-1 text-right ${isAdmin ? 'text-white/70' : 'text-slate-400'}`}>
                                <span>{msg.time}</span>
                                {isBot && <span className="ml-1 text-[8.5px] uppercase text-amber-500">(Auto Bot)</span>}
                                {isAdmin && <span className="ml-1 text-[8.5px] uppercase">(You)</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Footer */}
                    <footer className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 shrink-0">
                      {isClosed ? (
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-bold text-slate-400">Chat is resolved — reopen to reply</p>
                          <button
                            onClick={handleReopenChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[10px] uppercase transition-all"
                          >
                            <RotateCcw size={11} />
                            Reopen
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSendReply} className="flex gap-2">
                          <input
                            type="text"
                            value={replyInput}
                            onChange={e => setReplyInput(e.target.value)}
                            placeholder={`Send live message to ${activeRoom.name || 'customer'}...`}
                            className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="submit"
                            disabled={!replyInput.trim()}
                            className="px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white rounded-2xl font-bold transition-colors flex items-center justify-center shrink-0"
                          >
                            <Send size={16} />
                          </button>
                        </form>
                      )}
                    </footer>
                  </>
                )}
              </div>

              {/* Right Pane: AI Copilot Sidebar */}
              <AnimatePresence>
                {showAICopilot && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="hidden lg:flex border-l border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-col h-full shrink-0 overflow-y-auto p-4 space-y-5"
                  >
                    <div className="flex items-center gap-1.5 pb-3 border-b border-slate-50 dark:border-slate-700">
                      <Sparkles size={14} className="text-orange-500 animate-pulse" />
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">AI Support Copilot</h4>
                    </div>

                    {/* Sentiment Analysis Card */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-3.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Customer Sentiment</p>
                      {(() => {
                        const s = getCustomerSentiment();
                        return (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${s.color}`}>
                            <span className="text-base">{s.icon}</span>
                            <span>{s.label}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Suggested Reply Card */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Smart Auto-Suggestion</p>
                      
                      {aiLoading ? (
                        <div className="flex items-center gap-2 py-6 justify-center text-xs font-bold text-slate-400">
                          <RefreshCw className="animate-spin text-orange-500" size={14} />
                          <span>Copilot is drafting...</span>
                        </div>
                      ) : aiSuggestedReply ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-orange-50/40 dark:bg-orange-500/5 border border-orange-100/50 dark:border-orange-500/10 rounded-xl">
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                              {aiSuggestedReply}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setReplyInput(aiSuggestedReply);
                                toast.success('Suggestion Loaded', 'Review and edit in the input box before sending.');
                              }}
                              className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                            >
                              Use Draft
                            </button>
                            <button
                              onClick={generateAISuggestion}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                              Regen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-semibold py-4 text-center">No messages to analyze yet.</p>
                      )}
                    </div>

                    {/* Summary Generator Card */}
                    <div className="bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-3.5 flex flex-col">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Session Summarizer</p>
                      
                      {aiSummaryLoading ? (
                        <div className="flex items-center gap-2 py-6 justify-center text-xs font-bold text-slate-400">
                          <RefreshCw className="animate-spin text-orange-500" size={14} />
                          <span>Summarizing thread...</span>
                        </div>
                      ) : aiSummary ? (
                        <div className="space-y-3">
                          <pre className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-semibold font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {aiSummary}
                          </pre>
                          <div className="flex gap-2">
                            <button
                              onClick={handleApplySummaryToNotes}
                              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                            >
                              Apply to Notes
                            </button>
                            <button
                              onClick={() => setAiSummary('')}
                              className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={generateChatSummary}
                          className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-orange-500 hover:text-orange-500 rounded-xl text-[10px] font-black uppercase transition-all"
                        >
                          Summarize Chat
                        </button>
                      )}
                    </div>

                    {/* CRM Quick Templates */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-0.5">CRM Templates</p>
                      {[
                        { label: '🎫 Discount code offering', text: 'Thank you for your patience! As a small token of apology, here is a discount coupon MAXSUPPORT10 which gives you 10% off your next purchase.' },
                        { label: '📞 Direct support callback', text: 'To assist you further, I would like to arrange a direct callback from our customer supervisor. Is the contact phone number registered on your profile best to reach you?' },
                        { label: '🍕 Express replacement dispatch', text: 'I have arranged an express replacement for the incorrect items. Our dispatcher is on the way and this order is completely free of charge. Thank you!' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setReplyInput(item.text);
                            toast.success('Template Inserted', 'Inserted template text.');
                          }}
                          className="w-full p-2.5 text-left bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 hover:border-orange-500/50 dark:hover:border-orange-500/30 rounded-xl text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 transition-all"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-sm font-bold">Select a room from the queue</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">Chat syncs in real-time with the customer PWA</p>
          </div>
        )}
      </section>

      {/* ── Close Confirmation Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-sm p-6"
            >
              <div className="w-14 h-14 bg-green-100 dark:bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h3 className="font-black text-lg text-slate-800 dark:text-white text-center mb-1">Close This Chat?</h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center mb-5 leading-relaxed">
                Closing will mark this session as <strong>Resolved</strong>. The customer can no longer send new messages. You can still review the full transcript and reopen at any time.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseChat}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  Mark Resolved
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportChat;
