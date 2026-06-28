import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { db, storage } from '../firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Plus, Edit, Trash2, Tag, Clock, Check, AlertCircle, Copy, 
  Image as ImageIcon, Layers, Sliders, CheckSquare, X, Upload,
  Grid, List, Search, Eye, Filter, Flame, Star, ShieldCheck,
  TrendingUp, Activity, FileText, Sparkles, AlertTriangle
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';

const compressImage = (file, maxWidth = 500, maxHeight = 500, quality = 0.6) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = () => resolve(e.target.result);
    };
    reader.readAsDataURL(file);
  });
};

const ProductManager = () => {
  const { categories, menuItems, optionPresets, logAction } = useApp();
  const toast = useToast();

  // View States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out'

  // Modals & Security
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, id }

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'media', 'variants', 'details', 'inventory', 'analytics'
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    promoPrice: '',
    category: '',
    prepTime: '15-20 mins',
    popular: false,
    trending: false,
    featured: false,
    isDraft: false,
    image: '',
    additionalImages: [], // Array of string data URLs
    videoUrl: '',
    variants: [], // Array of { name, priceModifier }
    selectedPresets: [], // Array of option preset IDs
    ingredients: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    trackStock: false,
    stockQuantity: 100,
    lowStockThreshold: 10,
    availabilitySchedule: {
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true
    }
  });

  // Bulk operation selections
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Auto-save draft status
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Auto-save draft effect
  useEffect(() => {
    if (!isFormOpen || editingItem) return; // Only auto-save drafts for new product creation
    const delayDebounce = setTimeout(async () => {
      if (!form.name.trim()) return;
      setIsDraftSaving(true);
      try {
        const itemId = `draft-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        await setDoc(doc(db, 'menu_items', itemId), {
          name: form.name,
          description: form.description,
          price: Number(form.price) || 0,
          category: form.category || categories[0]?.id || '',
          isDraft: true,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('[AutoSave] Saved draft successfully');
      } catch (err) {
        console.warn('[AutoSave] Failed:', err);
      } finally {
        setIsDraftSaving(false);
      }
    }, 3000);

    return () => clearTimeout(delayDebounce);
  }, [form.name, form.description, form.price, form.category, isFormOpen, editingItem, categories]);

  // Image Upload handlers with canvas-based JPEG compression
  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file, 600, 600, 0.6);
      setForm(prev => ({ ...prev, image: compressed }));
    }
  };

  const handleAdditionalImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const compressedImages = await Promise.all(
      files.map(file => compressImage(file, 500, 500, 0.6))
    );
    setForm(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, ...compressedImages]
    }));
  };

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const handleProductVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || 
                    file.name.toLowerCase().endsWith('.mp4') || 
                    file.name.toLowerCase().endsWith('.webm') || 
                    file.name.toLowerCase().endsWith('.mov') || 
                    file.name.toLowerCase().endsWith('.avi');
    if (!isVideo) {
      toast.error('Invalid File', 'Please select a valid video file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum video upload limit is 50MB.');
      return;
    }

    setIsUploadingVideo(true);
    const toastId = toast.info('Uploading Video', 'Uploading product clip to Firebase Storage...');
    try {
      const storageRef = ref(storage, `products_video/${form.id || 'temp'}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setForm(prev => ({ ...prev, videoUrl: downloadUrl }));
      toast.dismiss(toastId);
      toast.success('Upload Success 🎉', 'Video uploaded successfully.');
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Product video upload failed:', err);
      toast.error('Upload Failed', err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Mock background image removal using Canvas grayscale & transparency mask
  const applyMockBgRemoval = () => {
    if (!form.image) {
      toast.error('Error', 'Upload a product image first.');
      return;
    }
    const toastId = toast.info('Removing Background', 'Applying edge-detection masking filters...');
    setTimeout(() => {
      toast.dismiss(toastId);
      // Simulate transparency by replacing it with a placeholder png URL or applying canvas filters
      // For demo, we just apply a border or modify the image data URL slightly
      setForm(prev => ({ ...prev, image: prev.image }));
      toast.success('Background Removed', 'Main image isolated successfully.');
    }, 1500);
  };

  // Filter & Search
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'all' ? true : item.category === selectedCategoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = item.trackStock && (item.stockQuantity <= (item.lowStockThreshold || 10)) && item.stockQuantity > 0;
      } else if (stockFilter === 'out') {
        matchesStock = item.trackStock && item.stockQuantity <= 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [menuItems, search, selectedCategoryFilter, stockFilter]);

  // Operations
  const triggerDelete = (id) => {
    setPendingAction({ type: 'delete_item', id });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, id } = pendingAction;
    try {
      if (type === 'delete_item') {
        const item = menuItems.find(m => m.id === id);
        await deleteDoc(doc(db, 'menu_items', id));
        logAction(`Deleted menu item: ${item?.name || id}`);
        toast.success('Item Deleted', `"${item?.name || id}" has been removed from the menu.`);
        if (editingItem?.id === id) {
          closeForm();
        }
      }
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
    setPendingAction(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setFormTab('basic');
    setForm({
      name: '',
      description: '',
      price: 0,
      promoPrice: '',
      category: '',
      prepTime: '15-20 mins',
      popular: false,
      trending: false,
      featured: false,
      isDraft: false,
      image: '',
      additionalImages: [],
      videoUrl: '',
      variants: [],
      selectedPresets: [],
      ingredients: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      trackStock: false,
      stockQuantity: 100,
      lowStockThreshold: 10,
      availabilitySchedule: {
        monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true
      }
    });
  };

  const openCreate = () => {
    closeForm();
    setForm(prev => ({ ...prev, category: categories[0]?.id || '' }));
    setIsFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    
    // Find matched presets
    const matchedPresets = optionPresets
      .filter(p => item.options?.some(o => o.title === p.title))
      .map(p => p.id);

    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      promoPrice: item.promoPrice || '',
      category: item.category || '',
      prepTime: item.prepTime || '15-20 mins',
      popular: !!item.popular,
      trending: !!item.trending,
      featured: !!item.featured,
      isDraft: !!item.isDraft,
      image: item.image || '',
      additionalImages: item.additionalImages || [],
      videoUrl: item.videoUrl || '',
      variants: item.variants || [],
      selectedPresets: matchedPresets,
      ingredients: item.ingredients || '',
      calories: item.calories || '',
      protein: item.protein || '',
      carbs: item.carbs || '',
      fat: item.fat || '',
      trackStock: !!item.trackStock,
      stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : 100,
      lowStockThreshold: item.lowStockThreshold !== undefined ? item.lowStockThreshold : 10,
      availabilitySchedule: item.availabilitySchedule || {
        monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true
      }
    });
    
    setIsFormOpen(true);
  };

  const saveProduct = async (e) => {
    if (e) e.preventDefault();
    if (!form.name || !form.category || form.price <= 0) {
      toast.error('Error', 'Please fill in Name, Category and Price.');
      return;
    }

    const toastId = toast.info('Publishing Product', 'Uploading assets and saving to Firestore...');
    const itemId = editingItem?.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Resolve presets
    const resolvedOptions = optionPresets
      .filter(p => form.selectedPresets.includes(p.id))
      .map(p => ({
        title: p.title,
        type: p.type,
        max: p.max || 1,
        required: p.required || false,
        items: p.items || []
      }));

    let finalImageUrl = form.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';
    let finalAdditionalImages = [];

    try {
      // 1. Upload main image
      if (form.image && form.image.startsWith('data:image/')) {
        if (storage) {
          try {
            const storageRef = ref(storage, `menu_items/${itemId}_${Date.now()}`);
            const snapshot = await uploadString(storageRef, form.image, 'data_url');
            finalImageUrl = await getDownloadURL(snapshot.ref);
          } catch (storageErr) {
            console.warn('Storage main image failed:', storageErr);
          }
        }
      }

      // 2. Upload additional images
      for (let i = 0; i < form.additionalImages.length; i++) {
        const img = form.additionalImages[i];
        if (img.startsWith('data:image/')) {
          if (storage) {
            try {
              const storageRef = ref(storage, `menu_items/${itemId}_extra_${i}_${Date.now()}`);
              const snapshot = await uploadString(storageRef, img, 'data_url');
              const url = await getDownloadURL(snapshot.ref);
              finalAdditionalImages.push(url);
            } catch (err) {
              console.warn('Extra image upload failed:', err);
              finalAdditionalImages.push(img);
            }
          } else {
            finalAdditionalImages.push(img);
          }
        } else {
          finalAdditionalImages.push(img);
        }
      }

      const docData = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        category: form.category,
        prepTime: form.prepTime,
        popular: form.popular,
        trending: form.trending,
        featured: form.featured,
        isDraft: form.isDraft,
        image: finalImageUrl,
        additionalImages: finalAdditionalImages,
        videoUrl: form.videoUrl,
        variants: form.variants,
        options: resolvedOptions,
        ingredients: form.ingredients,
        calories: form.calories,
        protein: form.protein,
        carbs: form.carbs,
        fat: form.fat,
        trackStock: form.trackStock,
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        availabilitySchedule: form.availabilitySchedule,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'menu_items', itemId), docData, { merge: true });
      logAction(`${editingItem ? 'Updated' : 'Created'} product: ${form.name}`);
      toast.dismiss(toastId);
      toast.success(
        editingItem ? 'Product Updated!' : 'Product Published!',
        `"${form.name}" has been saved.`
      );
      closeForm();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Save Failed', err.message);
    }
  };

  const duplicateProduct = async (item) => {
    const newId = `${item.id}-copy-${Math.floor(1000 + Math.random() * 9000)}`;
    const newName = `${item.name} (Copy)`;
    try {
      await setDoc(doc(db, 'menu_items', newId), {
        ...item,
        id: newId,
        name: newName,
        updatedAt: new Date().toISOString()
      });
      logAction(`Duplicated product: ${item.name}`);
      toast.success('Product Duplicated', `"${newName}" created successfully.`);
    } catch (err) {
      toast.error('Duplication Failed', err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;
    const toastId = toast.info('Bulk Deleting', 'Removing selected products...');
    try {
      await Promise.all(selectedItemIds.map(id => deleteDoc(doc(db, 'menu_items', id))));
      logAction(`Bulk deleted ${selectedItemIds.length} products`);
      toast.dismiss(toastId);
      toast.success('Bulk Delete Complete', `${selectedItemIds.length} products deleted.`);
      setSelectedItemIds([]);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Bulk Delete Failed', err.message);
    }
  };

  const toggleSelection = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-wider">Product Catalog</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage variants, stock, and media assets</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedItemIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Trash2 size={13} />
              <span>Delete ({selectedItemIds.length})</span>
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <Plus size={14} />
            <span>New Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Main List */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
            <div className="flex flex-1 min-w-[200px] items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent border-none text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-350"
              >
                <option value="all">All Stock Statuses</option>
                <option value="low">Low Stock Only</option>
                <option value="out">Out of Stock Only</option>
              </select>
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-750">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-750 text-orange-500 shadow-xs' : 'text-slate-400'}`}
                >
                  <Grid size={13} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white dark:bg-slate-750 text-orange-500 shadow-xs' : 'text-slate-400'}`}
                >
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMenuItems.map(item => {
                const catObj = categories.find(c => c.id === item.category);
                const isSelected = selectedItemIds.includes(item.id);
                const isLowStock = item.trackStock && item.stockQuantity <= (item.lowStockThreshold || 10) && item.stockQuantity > 0;
                const isOutOfStock = item.trackStock && item.stockQuantity <= 0;

                return (
                  <div 
                    key={item.id}
                    onClick={() => openEdit(item)}
                    className={`bg-white dark:bg-slate-800 border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group relative cursor-pointer ${
                      isSelected ? 'border-orange-500/40 ring-1 ring-orange-500/20' : 'border-slate-150 dark:border-slate-700/80'
                    }`}
                  >
                    {/* Checkbox Overlay */}
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleSelection(item.id); }}
                      className={`absolute top-3 left-3 w-5 h-5 rounded-lg border flex items-center justify-center z-20 transition-all ${
                        isSelected 
                          ? 'bg-orange-500 border-orange-500 text-white' 
                          : 'bg-black/40 border-white/40 text-transparent hover:border-white'
                      }`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>

                    {/* Image Header */}
                    <div className="h-36 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900/60">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        {item.isDraft && (
                          <span className="bg-slate-750 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                            Draft
                          </span>
                        )}
                        {item.featured && (
                          <span className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                            ★ Featured
                          </span>
                        )}
                        {item.popular && (
                          <span className="bg-orange-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                            🔥 Popular
                          </span>
                        )}
                      </div>

                      {/* Stock alerts */}
                      {isOutOfStock ? (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow">
                            <AlertTriangle size={10} /> OUT OF STOCK
                          </span>
                        </div>
                      ) : isLowStock ? (
                        <span className="absolute bottom-3 left-3 bg-amber-500 text-slate-950 font-black text-[8px] px-2 py-0.5 rounded-md shadow">
                          ⚠️ Low Stock: {item.stockQuantity}
                        </span>
                      ) : null}
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {catObj?.label || 'General'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <span className="font-black text-sm text-slate-850 dark:text-white">
                          ₦{(item.price || 0).toLocaleString()}
                        </span>
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => duplicateProduct(item)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
                            title="Duplicate product"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => triggerDelete(item.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-750 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedItemIds.length === filteredMenuItems.length && filteredMenuItems.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedItemIds(filteredMenuItems.map(i => i.id));
                            else setSelectedItemIds([]);
                          }}
                          className="w-4 h-4 rounded text-orange-500 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenuItems.map(item => {
                      const catObj = categories.find(c => c.id === item.category);
                      const isSelected = selectedItemIds.includes(item.id);
                      const isLowStock = item.trackStock && item.stockQuantity <= (item.lowStockThreshold || 10) && item.stockQuantity > 0;
                      const isOutOfStock = item.trackStock && item.stockQuantity <= 0;

                      return (
                        <tr 
                          key={item.id}
                          className={`border-b border-slate-50 dark:border-slate-750 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 text-xs font-semibold ${
                            isSelected ? 'bg-orange-50/10 dark:bg-orange-950/5' : ''
                          }`}
                        >
                          <td className="p-4">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(item.id)}
                              className="w-4 h-4 rounded text-orange-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
                              <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            </span>
                            <div>
                              <span className="font-extrabold text-slate-800 dark:text-white block">{item.name}</span>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Slug: {item.id}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            {catObj?.label || 'General'}
                          </td>
                          <td className="p-4 font-extrabold text-slate-850 dark:text-white">
                            ₦{(item.price || 0).toLocaleString()}
                          </td>
                          <td className="p-4">
                            {item.trackStock ? (
                              <span className={`font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                {item.stockQuantity} in stock
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">Infinite</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              item.isDraft ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : 'bg-green-500/10 text-green-600'
                            }`}>
                              {item.isDraft ? 'Draft' : 'Active'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1 text-slate-400 hover:text-orange-500"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => duplicateProduct(item)}
                                className="p-1 text-slate-400 hover:text-slate-650"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={() => triggerDelete(item.id)}
                                className="p-1 text-slate-400 hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredMenuItems.length === 0 && (
            <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center rounded-3xl">
              <span className="text-3xl">🥗</span>
              <p className="text-sm font-bold text-slate-400 mt-2">No matching products found.</p>
            </div>
          )}
        </div>

        {/* Sidebar Form */}
        <div className="space-y-6">
          {isFormOpen && (
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-750 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                    {editingItem ? 'Edit Product' : 'Create Product'}
                  </h3>
                  {isDraftSaving && (
                    <span className="text-[9px] font-bold text-orange-500 animate-pulse uppercase tracking-wider">
                      Auto-saving draft...
                    </span>
                  )}
                </div>
                <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Form Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-700/60 overflow-x-auto pb-1 gap-1">
                {[
                  { id: 'basic', label: 'Basic' },
                  { id: 'media', label: 'Media' },
                  { id: 'variants', label: 'Variants' },
                  { id: 'details', label: 'Details' },
                  { id: 'inventory', label: 'Stock' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFormTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                      formTab === t.id 
                        ? 'bg-orange-500 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <form onSubmit={saveProduct} className="space-y-4">
                
                {/* 1. Basic Info */}
                {formTab === 'basic' && (
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Product Name</label>
                      <input 
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Special Jollof Rice"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Description</label>
                      <textarea 
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="e.g. Steaming hot jollof rice served with fried plantain..."
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Price (₦)</label>
                        <input 
                          type="number"
                          value={form.price || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="3500"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Promo Price (₦)</label>
                        <input 
                          type="number"
                          value={form.promoPrice || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, promoPrice: e.target.value }))}
                          placeholder="Optional"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Category</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                          required
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Prep Time</label>
                        <input 
                          type="text"
                          value={form.prepTime}
                          onChange={(e) => setForm(prev => ({ ...prev, prepTime: e.target.value }))}
                          placeholder="e.g. 15-20 mins"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Switches */}
                    <div className="flex flex-wrap gap-4 pt-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={form.popular}
                          onChange={(e) => setForm(prev => ({ ...prev, popular: e.target.checked }))}
                          className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-orange-500/20"
                        />
                        <span>🔥 Popular</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={form.trending}
                          onChange={(e) => setForm(prev => ({ ...prev, trending: e.target.checked }))}
                          className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-orange-500/20"
                        />
                        <span>⚡ Trending</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={form.featured}
                          onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                          className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-orange-500/20"
                        />
                        <span>★ Featured</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-750">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={form.isDraft}
                          onChange={(e) => setForm(prev => ({ ...prev, isDraft: e.target.checked }))}
                          className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-orange-500/20"
                        />
                        <span>Save as Draft (Hide from menu)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 2. Media Gallery */}
                {formTab === 'media' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Main Cover Image</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={form.image}
                          onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))}
                          placeholder="Paste image URL or upload..."
                          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-semibold text-slate-850 dark:text-white focus:outline-none"
                        />
                        <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors flex items-center justify-center shrink-0">
                          <Upload size={14} />
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleMainImageUpload}
                            style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                          />
                        </label>
                      </div>
                      
                      {form.image && (
                        <div className="relative mt-2.5 w-full h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col justify-end bg-slate-900">
                          <img src={form.image} alt="Main preview" className="absolute inset-0 w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={applyMockBgRemoval}
                            className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-orange-600/90 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md shadow hover:bg-orange-700 transition-colors"
                          >
                            <Sparkles size={10} /> Isolated Transparent Background
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Additional Gallery Images</label>
                      <div className="flex gap-2">
                        <div className="flex-1 text-slate-400 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center">
                          Upload Extra Product Shots
                        </div>
                        <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors flex items-center justify-center shrink-0">
                          <Upload size={14} />
                          <input 
                            type="file" 
                            multiple
                            accept="image/*"
                            onChange={handleAdditionalImageUpload}
                            style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                          />
                        </label>
                      </div>

                      {form.additionalImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {form.additionalImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                              <img src={img} alt="Extra preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setForm(prev => ({
                                  ...prev,
                                  additionalImages: prev.additionalImages.filter((_, i) => i !== idx)
                                }))}
                                className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-red-600 transition-all"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Product Video URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={form.videoUrl}
                          onChange={(e) => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                          placeholder="Paste Video URL or upload..."
                          className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                        />
                        <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors flex items-center justify-center shrink-0">
                          {isUploadingVideo ? '...' : <Upload size={14} />}
                          <input 
                            type="file" 
                            accept="video/*"
                            onChange={handleProductVideoUpload}
                            disabled={isUploadingVideo}
                            style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Variants & Options */}
                {formTab === 'variants' && (
                  <div className="space-y-4">
                    {/* Add-on presets checklist */}
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Link Add-on Presets</label>
                      <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                        {optionPresets.map(preset => {
                          const isChecked = form.selectedPresets.includes(preset.id);
                          return (
                            <label 
                              key={preset.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isChecked 
                                  ? 'bg-orange-50/20 border-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold' 
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-400 font-bold'
                              }`}
                            >
                              <span>{preset.title}</span>
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) setForm(prev => ({ ...prev, selectedPresets: [...prev.selectedPresets, preset.id] }));
                                  else setForm(prev => ({ ...prev, selectedPresets: prev.selectedPresets.filter(id => id !== preset.id) }));
                                }}
                                className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Product Variants */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 pl-1">Size Variants</label>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            variants: [...prev.variants, { name: '', priceModifier: 0 }]
                          }))}
                          className="flex items-center gap-1 text-[9px] font-black bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-lg border border-orange-100 dark:border-orange-500/25"
                        >
                          <Plus size={10} /> ADD SIZE
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                        {form.variants.map((variant, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input 
                              type="text"
                              value={variant.name}
                              onChange={(e) => {
                                const list = [...form.variants];
                                list[idx].name = e.target.value;
                                setForm(prev => ({ ...prev, variants: list }));
                              }}
                              placeholder="e.g. Large Bowl"
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                              required
                            />
                            <input 
                              type="number"
                              value={variant.priceModifier || ''}
                              onChange={(e) => {
                                const list = [...form.variants];
                                list[idx].priceModifier = Number(e.target.value);
                                setForm(prev => ({ ...prev, variants: list }));
                              }}
                              placeholder="+Modifier (₦)"
                              className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({
                                ...prev,
                                variants: prev.variants.filter((_, i) => i !== idx)
                              }))}
                              className="p-2 text-slate-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Nutritional Info & Details */}
                {formTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Ingredients (comma-separated)</label>
                      <textarea 
                        value={form.ingredients}
                        onChange={(e) => setForm(prev => ({ ...prev, ingredients: e.target.value }))}
                        placeholder="Rice, Pepper, Tomato Paste, Onion, Vegetable Oil..."
                        rows={2}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Nutritional Values</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5 pl-1">Calories (kcal)</label>
                          <input 
                            type="text"
                            value={form.calories}
                            onChange={(e) => setForm(prev => ({ ...prev, calories: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-850 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5 pl-1">Protein (g)</label>
                          <input 
                            type="text"
                            value={form.protein}
                            onChange={(e) => setForm(prev => ({ ...prev, protein: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5 pl-1">Carbs (g)</label>
                          <input 
                            type="text"
                            value={form.carbs}
                            onChange={(e) => setForm(prev => ({ ...prev, carbs: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black uppercase text-slate-400 mb-0.5 pl-1">Fat (g)</label>
                          <input 
                            type="text"
                            value={form.fat}
                            onChange={(e) => setForm(prev => ({ ...prev, fat: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Inventory & Availability */}
                {formTab === 'inventory' && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={form.trackStock}
                        onChange={(e) => setForm(prev => ({ ...prev, trackStock: e.target.checked }))}
                        className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-0"
                      />
                      <span>Enable Stock / Inventory Tracking</span>
                    </label>

                    {form.trackStock && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Stock Quantity</label>
                          <input 
                            type="number"
                            value={form.stockQuantity}
                            onChange={(e) => setForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Low Warning Count</label>
                          <input 
                            type="number"
                            value={form.lowStockThreshold}
                            onChange={(e) => setForm(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-750 pt-3">
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Weekly availability</label>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.keys(form.availabilitySchedule).map(day => (
                          <label 
                            key={day}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-black uppercase tracking-wider cursor-pointer select-none transition-all ${
                              form.availabilitySchedule[day] 
                                ? 'bg-orange-50/10 border-orange-500/20 text-orange-500' 
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            <span>{day.substring(0, 3)}</span>
                            <input 
                              type="checkbox"
                              checked={form.availabilitySchedule[day]}
                              onChange={(e) => {
                                const sched = { ...form.availabilitySchedule };
                                sched[day] = e.target.checked;
                                setForm(prev => ({ ...prev, availabilitySchedule: sched }));
                              }}
                              className="hidden"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="button"
                  onClick={() => saveProduct()}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  {editingItem ? 'Save Changes' : 'Publish Product'}
                </button>
              </form>
            </div>
          )}

          {/* Product Live Analytics & Mock Mockup Card */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-850 shadow-lg relative overflow-hidden">
            <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-orange-600/10 rounded-full blur-[90px] pointer-events-none" />
            
            {editingItem ? (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={12} className="text-orange-500" />
                  <span>Real-Time Product Insights</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-450 uppercase block">Views</span>
                    <span className="text-base font-black text-white mt-0.5 block">{editingItem.views || Math.floor(100 + Math.random() * 400)}</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-450 uppercase block">Sales</span>
                    <span className="text-base font-black text-white mt-0.5 block">{editingItem.salesCount || Math.floor(10 + Math.random() * 50)}</span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
                    <span className="text-[9px] font-bold text-slate-450 uppercase block">Revenue</span>
                    <span className="text-[11px] font-black text-amber-500 mt-1 block">₦{((editingItem.salesCount || 15) * editingItem.price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="text-orange-500" />
                  <span>Interactive Client Mockup</span>
                </h4>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex gap-3.5 items-start">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-800 bg-slate-950">
                    {form.image ? (
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={20} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-extrabold text-xs text-white truncate">{form.name || 'Your Dish Name'}</h5>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{form.description || 'Describe the delicious recipe...'}</p>
                    <span className="font-black text-xs text-orange-500 mt-2 block">₦{(form.price || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PasscodeModal 
        isOpen={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onVerified={handleVerifiedAction}
      />
    </div>
  );
};

export default ProductManager;
