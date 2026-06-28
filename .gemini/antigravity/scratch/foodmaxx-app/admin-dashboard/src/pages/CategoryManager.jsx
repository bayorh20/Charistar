import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { db, storage } from '../firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Plus, Edit, Trash2, Tag, Layers, CheckSquare, Eye, EyeOff, 
  ArrowUp, ArrowDown, Upload, X, BarChart2, Star, Check, Globe
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

const CategoryManager = () => {
  const { categories, menuItems, logAction } = useApp();
  const toast = useToast();

  // Modals & Passcode
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type, id }

  // Form states
  const [editingCategory, setEditingCategory] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    id: '',
    label: '',
    image: '',
    videoUrl: '',
    description: '',
    parentId: '', // For sub-categories
    status: 'active', // 'active' or 'inactive'
    visibility: 'public', // 'public' or 'hidden'
    featured: false
  });

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterParent, setFilterParent] = useState('all');

  // Available parent options (only top-level categories)
  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const matchesSearch = c.label.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search.toLowerCase());
      const matchesParent = filterParent === 'all' 
        ? true 
        : filterParent === 'top' 
          ? !c.parentId 
          : c.parentId === filterParent;
      return matchesSearch && matchesParent;
    });
  }, [categories, search, filterParent]);

  // Image Upload helper with canvas compression
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file, 600, 600, 0.6);
      setForm(prev => ({ ...prev, image: compressed }));
    }
  };

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const handleVideoUpload = async (e) => {
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
    const toastId = toast.info('Uploading Video', 'Uploading category clip to Firebase Storage...');
    try {
      const storageRef = ref(storage, `categories_video/${form.id || 'temp'}_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setForm(prev => ({ ...prev, videoUrl: downloadUrl }));
      toast.dismiss(toastId);
      toast.success('Upload Success 🎉', 'Video uploaded successfully.');
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Video upload failed:', err);
      toast.error('Upload Failed', err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Operations: Passcode Verification
  const triggerDelete = (id) => {
    setPendingAction({ type: 'delete_category', id });
    setPasscodeOpen(true);
  };

  const handleVerifiedAction = async () => {
    if (!pendingAction) return;
    const { type, id } = pendingAction;
    
    try {
      if (type === 'delete_category') {
        const cat = categories.find(c => c.id === id);
        await deleteDoc(doc(db, 'categories', id));
        logAction(`Deleted menu category: ${cat?.label || id}`);
        toast.success('Category Deleted', `"${cat?.label || id}" has been removed.`);
        if (editingCategory?.id === id) {
          closeForm();
        }
      }
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
    setPendingAction(null);
  };

  const closeForm = () => {
    setEditingCategory(null);
    setIsFormOpen(false);
    setForm({
      id: '',
      label: '',
      image: '',
      videoUrl: '',
      description: '',
      parentId: '',
      status: 'active',
      visibility: 'public',
      featured: false
    });
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({
      id: cat.id,
      label: cat.label || '',
      image: cat.image || '',
      videoUrl: cat.videoUrl || '',
      description: cat.description || '',
      parentId: cat.parentId || '',
      status: cat.status || 'active',
      visibility: cat.visibility || 'public',
      featured: !!cat.featured
    });
    setIsFormOpen(true);
  };

  const openCreate = () => {
    closeForm();
    setIsFormOpen(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    if (!form.label || !form.id) {
      toast.error('Error', 'Slug and Label are required.');
      return;
    }

    const toastId = toast.info('Saving Category', 'Uploading media assets and writing details...');
    let finalImageUrl = form.image || '';

    try {
      if (form.image && form.image.startsWith('data:image/')) {
        if (storage) {
          try {
            const storageRef = ref(storage, `categories/${form.id}_${Date.now()}`);
            const snapshot = await uploadString(storageRef, form.image, 'data_url');
            finalImageUrl = await getDownloadURL(snapshot.ref);
          } catch (storageErr) {
            console.warn('Storage upload failed, using data URL fallback:', storageErr);
          }
        }
      }

      await setDoc(doc(db, 'categories', form.id), {
        label: form.label,
        image: finalImageUrl,
        videoUrl: form.videoUrl || '',
        description: form.description || '',
        parentId: form.parentId || '',
        status: form.status || 'active',
        visibility: form.visibility || 'public',
        featured: !!form.featured,
        order: editingCategory ? (editingCategory.order || 1) : (categories.length + 1)
      }, { merge: true });
      
      logAction(`${editingCategory ? 'Updated' : 'Created'} category: ${form.label}`);
      toast.dismiss(toastId);
      toast.success(
        editingCategory ? 'Category Updated!' : 'Category Created!',
        `"${form.label}" has been saved successfully.`
      );
      closeForm();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Save Failed', err.message);
    }
  };

  // Reorder sorting logic
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = async (index) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const list = [...categories];
    const draggedItem = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(index, 0, draggedItem);

    setDraggedIndex(null);

    // Save display order to Firestore
    const toastId = toast.info('Updating Sort Order', 'Saving display sequence to database...');
    try {
      await Promise.all(
        list.map((cat, idx) => 
          setDoc(doc(db, 'categories', cat.id), { order: idx + 1 }, { merge: true })
        )
      );
      toast.dismiss(toastId);
      toast.success('Sequence Saved', 'Category display order updated successfully.');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Reorder Failed', err.message);
    }
  };

  const adjustOrder = async (index, direction) => {
    const list = [...categories];
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    const toastId = toast.info('Updating Sequence', 'Saving sort order...');
    try {
      await Promise.all(
        list.map((cat, idx) => 
          setDoc(doc(db, 'categories', cat.id), { order: idx + 1 }, { merge: true })
        )
      );
      toast.dismiss(toastId);
      toast.success('Sequence Saved', 'Sort order updated.');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Reorder Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-wider">Category Workspace</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Organize categories and subcategories</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all"
        >
          <Plus size={14} />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Main Category List */}
        <div className="xl:col-span-2 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by label or slug..."
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
            <select
              value={filterParent}
              onChange={(e) => setFilterParent(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-330 focus:outline-none"
            >
              <option value="all">All Hierarchies</option>
              <option value="top">Top-Level Only</option>
              {parentCategories.map(p => (
                <option key={p.id} value={p.id}>Child of: {p.label}</option>
              ))}
            </select>
          </div>

          {/* Draggable Category List */}
          <div className="space-y-3">
            {filteredCategories.map((cat, index) => {
              const itemsCount = menuItems.filter(m => m.category === cat.id).length;
              
              // Real-time changes showing before save
              const isEditingThis = editingCategory && editingCategory.id === cat.id;
              const displayLabel = isEditingThis ? form.label : cat.label;
              const displayImage = isEditingThis ? form.image : cat.image;
              const displayDescription = isEditingThis ? form.description : cat.description;
              const displayFeatured = isEditingThis ? form.featured : cat.featured;
              const displayStatus = isEditingThis ? form.status : cat.status;
              const displayVisibility = isEditingThis ? form.visibility : cat.visibility;

              return (
                <div 
                  key={cat.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-150 dark:border-slate-700/80 shadow-sm hover:border-orange-500/30 transition-all cursor-move ${
                    draggedIndex === index ? 'opacity-40 scale-[0.98]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-[10px] font-black text-slate-350 dark:text-slate-500 uppercase shrink-0 min-w-[20px]">
                      #{index + 1}
                    </span>
                    <span className="w-12 h-12 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                      {displayImage ? (
                        <img src={displayImage} alt={displayLabel} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <Tag size={20} />
                      )}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight">
                          {displayLabel}
                        </h4>
                        {cat.parentId && (
                          <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase">
                            Child of: {cat.parentId}
                          </span>
                        )}
                        {displayFeatured && (
                          <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5 uppercase">
                        Slug: {cat.id} | {itemsCount} items
                      </p>
                      {displayDescription && (
                        <p className="text-[10px] text-slate-400/80 dark:text-slate-400/60 line-clamp-1 mt-1 font-semibold leading-relaxed">
                          {displayDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3.5 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/50">
                    {/* Status & Visibility Badges */}
                    <div className="flex gap-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        displayStatus === 'active' 
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {displayStatus || 'active'}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        displayVisibility === 'public'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                      }`}>
                        {displayVisibility === 'public' ? <Globe size={8} /> : <EyeOff size={8} />}
                        {displayVisibility || 'public'}
                      </span>
                    </div>

                    {/* Sorting Arrows */}
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded-lg border border-slate-100 dark:border-slate-750">
                      <button
                        onClick={(e) => { e.stopPropagation(); adjustOrder(index, -1); }}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-orange-500 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <span className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                      <button
                        onClick={(e) => { e.stopPropagation(); adjustOrder(index, 1); }}
                        disabled={index === categories.length - 1}
                        className="p-1 text-slate-400 hover:text-orange-500 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-750 pl-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                        className="p-1.5 bg-slate-50 hover:bg-orange-50 dark:bg-slate-900/60 dark:hover:bg-orange-500/10 text-slate-400 hover:text-orange-500 rounded-xl transition-all"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerDelete(cat.id); }}
                        className="p-1.5 bg-slate-50 hover:bg-red-50 dark:bg-slate-900/60 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center rounded-3xl">
                <span className="text-3xl">🗂️</span>
                <p className="text-sm font-bold text-slate-400 mt-2">No matching categories found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Editor & Live Preview Panel */}
        <div className="space-y-6">
          {/* Create/Edit Form */}
          {isFormOpen && (
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-750 pb-3">
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <button onClick={closeForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={saveCategory} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Category Code / Slug</label>
                  <input 
                    type="text" 
                    disabled={!!editingCategory}
                    value={form.id}
                    onChange={(e) => setForm(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                    placeholder="e.g. jollof-bowls"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Category Label</label>
                  <input 
                    type="text" 
                    value={form.label}
                    onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Jollof Bowls"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Parent Category</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                  >
                    <option value="">None (Top-Level)</option>
                    {parentCategories.filter(p => p.id !== form.id).map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Description</label>
                  <textarea 
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description for customers..."
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Category Image / Banner</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={form.image}
                      onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="Paste Image URL or upload..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-semibold text-slate-850 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                    <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors flex items-center justify-center shrink-0">
                      <Upload size={14} />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Category Video Clip (Optional)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={form.videoUrl}
                      onChange={(e) => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      placeholder="Paste Video URL or upload..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-semibold text-slate-850 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                    <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-250 transition-colors flex items-center justify-center shrink-0">
                      {isUploadingVideo ? '...' : <Upload size={14} />}
                      <input 
                        type="file" 
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={isUploadingVideo}
                        style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                      />
                    </label>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Visibility</label>
                    <select
                      value={form.visibility}
                      onChange={(e) => setForm(prev => ({ ...prev, visibility: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                    >
                      <option value="public">Public</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-550 select-none cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 rounded text-orange-500 border-slate-200 focus:ring-0"
                    />
                    <span>Mark as Featured Category</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </form>
            </div>
          )}

          {/* Live Mobile Client Preview Card */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-850 shadow-lg relative overflow-hidden">
            <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-orange-600/10 rounded-full blur-[90px] pointer-events-none" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Customer App Live Preview</span>
            </h4>
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center min-h-[140px] relative overflow-hidden group">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg overflow-hidden shrink-0 text-orange-500"
                style={{ backgroundColor: '#FFF4E3' }}
              >
                {form.image ? (
                  <img src={form.image} alt={form.label || 'Category'} className="w-full h-full object-cover" />
                ) : (
                  <Tag size={24} />
                )}
              </div>
              <h5 className="font-extrabold text-sm text-slate-100 mt-3">{form.label || 'Untitled Category'}</h5>
              <p className="text-[9px] text-slate-400 max-w-[160px] truncate mt-1">
                {form.description || 'Category description will render here.'}
              </p>

              {form.featured && (
                <span className="absolute top-2.5 right-2.5 text-[8px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full">
                  ★ Featured
                </span>
              )}
            </div>
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

export default CategoryManager;
