import React, { useState, useEffect } from 'react';
import { Tag, BadgePercent, Gift, Users, Plus, Trash2, ShieldCheck, AlertCircle, PlusCircle, Edit2, Play, Pause, Sparkles, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminPromotions() {
  const [activeSubTab, setActiveSubTab] = useState('coupons'); // 'coupons' | 'slides'

  // --- COUPONS STATE & LOGIC ---
  const [coupons, setCoupons] = useState([
    { code: 'WELCOME1000', discountType: 'flat', amount: 1000, minSpend: 3000, expiry: '2026-12-31', active: true, usageCount: 422 },
    { code: 'STUDENTPARFAIT', discountType: 'percentage', amount: 20, minSpend: 1500, expiry: '2026-09-30', active: true, usageCount: 890 },
    { code: 'OFFICELUNCH', discountType: 'percentage', amount: 15, minSpend: 5000, expiry: '2026-08-15', active: true, usageCount: 155 },
    { code: 'CASHBACK500', discountType: 'flat', amount: 500, minSpend: 2500, expiry: '2026-07-01', active: false, usageCount: 88 }
  ]);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('percentage');
  const [newAmount, setNewAmount] = useState('');
  const [newMinSpend, setNewMinSpend] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleToggleActive = (code) => {
    setCoupons(prev => prev.map(c => c.code === code ? { ...c, active: !c.active } : c));
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCode || !newAmount || !newMinSpend || !newExpiry) return;
    const newCoupon = {
      code: newCode.toUpperCase().replace(/\s+/g, ''),
      discountType: newType,
      amount: parseFloat(newAmount),
      minSpend: parseFloat(newMinSpend),
      expiry: newExpiry,
      active: true,
      usageCount: 0
    };
    setCoupons(prev => [newCoupon, ...prev]);
    setSuccessMsg(`Coupon ${newCoupon.code} registered in the system!`);
    setNewCode('');
    setNewAmount('');
    setNewMinSpend('');
    setNewExpiry('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRemoveCoupon = (code) => {
    setCoupons(prev => prev.filter(c => c.code !== code));
  };

  // --- SLIDES STATE & LOGIC ---
  const [slides, setSlides] = useState([]);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideTitleAccent, setSlideTitleAccent] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideBtnText, setSlideBtnText] = useState('Order Now');
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideBackground, setSlideBackground] = useState('charistar-gray');
  const [slideOrder, setSlideOrder] = useState('');
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [slideSuccessMsg, setSlideSuccessMsg] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'slides'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => (a.order || 0) - (b.order || 0));
      setSlides(fetched);
    }, (err) => {
      console.error("Error fetching slides:", err);
    });
    return () => unsub();
  }, []);

  const handleToggleSlideActive = async (id, currentVal) => {
    try {
      await updateDoc(doc(db, 'slides', id), { active: !currentVal });
    } catch (e) {
      console.error("Failed to toggle slide:", e);
    }
  };

  const handleDeleteSlide = async (id) => {
    if (window.confirm("Are you sure you want to delete this slide?")) {
      try {
        await deleteDoc(doc(db, 'slides', id));
      } catch (e) {
        console.error("Failed to delete slide:", e);
      }
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!slideTitle || !slideImageUrl) return;

    const payload = {
      title: slideTitle,
      titleAccent: slideTitleAccent,
      subtitle: slideSubtitle,
      btnText: slideBtnText,
      imageUrl: slideImageUrl,
      background: slideBackground,
      order: parseInt(slideOrder) || 0,
      active: true
    };

    try {
      if (editingSlideId) {
        await updateDoc(doc(db, 'slides', editingSlideId), payload);
        setSlideSuccessMsg("Slide configuration updated successfully!");
        setEditingSlideId(null);
      } else {
        await addDoc(collection(db, 'slides'), payload);
        setSlideSuccessMsg("New promotional slide published successfully!");
      }
      
      // Reset Form
      setSlideTitle('');
      setSlideTitleAccent('');
      setSlideSubtitle('');
      setSlideBtnText('Order Now');
      setSlideImageUrl('');
      setSlideBackground('charistar-gray');
      setSlideOrder('');

      setTimeout(() => setSlideSuccessMsg(''), 3000);
    } catch (e) {
      console.error("Failed to save slide:", e);
    }
  };

  const handleEditSlideClick = (slide) => {
    setEditingSlideId(slide.id);
    setSlideTitle(slide.title || '');
    setSlideTitleAccent(slide.titleAccent || '');
    setSlideSubtitle(slide.subtitle || '');
    setSlideBtnText(slide.btnText || 'Order Now');
    setSlideImageUrl(slide.imageUrl || '');
    setSlideBackground(slide.background || 'charistar-gray');
    setSlideOrder(slide.order || 0);
  };

  const handleInitializeTemplates = async () => {
    const templates = [
      {
        title: 'Free Delivery',
        titleAccent: 'For Parfait',
        subtitle: 'Up to 3 times per day',
        btnText: 'Order Now',
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
        background: 'charistar-gray',
        active: true,
        order: 1
      },
      {
        title: 'Grab a bowl of',
        titleAccent: 'Parfait',
        subtitle: 'Layered, fresh & made to order daily',
        btnText: 'Order Parfait',
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80',
        background: 'green-gradient',
        active: true,
        order: 2
      }
    ];
    try {
      for (const t of templates) {
        await addDoc(collection(db, 'slides'), t);
      }
      setSlideSuccessMsg("Default slide templates seeded to Firestore!");
      setTimeout(() => setSlideSuccessMsg(''), 3000);
    } catch (e) {
      console.error("Error seeding templates:", e);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5">
        <div>
          <h2 className="text-white font-black text-xl tracking-tight flex items-center gap-2">
            <Tag className="text-charistar-green" size={24} />
            Promotions & Campaigns Suite
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Deploy loyalty discount coupons, student codes, and interactive hero banner slides.</p>
        </div>

        {/* Dynamic sub tabs switcher */}
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('coupons')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'coupons' 
                ? 'bg-charistar-green text-black shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Coupons
          </button>
          <button 
            onClick={() => setActiveSubTab('slides')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'slides' 
                ? 'bg-charistar-green text-black shadow-sm' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Hero Slides
          </button>
        </div>
      </div>

      {activeSubTab === 'coupons' ? (
        /* COUPON CAMPAIGNS tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Coupons Grid */}
          <div className="lg:col-span-2 glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
              <BadgePercent className="text-charistar-green" size={18} />
              Active Coupon Campaign Registry
            </h3>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Coupon Code</th>
                    <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Benefit Details</th>
                    <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Min Spend</th>
                    <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Times Used</th>
                    <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Expiry</th>
                    <th className="pb-4 text-right text-[10px] text-gray-500 font-black uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(c => (
                    <tr key={c.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 text-xs font-black text-white">{c.code}</td>
                      <td className="py-4 text-xs font-bold text-charistar-green">
                        {c.discountType === 'percentage' ? `${c.amount}% Off` : `₦${c.amount.toLocaleString()} Flat`}
                      </td>
                      <td className="py-4 text-xs font-semibold text-gray-400">₦{c.minSpend.toLocaleString()}</td>
                      <td className="py-4 text-xs font-bold text-white">{c.usageCount} times</td>
                      <td className="py-4 text-xs font-semibold text-gray-500">{c.expiry}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <button 
                            onClick={() => handleToggleActive(c.code)}
                            className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                              c.active 
                                ? 'bg-charistar-green/10 border-charistar-green/20 text-charistar-green' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                          >
                            {c.active ? 'Active' : 'Paused'}
                          </button>
                          <button 
                            onClick={() => handleRemoveCoupon(c.code)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Coupon Drawer */}
          <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
              <PlusCircle className="text-charistar-green" size={18} />
              Deploy Promotion
            </h3>

            {successMsg && (
              <div className="bg-charistar-green/10 border border-charistar-green/20 text-charistar-green p-4.5 rounded-2xl text-xs font-black text-center mb-6 leading-relaxed">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Campaign Code</label>
                <input 
                  type="text" 
                  required 
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  placeholder="e.g. YOGURTCLUB30" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-black focus:border-charistar-green focus:bg-black/30 outline-none transition-all uppercase" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Benefit Type</label>
                  <select 
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors"
                  >
                    <option value="percentage">% Off Percentage</option>
                    <option value="flat">₦ Flat Currency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Benefit Value</label>
                  <input 
                    type="number" 
                    required 
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    placeholder="e.g. 20" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Minimum Order Spend</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charistar-green text-xs font-black">₦</span>
                  <input 
                    type="number" 
                    required 
                    value={newMinSpend}
                    onChange={e => setNewMinSpend(e.target.value)}
                    placeholder="2000" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Expiry Date</label>
                <input 
                  type="date" 
                  required 
                  value={newExpiry}
                  onChange={e => setNewExpiry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4.5 bg-charistar-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 font-black mt-4"
              >
                <Plus size={14} /> Deploy Coupon Code
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* HERO BANNER SLIDES manager tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Slides Registry */}
          <div className="lg:col-span-2 glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-black text-base tracking-tight flex items-center gap-2">
                <Sparkles className="text-charistar-green" size={18} />
                Hero Banner Slide Registry
              </h3>
              {slides.length === 0 && (
                <button
                  onClick={handleInitializeTemplates}
                  className="px-3 py-1.5 bg-charistar-green text-black rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#b3e600] transition-colors"
                >
                  Seed templates
                </button>
              )}
            </div>

            {slides.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-2xl border border-white/5">
                <Image className="text-gray-600 mb-3" size={36} />
                <p className="text-xs text-gray-400 font-bold mb-2">No promotional slides found in database</p>
                <p className="text-[10px] text-gray-500 max-w-[280px] leading-relaxed mb-4">You can manually compose slides using the form or initialize standard designs instantly.</p>
                <button
                  onClick={handleInitializeTemplates}
                  className="px-5 py-2.5 bg-charistar-green text-black rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#b3e600] active:scale-95 transition-all"
                >
                  Initialize Default Slides
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Order</th>
                      <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Preview</th>
                      <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Slide Header</th>
                      <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Background</th>
                      <th className="pb-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Status</th>
                      <th className="pb-4 text-right text-[10px] text-gray-500 font-black uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slides.map(slide => (
                      <tr key={slide.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 text-xs font-black text-charistar-green">#{slide.order || 0}</td>
                        <td className="py-4">
                          <div className="w-12 h-8 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                            <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-xs font-black text-white">{slide.title}</div>
                          <div className="text-[10px] font-bold text-charistar-green">{slide.titleAccent}</div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            slide.background === 'green-gradient' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-gray-500/10 text-gray-400'
                          }`}>
                            {slide.background === 'green-gradient' ? 'Green Gradient' : 'Charcoal Graphite'}
                          </span>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleToggleSlideActive(slide.id, slide.active !== false)}
                            className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                              slide.active !== false
                                ? 'bg-charistar-green/10 border-charistar-green/20 text-charistar-green'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                          >
                            {slide.active !== false ? 'Active' : 'Paused'}
                          </button>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={() => handleEditSlideClick(slide)}
                              className="text-gray-500 hover:text-white transition-colors"
                              title="Edit Slide"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteSlide(slide.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                              title="Delete Slide"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Slide Creation/Editing Drawer */}
          <div className="glass-panel p-7.5 rounded-[1.8rem] border border-white/10 bg-[#0c0c0c]/85 shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <h3 className="text-white font-black text-base tracking-tight mb-5 flex items-center gap-2">
              <PlusCircle className="text-charistar-green" size={18} />
              {editingSlideId ? "Modify Slide Config" : "Publish Hero Slide"}
            </h3>

            {slideSuccessMsg && (
              <div className="bg-charistar-green/10 border border-charistar-green/20 text-charistar-green p-4.5 rounded-2xl text-xs font-black text-center mb-6 leading-relaxed">
                {slideSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveSlide} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Main Header Title</label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={e => setSlideTitle(e.target.value)}
                  placeholder="e.g. Free Delivery"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-black focus:border-charistar-green focus:bg-black/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Title Accent (Highlighted Green)</label>
                <input
                  type="text"
                  value={slideTitleAccent}
                  onChange={e => setSlideTitleAccent(e.target.value)}
                  placeholder="e.g. For Parfait"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-bold focus:border-charistar-green focus:bg-black/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Subtitle Caption</label>
                <input
                  type="text"
                  value={slideSubtitle}
                  onChange={e => setSlideSubtitle(e.target.value)}
                  placeholder="e.g. Up to 3 times per day"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-medium focus:border-charistar-green focus:bg-black/30 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Button Label</label>
                  <input
                    type="text"
                    required
                    value={slideBtnText}
                    onChange={e => setSlideBtnText(e.target.value)}
                    placeholder="Order Now"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Sort Order Index</label>
                  <input
                    type="number"
                    value={slideOrder}
                    onChange={e => setSlideOrder(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Background Aesthetics</label>
                <select
                  value={slideBackground}
                  onChange={e => setSlideBackground(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors"
                >
                  <option value="charistar-gray">Charcoal Graphite (Matcha Theme Contrast)</option>
                  <option value="green-gradient">Deep Emerald Gradient (Parfait Glow)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={slideImageUrl}
                  onChange={e => setSlideImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-semibold focus:border-charistar-green outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 mt-4">
                {editingSlideId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlideId(null);
                      setSlideTitle('');
                      setSlideTitleAccent('');
                      setSlideSubtitle('');
                      setSlideBtnText('Order Now');
                      setSlideImageUrl('');
                      setSlideBackground('charistar-gray');
                      setSlideOrder('');
                    }}
                    className="px-4 py-4.5 bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/15 transition-all flex-shrink-0"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-4.5 bg-charistar-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#b3e600] active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 font-black"
                >
                  <Plus size={14} /> {editingSlideId ? "Save Slide Edit" : "Publish Slide"}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
