import React, { useState, useEffect } from 'react';
import { Compass, Plus, Trash2, Edit2, ArrowUp, ArrowDown, Sparkles, Check, X, Loader2, Image as ImageIcon, LayoutGrid, Scroll, PanelTop, FolderEdit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDoc, collection, deleteDoc, doc, updateDoc, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminHomepage({ products = [], categories = [] }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [sections, setSections] = useState([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // null = add, obj = edit

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('grid'); // grid, horizontal_scroll, banner
  const [category, setCategory] = useState('All');
  const [icon, setIcon] = useState('Milk');
  
  // Banner fields
  const [subtitle, setSubtitle] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [image, setImage] = useState('');

  // Category Edit Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Icon options
  const iconOptions = ['Milk', 'IceCream', 'Citrus', 'CupSoda', 'Sparkles', 'Soup', 'Star', 'Gift', 'Heart', 'Flame', 'Percent'];
  // Category options
  const defaultCategories = ['All', 'Parfait', 'Yogurt', 'Drinks', 'Smoothie'];
  const displayCategories = ['All', ...categories.map(c => c.name)];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'homepage_sections'), (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setSections(fetched);
    }, (err) => {
      console.error("Error fetching homepage sections:", err);
    });
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingSection(null);
    setTitle('');
    setType('grid');
    setCategory('All');
    setIcon('Milk');
    setSubtitle('');
    setButtonText('');
    setImage('');
    setIsModalOpen(true);
  };

  const openEditModal = (section) => {
    setEditingSection(section);
    setTitle(section.title || '');
    setType(section.type || 'grid');
    setCategory(section.category || 'All');
    setIcon(section.icon || 'Milk');
    setSubtitle(section.subtitle || '');
    setButtonText(section.buttonText || '');
    setImage(section.image || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    const payload = {
      title: title.trim(),
      type,
      category,
      icon,
      ...(type === 'banner' && {
        subtitle: subtitle.trim(),
        buttonText: buttonText.trim() || 'Explore',
        image: image.trim()
      })
    };

    try {
      if (editingSection) {
        await updateDoc(doc(db, 'homepage_sections', editingSection.id), payload);
        setSuccess('Section updated successfully!');
      } else {
        // Append to the end
        const nextOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sortOrder || 0)) + 1 : 0;
        await addDoc(collection(db, 'homepage_sections'), { ...payload, sortOrder: nextOrder });
        setSuccess('Section added successfully!');
      }
      setTimeout(() => setSuccess(''), 3000);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving section:", err);
      alert("Failed to save homepage section: " + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm("Are you sure you want to delete this section from the home screen?")) return;
    try {
      await deleteDoc(doc(db, 'homepage_sections', sectionId));
      setSuccess('Section deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error deleting section:", err);
      alert("Failed to delete homepage section: " + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const reordered = [...sections];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    try {
      const batchPromises = reordered.map((sec, i) => {
        if (sec.sortOrder !== i) {
          return updateDoc(doc(db, 'homepage_sections', sec.id), { sortOrder: i });
        }
        return null;
      }).filter(Boolean);

      if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
      }
    } catch (err) {
      console.error("Failed to reorder homepage sections:", err);
      alert("Error reordering sections: " + err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const name = newCategoryName.trim();
      const catId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'categories', catId), { name });
      setNewCategoryName('');
      setSuccess('Category added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error adding category:", err);
      alert("Failed to add category: " + err.message);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;
    const oldName = editingCategory.name;
    const newName = editCategoryName.trim();

    setLoading(true);
    try {
      // 1. Update the category document name in Firestore
      await updateDoc(doc(db, 'categories', editingCategory.id), { name: newName });
      
      // 2. Cascade update to all products matching the old name in the background
      if (oldName !== newName) {
        const productsSnap = await getDocs(collection(db, 'products'));
        const batchUpdates = [];
        productsSnap.forEach(productDoc => {
          const productData = productDoc.data();
          if (productData.category === oldName) {
            batchUpdates.push(
              updateDoc(doc(db, 'products', productDoc.id), { category: newName })
            );
          }
        });
        
        if (batchUpdates.length > 0) {
          await Promise.all(batchUpdates);
        }
      }

      setEditingCategory(null);
      setEditCategoryName('');
      setSuccess('Category updated and matching products updated successfully! 🎉');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error("Error updating category:", err);
      alert("Failed to update category: " + err.message);
    }
    setLoading(false);
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Are you sure you want to delete this category? Products currently matching this category will remain, but the category filter won't display them on storefront tabs.")) return;
    try {
      await deleteDoc(doc(db, 'categories', catId));
      setSuccess('Category deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category: " + err.message);
    }
  };

  const handleInitializeLayout = async () => {
    const defaultSections = [
      { title: "Our Yogurts & Drinks", type: "grid", category: "All", icon: "Milk", sortOrder: 0 },
      { title: "Grab a bowl of Parfait", subtitle: "Layered, fresh & made to order daily", buttonText: "Order Parfait", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&q=80", type: "banner", category: "Parfait", icon: "Soup", sortOrder: 1 },
      { title: "Fresh Parfaits List", type: "horizontal_scroll", category: "Parfait", icon: "IceCream", sortOrder: 2 }
    ];
    setLoading(true);
    try {
      for (const sec of defaultSections) {
        await addDoc(collection(db, 'homepage_sections'), sec);
      }
      setSuccess('Default layout seeded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error seeding layout:", err);
      alert("Failed to seed layout: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      
      {/* Dynamic Success Alert Banner */}
      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-charistar-green/10 text-charistar-green border border-charistar-green/30 p-4 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(163,198,68,0.1)]"
          >
            <Check size={16} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section with Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0c0c0c]/85 border border-white/5 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-charistar-green/10 border border-charistar-green/20 flex items-center justify-center text-charistar-green">
              <Compass size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">Home Screen Sections</h1>
              <p className="text-gray-500 text-xs font-semibold mt-1">Design, rearrange, and customize the layout of your storefront home page.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="w-full md:w-auto bg-white/10 text-white font-black uppercase tracking-wider text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all shadow-sm border border-white/10"
          >
            <FolderEdit size={16} /> Manage Categories
          </button>
          <button 
            onClick={openAddModal}
            className="w-full md:w-auto bg-charistar-green text-black font-black uppercase tracking-wider text-xs px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={16} /> Add Section
          </button>
        </div>
      </div>

      {/* Hero Sliders Hint */}
      <div className="bg-[#0c0c0c]/85 border border-white/5 p-6 rounded-[1.5rem] flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-white font-black text-[14px]">Looking for Hero Sliders?</h3>
          <p className="text-gray-500 text-[11px] font-semibold mt-1">The auto-playing hero banners at the top of the home screen are managed in the Promotions suite.</p>
        </div>
        <a href="/admin/promotions" className="bg-white/10 text-white font-black uppercase tracking-wider text-[10px] px-5 py-3 rounded-lg hover:bg-white/20 transition-all border border-white/5">
          Manage Sliders
        </a>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-16 bg-[#0c0c0c]/40 rounded-[2rem] border border-white/5 border-dashed">
            <LayoutGrid className="text-gray-600 mx-auto mb-4" size={32} />
            <p className="text-gray-400 text-sm font-semibold mb-2">No custom sections found.</p>
            <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-6">Start from scratch or seed the default layout.</p>
            <button 
              onClick={handleInitializeLayout}
              disabled={loading}
              className="bg-charistar-green text-black font-black uppercase tracking-wider text-[10px] px-6 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Seeding...' : 'Seed Default Layout'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sections.map((section, index) => {
              let SectionIcon = LayoutGrid;
              if (section.type === 'horizontal_scroll') SectionIcon = Scroll;
              if (section.type === 'banner') SectionIcon = PanelTop;

              return (
                <div 
                  key={section.id} 
                  className="glass-panel p-5.5 rounded-2xl border border-white/5 bg-[#0c0c0c]/85 hover:bg-[#121212]/95 hover:border-charistar-green/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md group"
                >
                  <div className="flex items-center gap-4.5">
                    {/* Reordering Up/Down controls */}
                    <div className="flex flex-col gap-1">
                      <button 
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-charistar-green hover:bg-white/10 transition-all active:scale-90 disabled:opacity-20 disabled:hover:text-white"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button 
                        disabled={index === sections.length - 1}
                        onClick={() => handleMove(index, 'down')}
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-charistar-green hover:bg-white/10 transition-all active:scale-90 disabled:opacity-20 disabled:hover:text-white"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    {/* Section Type Icon Badge */}
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                      <SectionIcon size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-charistar-green/10 text-charistar-green border border-charistar-green/20">
                          {section.type}
                        </span>
                        <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
                          📁 Icon: {section.icon || 'Milk'} • Filter: {section.category || 'All'}
                        </span>
                      </div>
                      <h3 className="text-white text-[16px] font-black tracking-tight mt-1 leading-snug">{section.title}</h3>
                      {section.type === 'banner' && section.subtitle && (
                        <p className="text-gray-500 text-[11px] font-semibold mt-0.5 line-clamp-1">"{section.subtitle}" ({section.buttonText || 'Explore'})</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    <button 
                      onClick={() => openEditModal(section)} 
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-sky-400 hover:bg-white/10 transition-all active:scale-90" 
                      title="Edit Section"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={() => handleDelete(section.id)} 
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-red-400 hover:bg-white/10 transition-all active:scale-90" 
                      title="Delete Section"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Section Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !loading && setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8.5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => !loading && setIsModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                <X size={16} />
              </button>

              <h2 className="text-2xl font-black text-white mb-8 tracking-tight flex items-center gap-2">
                <Compass className="text-charistar-green" size={22} />
                {editingSection ? 'Edit Section Layout' : 'Create Custom Section'}
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Section Header Title</label>
                  <input 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" 
                    placeholder="e.g. Smoothie Specialities"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Display Type</label>
                    <select 
                      value={type} 
                      onChange={e => setType(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none appearance-none cursor-pointer transition-all text-xs font-semibold"
                    >
                      <option value="grid" className="bg-black">Vertical Grid (Classic)</option>
                      <option value="horizontal_scroll" className="bg-black">Horizontal Scroller</option>
                      <option value="banner" className="bg-black">Hero Promo Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Header Icon Symbol</label>
                    <select 
                      value={icon} 
                      onChange={e => setIcon(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none appearance-none cursor-pointer transition-all text-xs font-semibold"
                    >
                      {iconOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-black">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Filtered Product Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none appearance-none cursor-pointer transition-all text-xs font-semibold"
                  >
                    {displayCategories.map(catOpt => (
                      <option key={catOpt} value={catOpt} className="bg-black">{catOpt}</option>
                    ))}
                  </select>
                </div>

                {type === 'banner' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-5 pt-3 border-t border-white/5 animate-fadeIn"
                  >
                    <div>
                      <h4 className="text-charistar-green text-[10px] font-black uppercase tracking-wider mb-3">Hero Promo Banner Properties</h4>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Promo Subtitle</label>
                      <input 
                        required 
                        value={subtitle} 
                        onChange={e => setSubtitle(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" 
                        placeholder="e.g. Fresh & healthy layered toppings daily"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">CTA Button Label</label>
                        <input 
                          required 
                          value={buttonText} 
                          onChange={e => setButtonText(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" 
                          placeholder="e.g. Order Parfait"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Banner Image URL</label>
                        <input 
                          required 
                          value={image} 
                          onChange={e => setImage(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" 
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-4.5 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all font-black uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 py-4.5 bg-charistar-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#b3e600] transition-all shadow-sm disabled:opacity-50 font-black uppercase tracking-widest"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Save Layout'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !loading && setIsCategoryModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Close Icon Button */}
              <button 
                type="button"
                onClick={() => !loading && setIsCategoryModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                <X size={16} />
              </button>

              <h2 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-2">
                <FolderEdit className="text-charistar-green" size={20} />
                Manage Categories
              </h2>

              {/* Add New Category form */}
              <form onSubmit={handleAddCategory} className="flex gap-2.5 mb-6 flex-shrink-0">
                <input 
                  required
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-charistar-green outline-none text-xs font-semibold"
                  disabled={loading}
                />
                <button type="submit" disabled={loading} className="bg-charistar-green text-black font-black uppercase text-[10px] px-5 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50">
                  Add
                </button>
              </form>

              {/* Categories list */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 no-scrollbar">
                {categories.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 text-xs italic">No dynamic categories configured.</p>
                    <p className="text-[10px] text-gray-600 font-semibold mt-1">Default categories (Parfait, Yogurt, Smoothie, Drinks) are currently active in the menu.</p>
                  </div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                      {editingCategory?.id === cat.id ? (
                        <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-2">
                          <input 
                            required
                            value={editCategoryName}
                            onChange={e => setEditCategoryName(e.target.value)}
                            className="flex-1 bg-white/10 border border-charistar-green/30 rounded-lg px-3 py-1.5 text-white outline-none text-xs font-semibold"
                            disabled={loading}
                          />
                          <button type="submit" disabled={loading} className="text-[10px] font-black text-charistar-green hover:underline disabled:opacity-50">Save</button>
                          <button type="button" disabled={loading} onClick={() => setEditingCategory(null)} className="text-[10px] font-black text-gray-500 hover:underline disabled:opacity-50">Cancel</button>
                        </form>
                      ) : (
                        <>
                          <span className="text-white text-xs font-bold">{cat.name}</span>
                          <div className="flex items-center gap-3">
                            <button 
                              type="button" 
                              onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); }}
                              className="text-[10px] font-black text-gray-400 hover:text-sky-400 transition-colors uppercase tracking-wider"
                              disabled={loading}
                            >
                              Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-[10px] font-black text-gray-400 hover:text-red-400 transition-colors uppercase tracking-wider"
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
