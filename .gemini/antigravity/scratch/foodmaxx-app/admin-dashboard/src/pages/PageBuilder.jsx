import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { db, storage } from '../firebase/config';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Eye, EyeOff, ChevronUp, ChevronDown, Save, Play,
  Film, Image as ImageIcon, Grid, AlignJustify, Megaphone,
  LayoutDashboard, Sparkles, Plus, Trash2, Edit, Check, ToggleLeft,
  ToggleRight, AlertCircle, Smartphone, Sliders, X, GripVertical
} from 'lucide-react';
import PasscodeModal from '../components/PasscodeModal';
import { getAnimationDef, TRANSITION_ANIMATIONS, ANIMATION_CATEGORIES } from '../utils/transitionAnimations';

// ── Section icons map ──────────────────────────────────────────────────────────
const SECTION_ICONS = {
  greeting:     LayoutDashboard,
  hero:         Film,
  announcement: Megaphone,
  categories:   Grid,
  trending:     Sparkles,
  dishes:       AlignJustify
};

const SECTION_COLORS = {
  greeting:     'text-purple-500',
  hero:         'text-blue-500',
  announcement: 'text-amber-500',
  categories:   'text-green-500',
  trending:     'text-orange-500',
  dishes:       'text-slate-500'
};

const PASTEL_PALETTE = [
  '#FFF4E3', // Soft warm peach/cream
  '#FFEAE6', // Soft coral/orange
  '#F0E6FF', // Soft lavender purple
  '#FFE3EB', // Soft rose pink
  '#FFFCE6', // Soft custard yellow
  '#E3F5E3', // Soft minty green
  '#FDF2E2', // Soft warm sand/tan
  '#E0F4FF', // Soft sky blue
  '#E2F7F2', // Soft mint/teal
  '#FCE4EC'  // Soft pink-red
];

const getPastelColor = (id, index) => {
  const normalizedId = String(id).toLowerCase().trim();
  const presetColors = {
    rice: '#FFF4E3',
    ricebowl: '#FFF4E3',
    pasta: '#FFEAE6',
    pastabowl: '#FFEAE6',
    yogurt: '#F0E6FF',
    parfait: '#FFE3EB',
    icecream: '#FFFCE6',
    salad: '#E3F5E3',
    shawarma: '#FDF2E2',
    snacks: '#E0F4FF'
  };
  if (presetColors[normalizedId]) return presetColors[normalizedId];
  
  if (typeof index === 'number') {
    return PASTEL_PALETTE[index % PASTEL_PALETTE.length];
  }
  
  let hash = 0;
  for (let i = 0; i < normalizedId.length; i++) {
    hash = normalizedId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_PALETTE[Math.abs(hash) % PASTEL_PALETTE.length];
};

// ── Mobile phone mockup preview ────────────────────────────────────────────────
function PhoneMockup({ sections, announcement, animations = {}, activePreviewScreen = 'home', categories = [] }) {
  const sortedVisible = [...sections]
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);

  const animMode = animations.mode || 'slide-left';
  const animDuration = animations.duration || 0.35;
  const def = getAnimationDef(animMode);
  
  const getTransitionVariants = () => {
    return def.variants;
  };

  const getTransitionConfig = () => {
    if (!def || !def.config) return {};
    const config = JSON.parse(JSON.stringify(def.config));
    const type = animations.type || 'default';
    
    Object.keys(config).forEach(key => {
      if (config[key] && typeof config[key] === 'object') {
        if (type === 'spring') {
          config[key].type = 'spring';
          config[key].stiffness = animations.stiffness ?? 320;
          config[key].damping = animations.damping ?? 30;
          config[key].mass = animations.mass ?? 1;
        } else if (type === 'tween') {
          config[key].type = 'tween';
          config[key].ease = animations.ease || 'easeInOut';
          config[key].duration = animDuration;
        } else {
          if ('duration' in config[key] || config[key].type === 'tween') {
            config[key].duration = animDuration;
          }
        }
      }
    });
    return config;
  };

  return (
    <div className="relative mx-auto" style={{ width: '200px', height: '420px', perspective: '1000px' }}>
      {/* Phone shell */}
      <div className="absolute inset-0 bg-slate-900 rounded-[36px] border-4 border-slate-700 shadow-2xl overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-slate-900 rounded-b-2xl z-[9999]" />
        {/* Screen */}
        <div className="absolute inset-1 bg-white dark:bg-slate-950 rounded-[30px] overflow-hidden flex flex-col" style={{ transformStyle: 'preserve-3d' }}>
          {/* Status bar */}
          <div className="h-5 bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-between px-3 shrink-0 z-[9998]">
            <span className="text-white text-[8px] font-black">9:41</span>
            <span className="text-white text-[8px] font-black">●●●</span>
          </div>

          {/* Screen Content wrapped in AnimatePresence for real-time transition preview */}
          <div className="flex-1 overflow-hidden relative" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activePreviewScreen}
                variants={getTransitionVariants()}
                initial="enter"
                animate="center"
                exit="exit"
                transition={getTransitionConfig()}
                style={{
                  width: '100%',
                  height: '100%',
                  backfaceVisibility: 'hidden',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px',
                  backgroundColor: 'inherit',
                  willChange: 'transform, opacity'
                }}
              >
                {activePreviewScreen === 'home' ? (
                  <div className="flex-1 overflow-hidden flex flex-col gap-1">
                    {sortedVisible.map(section => (
                      <div key={section.id} className={`rounded-xl shrink-0 overflow-hidden ${
                        section.id === 'hero' ? 'h-16 flex items-center justify-center' :
                        section.id === 'greeting' ? 'h-6' :
                        section.id === 'announcement' ? 'h-6 bg-amber-50 border border-amber-200 flex items-center px-2' :
                        section.id === 'categories' ? 'h-auto py-1' :
                        section.id === 'trending' ? 'h-[74px]' :
                        section.id === 'dishes' ? 'h-[88px]' :
                        'flex-1 min-h-0'
                      }`}>
                        {section.id === 'hero' && (
                          <div className="w-full h-full relative overflow-hidden bg-slate-900 flex items-center justify-center">
                            {section.type === 'video' ? (
                              <video
                                key={(section.videoLoops && section.videoLoops[0]?.url) || section.videoUrl}
                                src={(section.videoLoops && section.videoLoops[0]?.url) || section.videoUrl || '/splash.mp4'}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (section.slides && section.slides[0]?.image) ? (
                                <div className="w-full h-full relative">
                                  <img 
                                    src={section.slides[0].image} 
                                    alt="Mockup slide" 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/45 flex flex-col justify-end p-1">
                                    <span className="text-white text-[5px] font-black leading-tight truncate">{section.slides[0].title}</span>
                                    <span className="text-white/80 text-[4px] leading-tight truncate">{section.slides[0].desc}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-1">
                                  <Film size={12} className="text-white mx-auto mb-0.5" />
                                  <span className="text-white text-[6px] font-black uppercase tracking-wide">No slides</span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                        {section.id === 'greeting' && (
                          <div className="px-2 flex items-center h-full">
                            <span className="text-[7px] font-black text-slate-700 dark:text-slate-350">Hey Foodie! 😉</span>
                          </div>
                        )}
                        {section.id === 'announcement' && (
                          <span className="text-[7px] font-bold text-amber-700 truncate">{section.badge || 'Pre-Order Only'}</span>
                        )}
                        {section.id === 'categories' && (
                          <div className={
                            section.layout === 'scroll'
                              ? "flex gap-1 p-1 overflow-x-auto select-none no-scrollbar"
                              : section.layout === 'two-row'
                              ? "grid grid-rows-2 grid-flow-col gap-1 p-1 overflow-x-auto select-none no-scrollbar"
                              : "grid grid-cols-4 gap-1 p-1 select-none"
                          }>
                            {(categories && categories.length > 0 ? categories : [
                              { id: '1', label: 'Rice', icon: '🍔' },
                              { id: '2', label: 'Pasta', icon: '🍗' },
                              { id: '3', label: 'Yogurt', icon: '🍜' },
                              { id: '4', label: 'Salad', icon: '🌮' }
                            ]).map((cat, i) => {
                              const emoji = cat.icon || '🍔';
                              return (
                                <div 
                                  key={cat.id || i} 
                                  className={`${
                                    section.layout === 'scroll' || section.layout === 'two-row' ? 'w-11' : 'w-14'
                                  } h-[21px] rounded-md flex flex-col items-center justify-center p-0.5 shrink-0 border border-transparent`}
                                  style={{ backgroundColor: getPastelColor(cat.id, i) }}
                                >
                                  <span className="text-[7px] leading-none">{emoji}</span>
                                  <span className="text-[4.5px] font-black truncate w-full text-center text-slate-900" style={{ color: '#1A1A1A' }}>{cat.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {section.id === 'trending' && (
                          <div className="p-1 h-full flex flex-col justify-between">
                            <span className="text-[6.5px] font-black text-slate-750 dark:text-slate-300 truncate">{section.title || 'Trending Deals'}</span>
                            <div className="flex gap-1 flex-1 min-h-0 mt-0.5">
                              {[1,2,3].map(i => (
                                <div key={i} className="flex-1 bg-orange-50 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center gap-0.5">
                                  <div className="w-4 h-4 rounded-md bg-orange-200 dark:bg-orange-800" />
                                  <div className="w-6 h-0.5 bg-slate-200 dark:bg-slate-700 rounded" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {section.id === 'dishes' && (
                          <div className="p-1 h-full flex flex-col justify-between">
                            <span className="text-[6.5px] font-black text-slate-750 dark:text-slate-300 truncate">{section.title || 'All Dishes'}</span>
                            <div className="grid grid-cols-2 gap-1 flex-1 min-h-0 mt-0.5">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-850 rounded-lg" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-2 p-1">
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center px-2 gap-1.5 shrink-0">
                      <span className="text-[8px]">🔍</span>
                      <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                    <span className="text-[8px] font-black text-slate-750 dark:text-slate-250">Search Results</span>
                    <div className="grid grid-cols-2 gap-1.5 flex-1 overflow-hidden">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl p-1.5 flex flex-col gap-1 justify-between">
                          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded" />
                          <div className="w-6 h-1 bg-orange-200 dark:bg-orange-900 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="h-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 shrink-0 z-[9998] bg-white dark:bg-slate-900">
            {['🏠','🔍','📋','💬','👤'].map((icon, i) => (
              <span key={i} className={`text-[11px] transition-opacity cursor-pointer ${
                (activePreviewScreen === 'home' && i === 0) || (activePreviewScreen === 'explore' && i === 1)
                  ? 'opacity-100 scale-110'
                  : 'opacity-40 hover:opacity-75'
              }`}>{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Builder ──────────────────────────────────────────────────────────
const PageBuilder = () => {
  const { pageLayout, categories, logAction } = useApp();
  const toast = useToast();

  const animationsRef = useRef(null);
  const [showAnimationsPreview, setShowAnimationsPreview] = useState(false);

  // Intersection observer to track animations panel visibility and auto-trigger transition preview
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowAnimationsPreview(true);
          // Trigger transition animation preview automatically on intersection
          setActivePreviewScreen('explore');
          setTimeout(() => {
            setActivePreviewScreen('home');
          }, 800);
        } else {
          setShowAnimationsPreview(false);
        }
      },
      {
        threshold: 0.2
      }
    );

    const el = animationsRef.current;
    if (el) {
      observer.observe(el);
    }
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const [sections, setSections] = useState([]);
  const [animations, setAnimations] = useState({ mode: 'slide-left', duration: 0.35 });
  const [selectedAnimationCategory, setSelectedAnimationCategory] = useState('normal');
  const [activePreviewScreen, setActivePreviewScreen] = useState('home');
  const [expandedSection, setExpandedSection] = useState(null);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false); // tracks unsaved local edits

  // New slide form state (for hero section)
  const [slideForm, setSlideForm] = useState({ title: '', desc: '', image: '' });
  const [editingSlideIdx, setEditingSlideIdx] = useState(null);
  const [isSlideFormOpen, setIsSlideFormOpen] = useState(false);

  // File Uploading state
  const [isUploading, setIsUploading] = useState(false);

  // Categories Builder States
  const [editingCatId, setEditingCatId] = useState(null);
  const [catForm, setCatForm] = useState({ id: '', label: '', icon: '🍔', image: '' });
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState([]);
  const dragCatRef = useRef(null);
  const dragOverCatRef = useRef(null);

  const openAddCategory = () => {
    setCatForm({ id: '', label: '', icon: '🍔', image: '' });
    setEditingCatId(null);
    setIsCatFormOpen(true);
  };

  const openEditCategory = (cat) => {
    setCatForm({ id: cat.id, label: cat.label, icon: cat.icon || '🍔', image: cat.image || '' });
    setEditingCatId(cat.id);
    setIsCatFormOpen(true);
  };

  // Helper to determine if a file is a video by mime-type or extension
  const isVideoFile = (file) => {
    if (!file) return false;
    const type = file.type || '';
    if (type.startsWith('video/')) return true;
    const ext = file.name.toLowerCase().split('.').pop();
    return ['mp4', 'webm', 'mov', 'avi', 'mkv', '3gp', 'flv'].includes(ext);
  };

  // File upload handler
  const handleFileUpload = async (e, onUploadSuccess) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = isVideoFile(file);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File Too Large', `Max size allowed is ${isVideo ? '50MB' : '5MB'}`);
      return;
    }

    setIsUploading(true);
    const toastId = toast.info('Uploading...', 'Uploading asset to Firebase Storage...');
    try {
      const fileRef = ref(storage, `page_builder/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      onUploadSuccess(downloadUrl);
      toast.dismiss(toastId);
      toast.success('Upload Success 🎉', 'File uploaded and synced.');
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Upload Error:', err);
      toast.error('Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleVideoUpload = async (e, sectionId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const isVideo = isVideoFile(file);
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File Too Large', `${file.name} exceeds the ${isVideo ? '50MB' : '5MB'} limit.`);
        return;
      }
    }

    setIsUploading(true);
    const toastId = toast.info('Uploading Videos...', `Uploading ${files.length} videos...`);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storage, `page_builder/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
      }

      setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        const currentLoops = [...(s.videoLoops || (s.videoUrl ? [{ url: s.videoUrl, id: 'default' }] : []))];
        const newLoops = uploadedUrls.map((url, index) => ({
          url,
          id: `video-${Date.now()}-${index}`
        }));
        return { ...s, videoLoops: [...currentLoops, ...newLoops] };
      }));

      toast.dismiss(toastId);
      toast.success('Upload Success 🎉', `Added ${files.length} video loops.`);
    } catch (err) {
      toast.dismiss(toastId);
      console.error('Multiple Video Upload Error:', err);
      toast.error('Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMultipleImageUpload = async (e, sectionId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const isVideo = isVideoFile(file);
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File Too Large', `${file.name} exceeds the ${isVideo ? '50MB' : '5MB'} limit.`);
        return;
      }
    }

    setIsUploading(true);
    const toastId = toast.info('Uploading Images...', `Uploading ${files.length} images...`);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileRef = ref(storage, `page_builder/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const formattedTitle = cleanName
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

        uploadedUrls.push({
          url: downloadUrl,
          title: formattedTitle
        });
      }

      setSections(prev => prev.map(s => {
        if (s.id !== sectionId) return s;
        const currentSlides = [...(s.slides || [])];
        const newSlides = uploadedUrls.map((item, index) => ({
          id: `slide-${Date.now()}-${index}`,
          image: item.url,
          title: item.title,
          desc: 'Special Offer'
        }));
        return { ...s, slides: [...currentSlides, ...newSlides] };
      }));

      toast.dismiss(toastId);
      toast.success('Upload Success 🎉', `Added ${files.length} image slides.`);
    } catch (err) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error('Upload Failed', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Video Loop Helpers
  const addVideoLoop = (sectionId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const loops = [...(s.videoLoops || (s.videoUrl ? [{ url: s.videoUrl, id: 'default' }] : [{ url: '/splash.mp4', id: 'default' }]))];
      loops.push({ url: '/splash.mp4', id: `video-${Date.now()}` });
      return { ...s, videoLoops: loops };
    }));
  };

  const deleteVideoLoop = (sectionId, idx) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const loops = (s.videoLoops || [{ url: s.videoUrl || '/splash.mp4', id: 'default' }]).filter((_, i) => i !== idx);
      return { ...s, videoLoops: loops };
    }));
  };

  const updateVideoLoopUrl = (sectionId, idx, value) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const loops = [...(s.videoLoops || [{ url: s.videoUrl || '/splash.mp4', id: 'default' }])];
      loops[idx] = { ...loops[idx], url: value };
      return { ...s, videoLoops: loops };
    }));
  };

  // Sync localCategories from Firestore categories (sorted)
  useEffect(() => {
    setLocalCategories([...categories].sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, [categories]);

  // Drag-and-drop handlers for categories
  const handleCatDragStart = (idx) => {
    dragCatRef.current = idx;
  };

  const handleCatDragEnter = (idx) => {
    dragOverCatRef.current = idx;
    setLocalCategories(prev => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragCatRef.current, 1);
      updated.splice(idx, 0, dragged);
      dragCatRef.current = idx;
      return updated;
    });
  };

  const handleCatDragEnd = async () => {
    dragCatRef.current = null;
    dragOverCatRef.current = null;
    // Persist new order to Firestore in a batch
    try {
      const batch = writeBatch(db);
      localCategories.forEach((cat, idx) => {
        batch.set(doc(db, 'categories', cat.id), { order: idx }, { merge: true });
      });
      await batch.commit();
      toast.success('Order Saved', 'Category order updated.');
    } catch (err) {
      toast.error('Reorder Failed', err.message);
    }
  };

  const saveCategoryBuilder = async () => {
    if (!catForm.label || !catForm.id) {
      toast.warning('Fields Required', 'Slug and Label are required.');
      return;
    }
    try {
      // When editing, always write to the ORIGINAL doc (editingCatId), not catForm.id
      const docId = editingCatId || catForm.id;
      const isNew = !editingCatId;
      await setDoc(doc(db, 'categories', docId), {
        label: catForm.label,
        icon: catForm.icon || '🍔',
        image: catForm.image ?? '',
        order: isNew ? categories.length : (categories.find(c => c.id === editingCatId)?.order ?? categories.length)
      }, { merge: true });

      setIsCatFormOpen(false);
      setEditingCatId(null);
      setCatForm({ id: '', label: '', icon: '🍔', image: '' });
      toast.success('Category Saved', 'Firestore category updated.');
    } catch (err) {
      toast.error('Save Failed', err.message);
    }
  };

  const deleteCategoryBuilder = async (catId) => {
    if (!window.confirm(`Are you sure you want to delete the category "${catId}"?`)) return;
    try {
      await deleteDoc(doc(db, 'categories', catId));
      toast.success('Category Deleted', 'The category has been removed.');
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  // Sync from Firestore via context — only when NOT dirty (no unsaved edits)
  useEffect(() => {
    if (isDirty) return; // don't overwrite local edits
    if (pageLayout?.sections) {
      setSections([...pageLayout.sections].sort((a, b) => a.order - b.order));
    }
    if (pageLayout?.animations) {
      setAnimations(pageLayout.animations);
    }
  }, [pageLayout, isDirty]);

  const triggerPreview = useCallback(() => {
    setActivePreviewScreen(prev => prev === 'home' ? 'explore' : 'home');
  }, []);

  useEffect(() => {
    if (!animations.mode) return;
    const cleanMode = String(animations.mode).toLowerCase().trim();
    const found = TRANSITION_ANIMATIONS.find(a => a.id === cleanMode);
    if (found && found.category !== selectedAnimationCategory) {
      setSelectedAnimationCategory(found.category);
    }
    
    setActivePreviewScreen('explore');
    const timer1 = setTimeout(() => {
      setActivePreviewScreen('home');
    }, 1000);
    return () => clearTimeout(timer1);
  }, [animations.mode]);

  // ── Section operations ─────────────────────────────────────────────────────
  const toggleVisibility = (id) => {
    setIsDirty(true);
    setSections(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s));
  };

  const moveSection = (id, dir) => {
    setIsDirty(true);
    setSections(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(s => s.id === id);
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= sorted.length) return prev;
      // Swap order values
      const newSections = sorted.map(s => ({ ...s }));
      const tempOrder = newSections[idx].order;
      newSections[idx].order = newSections[targetIdx].order;
      newSections[targetIdx].order = tempOrder;
      return newSections;
    });
  };

  const updateSection = (id, patch) => {
    setIsDirty(true);
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  // ── Slide management (hero section) ───────────────────────────────────────
  const openAddSlide = (sectionId) => {
    setSlideForm({ title: '', desc: '', image: '' });
    setEditingSlideIdx(null);
    setIsSlideFormOpen(sectionId);
  };

  const openEditSlide = (sectionId, idx) => {
    const section = sections.find(s => s.id === sectionId);
    setSlideForm({ ...(section.slides || [])[idx] });
    setEditingSlideIdx(idx);
    setIsSlideFormOpen(sectionId);
  };

  const saveSlide = (sectionId) => {
    if (!slideForm.title || !slideForm.image) {
      toast.warning('Missing Fields', 'Please enter a title and image URL for this slide.');
      return;
    }
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const slides = [...(s.slides || [])];
      if (editingSlideIdx !== null) {
        slides[editingSlideIdx] = { ...slideForm, id: slides[editingSlideIdx]?.id || `slide-${Date.now()}` };
      } else {
        slides.push({ ...slideForm, id: `slide-${Date.now()}` });
      }
      return { ...s, slides };
    }));
    setIsSlideFormOpen(null);
    toast.success('Slide Saved', 'Hero slide has been updated.');
  };

  const deleteSlide = (sectionId, idx) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const slides = (s.slides || []).filter((_, i) => i !== idx);
      return { ...s, slides };
    }));
  };

  // ── Save to Firestore ──────────────────────────────────────────────────────
  const handleVerifiedSave = async () => {
    setIsSaving(true);
    try {
      const layoutData = {
        sections: [...sections].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i })),
        animations,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'settings', 'page_layout'), layoutData, { merge: true });
      logAction('Updated PWA home page layout via Page Builder');
      setIsDirty(false); // clear dirty flag after successful save
      toast.success('Layout Published! 🎉', 'The customer app home page has been updated in real-time.');
    } catch (err) {
      toast.error('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

      {/* ── Left: Section Editor ───────────────────────────────────────────────── */}
      <div className="xl:col-span-2 space-y-5 h-fit">

        {/* Header card */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Layers size={24} />
            <h2 className="font-black text-xl">Frontend Page Builder</h2>
          </div>
          <p className="text-orange-100 text-sm font-semibold leading-relaxed">
            Drag sections up or down, toggle their visibility, customize content and animations. Changes are published to the customer app in real-time when you save.
          </p>
        </div>

        {/* Section list */}
        <div className="space-y-3">
          {sortedSections.map((section, idx) => {
            const Icon = SECTION_ICONS[section.id] || Layers;
            const colorClass = SECTION_COLORS[section.id] || 'text-slate-500';
            const isExpanded = expandedSection === section.id;

            return (
              <div
                key={section.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
                  section.visible
                    ? 'border-slate-100 dark:border-slate-700'
                    : 'border-dashed border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                {/* Section Header Row */}
                <div className="flex items-center gap-3 p-4">
                  {/* Move Arrows */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveSection(section.id, -1)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 text-slate-400 transition-colors"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 1)}
                      disabled={idx === sortedSections.length - 1}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 text-slate-400 transition-colors"
                    >
                      <ChevronDown size={13} />
                    </button>
                  </div>

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon size={17} />
                  </div>

                  {/* Title + Badge */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{section.label}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${section.visible ? 'text-green-500' : 'text-slate-400'}`}>
                      {section.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  {/* Position badge */}
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                    #{idx + 1}
                  </span>

                  {/* Visibility Toggle */}
                  <button
                    onClick={() => toggleVisibility(section.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      section.visible
                        ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-600'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                    className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-500 hover:text-orange-500 transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                </div>

                {/* Expanded Section Editor */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 space-y-4"
                    >
                      {/* Greeting Section Editor */}
                      {section.id === 'greeting' && (
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Greeting Text (shown above user name)</label>
                          <p className="text-[10px] text-slate-400 mb-2 pl-1">Edit the greeting headline and subtitle in the <strong>Branding Manager → PWA Configuration</strong> section.</p>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-semibold">
                            Example: <span className="text-orange-500 font-black">"Hey Quickprint! 😉"</span> — name is auto-filled from user profile.
                          </div>
                        </div>
                      )}

                      {/* Announcement Banner Editor */}
                      {section.id === 'announcement' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Badge Label</label>
                            <input
                              type="text"
                              value={section.badge ?? ''}
                              onChange={e => updateSection(section.id, { badge: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                              placeholder="e.g. Pre-Order Only"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Announcement Text</label>
                            <textarea
                              rows={2}
                              value={section.text ?? ''}
                              onChange={e => updateSection(section.id, { text: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 leading-relaxed resize-none"
                              placeholder="Lunch order closes at 10:00 AM..."
                            />
                          </div>
                        </>
                      )}

                      {/* Hero Section Editor */}
                      {section.id === 'hero' && (
                        <div className="space-y-4">
                          {/* Type selector */}
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Display Type</label>
                            <div className="flex gap-2">
                              {[
                                { value: 'video', label: 'Video Loop', icon: Film },
                                { value: 'slider', label: 'Image Slides', icon: ImageIcon }
                              ].map(({ value, label, icon: BtnIcon }) => (
                                <button
                                  key={value}
                                  onClick={() => updateSection(section.id, { type: value })}
                                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-bold text-xs rounded-xl border transition-all ${
                                    section.type === value
                                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  <BtnIcon size={13} />
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Video Loops (if video) */}
                          {section.type === 'video' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Video Loops ({(section.videoLoops || [{ url: section.videoUrl || '/splash.mp4', id: 'default' }]).length})</label>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => addVideoLoop(section.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-[10px] uppercase transition-all"
                                  >
                                    <Plus size={11} /> Add Video Loop
                                  </button>
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase transition-all cursor-pointer">
                                    <Plus size={11} /> Upload Multiple
                                    <input
                                      type="file"
                                      multiple
                                      accept="video/*"
                                      onChange={e => handleMultipleVideoUpload(e, section.id)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                              {(section.videoLoops || [{ url: section.videoUrl || '/splash.mp4', id: 'default' }]).map((loop, i) => (
                                <div key={loop.id || i} className="flex flex-col gap-1.5 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={loop.url}
                                      onChange={e => updateVideoLoopUrl(section.id, i, e.target.value)}
                                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:border-orange-500"
                                      placeholder="/splash.mp4"
                                    />
                                    <label className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 text-slate-700 dark:text-slate-200 shrink-0">
                                      <Play size={10} />
                                      <span>Upload</span>
                                      <input
                                        type="file"
                                        accept="video/*"
                                        onChange={e => handleFileUpload(e, (url) => updateVideoLoopUrl(section.id, i, url))}
                                        className="hidden"
                                      />
                                    </label>
                                    <button 
                                      onClick={() => deleteVideoLoop(section.id, i)}
                                      disabled={(section.videoLoops || [{ url: section.videoUrl || '/splash.mp4', id: 'default' }]).length <= 1}
                                      className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors shrink-0"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Image slides (if slider) */}
                          {section.type === 'slider' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Hero Slides ({(section.slides || []).length})</label>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openAddSlide(section.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-[10px] uppercase transition-all"
                                  >
                                    <Plus size={11} /> Add Slide
                                  </button>
                                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase transition-all cursor-pointer">
                                    <Plus size={11} /> Upload Multiple
                                    <input
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      onChange={e => handleMultipleImageUpload(e, section.id)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                              {(section.slides || []).map((slide, i) => (
                                <div key={slide.id || i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                  {slide.image && (
                                    <img src={slide.image} alt={slide.title} className="w-12 h-10 object-cover rounded-lg shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{slide.title}</p>
                                    {slide.desc && <p className="text-[10px] text-slate-400 truncate">{slide.desc}</p>}
                                  </div>
                                  <button onClick={() => openEditSlide(section.id, i)} className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors">
                                    <Edit size={12} />
                                  </button>
                                  <button onClick={() => deleteSlide(section.id, i)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                              {(section.slides || []).length === 0 && (
                                <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                                  <p className="text-[10px] font-bold text-slate-400">No slides yet — click "Add Slide" above</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trending Section Editor */}
                      {section.id === 'trending' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Section Title</label>
                            <input
                              type="text"
                              value={section.title ?? ''}
                              placeholder="Trending Deals"
                              onChange={e => updateSection(section.id, { title: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Badge Text (e.g. HOT 🔥)</label>
                            <input
                              type="text"
                              value={section.badgeText ?? ''}
                              placeholder="HOT 🔥"
                              onChange={e => updateSection(section.id, { badgeText: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Layout Style</label>
                            <div className="flex gap-2">
                              {['carousel', 'horizontal-scroll', 'grid'].map(l => (
                                <button
                                  key={l}
                                  type="button"
                                  onClick={() => updateSection(section.id, { layout: l })}
                                  className={`flex-1 py-2 font-bold text-[10px] uppercase tracking-wide rounded-xl border transition-all ${
                                    section.layout === l
                                      ? 'bg-orange-500 border-orange-500 text-white'
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                                  }`}
                                >
                                  {l.replace('-', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Deals Filter Source</label>
                            <div className="flex gap-2">
                              {[
                                { value: 'popular', label: 'Popular Flag' },
                                { value: 'discount', label: 'Discount/Promo' },
                                { value: 'all', label: 'All Items' }
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => updateSection(section.id, { filterSource: opt.value })}
                                  className={`flex-1 py-2 font-bold text-[10px] uppercase tracking-wide rounded-xl border transition-all ${
                                    (section.filterSource ?? 'popular') === opt.value
                                      ? 'bg-orange-500 border-orange-500 text-white'
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Max Deals to Display</label>
                            <input
                              type="number"
                              value={section.displayLimit ?? 6}
                              placeholder="6"
                              min="1"
                              max="30"
                              onChange={e => updateSection(section.id, { displayLimit: parseInt(e.target.value) || 6 })}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Flash Sale Timer</span>
                              <button
                                type="button"
                                onClick={() => updateSection(section.id, { showTimer: !(section.showTimer ?? true) })}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  (section.showTimer ?? true) ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  (section.showTimer ?? true) ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                            {(section.showTimer ?? true) && (
                              <div>
                                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Timer Cycle (Minutes)</label>
                                <input
                                  type="number"
                                  value={section.timerDurationMinutes ?? 10}
                                  placeholder="10"
                                  min="1"
                                  onChange={e => updateSection(section.id, { timerDurationMinutes: parseInt(e.target.value) || 10 })}
                                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                       {/* Categories Section Editor */}
                      {section.id === 'categories' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Category Layout Mode</label>
                            <div className="flex gap-2">
                              {[
                                { value: 'grid', label: 'Wrapping Grid' },
                                { value: 'scroll', label: 'Single Row Scroll' },
                                { value: 'two-row', label: 'Two Row Scroll' }
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateSection(section.id, { layout: opt.value })}
                                  className={`flex-1 py-2 font-bold text-[10px] uppercase tracking-wide rounded-xl border transition-all ${
                                    (section.layout || 'grid') === opt.value
                                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-550 hover:text-slate-850'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Category Items ({categories.length})</label>
                            <button
                              onClick={openAddCategory}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-[10px] uppercase transition-all"
                            >
                              <Plus size={11} /> Add Category
                            </button>
                          </div>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {localCategories.map((cat, idx) => (
                              <div
                                key={cat.id}
                                draggable
                                onDragStart={() => handleCatDragStart(idx)}
                                onDragEnter={() => handleCatDragEnter(idx)}
                                onDragEnd={handleCatDragEnd}
                                onDragOver={e => e.preventDefault()}
                                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
                                style={{ userSelect: 'none' }}
                              >
                                {/* Drag Handle */}
                                <span className="text-slate-300 dark:text-slate-600 shrink-0">
                                  <GripVertical size={14} />
                                </span>

                                {/* Icon / Image preview */}
                                <span 
                                  className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm overflow-hidden shrink-0"
                                  style={{ backgroundColor: getPastelColor(cat.id, idx) }}
                                >
                                  {cat.image ? (
                                    <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-lg" style={{ color: '#1A1A1A' }}>{cat.icon || '🍔'}</span>
                                  )}
                                </span>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">{cat.label}</h4>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID: {cat.id}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEditCategory(cat)} className="p-1.5 text-slate-400 hover:text-orange-500 transition-colors">
                                    <Edit size={12} />
                                  </button>
                                  <button onClick={() => deleteCategoryBuilder(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dishes Grid Editor */}
                      {section.id === 'dishes' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Section Title</label>
                            <input
                              type="text"
                              value={section.title ?? ''}
                              placeholder="All Dishes"
                              onChange={e => updateSection(section.id, { title: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 pl-1">Default View Mode</label>
                            <div className="flex gap-2">
                              {[
                                { value: 'classic', label: 'Classic List', icon: AlignJustify },
                                { value: 'grid', label: 'Grid View', icon: Grid }
                              ].map(({ value, label, icon: BtnIcon }) => (
                                <button
                                  key={value}
                                  onClick={() => updateSection(section.id, { defaultView: value })}
                                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold text-[10px] rounded-xl border transition-all ${
                                    section.defaultView === value
                                      ? 'bg-orange-500 border-orange-500 text-white'
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                                  }`}
                                >
                                  <BtnIcon size={12} />
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Animation Settings */}
        <div ref={animationsRef} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Sliders size={16} className="text-orange-500" />
              <span>PWA Transition Animations</span>
            </h3>
            <button
              type="button"
              onClick={triggerPreview}
              className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-orange-600 dark:text-orange-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              <Play size={10} fill="currentColor" />
              Play Preview
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 gap-1">
            {ANIMATION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedAnimationCategory(cat.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  selectedAnimationCategory === cat.id
                    ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold italic pl-1">
            {ANIMATION_CATEGORIES.find(c => c.id === selectedAnimationCategory)?.description}
          </p>

          {/* Grid of Animations */}
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 pb-1 custom-scrollbar">
            {TRANSITION_ANIMATIONS.filter(a => a.category === selectedAnimationCategory).map(anim => {
              const isSelected = String(animations.mode).toLowerCase() === anim.id;
              return (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => {
                    setAnimations(prev => ({ ...prev, mode: anim.id }));
                    setIsDirty(true);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="text-xs shrink-0">{anim.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black truncate">{anim.label}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Easing & Physics Customizer */}
          <div className="pt-2 border-t border-slate-150 dark:border-slate-750 space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 pl-1">Physics & Easing Mode</label>
              <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-150 dark:border-slate-750">
                {[
                  { id: 'default', label: 'Preset Defaults' },
                  { id: 'spring', label: 'Custom Spring' },
                  { id: 'tween', label: 'Custom Tween' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setAnimations(prev => ({ ...prev, type: mode.id }));
                      setIsDirty(true);
                    }}
                    className={`flex-1 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                      (animations.type || 'default') === mode.id
                        ? 'bg-white dark:bg-slate-800 text-orange-500 shadow-sm border border-slate-100 dark:border-slate-700'
                        : 'text-slate-450 hover:text-slate-700 dark:hover:text-slate-350 border border-transparent'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Spring Sliders */}
            {animations.type === 'spring' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-750">
                <div>
                  <div className="flex justify-between items-baseline mb-1 pl-1 text-[9px] font-black text-slate-400 uppercase">
                    <span>Stiffness</span>
                    <span className="font-mono text-slate-750 dark:text-slate-200 font-extrabold">{animations.stiffness ?? 320}</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={1000}
                    step={10}
                    value={animations.stiffness ?? 320}
                    onChange={e => {
                      setAnimations(prev => ({ ...prev, stiffness: Number(e.target.value) }));
                      setIsDirty(true);
                    }}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1 pl-1 text-[9px] font-black text-slate-400 uppercase">
                    <span>Damping</span>
                    <span className="font-mono text-slate-750 dark:text-slate-200 font-extrabold">{animations.damping ?? 30}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={animations.damping ?? 30}
                    onChange={e => {
                      setAnimations(prev => ({ ...prev, damping: Number(e.target.value) }));
                      setIsDirty(true);
                    }}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-1 pl-1 text-[9px] font-black text-slate-400 uppercase">
                    <span>Mass</span>
                    <span className="font-mono text-slate-750 dark:text-slate-200 font-extrabold">{animations.mass ?? 1}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={animations.mass ?? 1}
                    onChange={e => {
                      setAnimations(prev => ({ ...prev, mass: Number(e.target.value) }));
                      setIsDirty(true);
                    }}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Custom Tween Easings */}
            {animations.type === 'tween' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-750">
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 pl-1">Easing Function</label>
                <select
                  value={animations.ease || 'easeInOut'}
                  onChange={e => {
                    setAnimations(prev => ({ ...prev, ease: e.target.value }));
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 text-slate-750 dark:text-slate-350"
                >
                  {[
                    'easeInOut', 'easeIn', 'easeOut', 'linear', 
                    'circIn', 'circOut', 'circInOut', 
                    'backIn', 'backOut', 'backInOut', 
                    'anticipate'
                  ].map(easeName => (
                    <option key={easeName} value={easeName}>{easeName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1 pl-1 text-[10px] font-black text-slate-400 uppercase">
              <span>Transition Duration</span>
              <span className="font-mono text-slate-800 dark:text-white font-extrabold">{animations.duration}s</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={1.5}
              step={0.05}
              value={animations.duration}
              onChange={e => {
                setAnimations(prev => ({ ...prev, duration: Number(e.target.value) }));
                setIsDirty(true);
              }}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </div>

      {/* ── Publish Button ──────────────────────────────────────────────────────── */}
        <button
          onClick={() => setPasscodeOpen(true)}
          disabled={isSaving}
          className={`w-full py-4 disabled:opacity-60 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all ${
            isDirty
              ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20 animate-pulse'
              : 'bg-slate-400 hover:bg-slate-500 shadow-slate-400/20'
          }`}
        >
          <Save size={18} />
          <span>{isSaving ? 'Publishing...' : isDirty ? 'Publish Layout Changes ●' : 'Layout Up To Date'}</span>
        </button>
      </div>

      {/* ── Right: Live Preview ────────────────────────────────────────────────── */}
      <div className="relative">
        <div className={`xl:sticky space-y-6 transition-all duration-700 ease-in-out ${
          showAnimationsPreview 
            ? 'xl:top-[160px] xl:translate-y-[80px] xl:scale-[0.98]' 
            : 'xl:top-6 xl:translate-y-0 xl:scale-100'
        }`}>

        {/* Phone Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Smartphone size={16} className="text-orange-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Live Preview</h3>
          </div>
          <div className="flex justify-center">
            <PhoneMockup
              sections={sections}
              announcement={sections.find(s => s.id === 'announcement')}
              animations={animations}
              activePreviewScreen={activePreviewScreen}
              categories={categories}
            />
          </div>
          <p className="text-center text-[10px] text-slate-400 font-bold mt-4">Preview updates as you reorder sections</p>
        </div>

        {/* Section visibility summary */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-3">
          <h3 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Section Visibility</h3>
          {sortedSections.map(section => {
            const Icon = SECTION_ICONS[section.id] || Layers;
            const colorClass = SECTION_COLORS[section.id] || 'text-slate-500';
            return (
              <div key={section.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={13} className={colorClass} />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{section.label}</span>
                </div>
                <button
                  onClick={() => toggleVisibility(section.id)}
                  className={`w-9 h-5 rounded-full transition-all duration-200 relative flex items-center ${section.visible ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-200 ${section.visible ? 'left-4.5 left-[calc(100%-16px)]' : 'left-0.5'}`} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700 p-5 space-y-3">
          <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Layout Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700">
              <div className="text-xl font-black text-green-600">{sortedSections.filter(s => s.visible).length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Visible</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700">
              <div className="text-xl font-black text-slate-400">{sortedSections.filter(s => !s.visible).length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Hidden</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 col-span-2">
              <div className="text-lg font-black text-orange-500">{animations.mode} · {animations.duration}s</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Active Animation Mode</div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ── Slide Form Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSlideFormOpen && (
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
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-md p-6 relative"
            >
              <button
                onClick={() => setIsSlideFormOpen(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
              <h3 className="font-black text-lg text-slate-800 dark:text-white mb-5">
                {editingSlideIdx !== null ? 'Edit Slide' : 'Add New Slide'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Slide Title</label>
                  <input
                    type="text"
                    value={slideForm.title}
                    onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500"
                    placeholder="e.g. Delicious Rice Bowls"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Sub-text / Description</label>
                  <input
                    type="text"
                    value={slideForm.desc}
                    onChange={e => setSlideForm(p => ({ ...p, desc: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500"
                    placeholder="e.g. Starting from ₦3,500 only!"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Image URL / Banner</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slideForm.image}
                      onChange={e => setSlideForm(p => ({ ...p, image: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      placeholder="https://images.unsplash.com/..."
                      required
                    />
                    <label className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center shrink-0">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setSlideForm(p => ({ ...p, image: url })))}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                {slideForm.image && (
                  <div className="h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                     <img src={slideForm.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSlideFormOpen(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase transition-all text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveSlide(isSlideFormOpen)}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-sm"
                  >
                    {editingSlideIdx !== null ? 'Update Slide' : 'Add Slide'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Form Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCatFormOpen && (
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
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl w-full max-w-md p-6 relative"
            >
              <button
                onClick={() => setIsCatFormOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
              <h3 className="font-black text-lg text-slate-800 dark:text-white mb-5">
                {editingCatId ? 'Edit Category' : 'Add New Category'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Category Code / Slug</label>
                  <input
                    type="text"
                    disabled={!!editingCatId}
                    value={catForm.id}
                    onChange={e => setCatForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500 disabled:opacity-50"
                    placeholder="e.g. rice"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Display Label</label>
                  <input
                    type="text"
                    value={catForm.label}
                    onChange={e => setCatForm(p => ({ ...p, label: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500"
                     placeholder="e.g. Rice Bowls"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={catForm.icon}
                    onChange={e => setCatForm(p => ({ ...p, icon: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:outline-none focus:border-orange-500"
                    placeholder="e.g. 🍔"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 pl-1">Custom Image URL / Icon</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={catForm.image}
                      onChange={e => setCatForm(p => ({ ...p, image: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                      placeholder="Paste image URL or upload..."
                    />
                    <label className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-2xl cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center shrink-0">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleFileUpload(e, (url) => setCatForm(p => ({ ...p, image: url })))}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                {catForm.image && (
                  <div className="h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={catForm.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCatFormOpen(false)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-2xl font-black text-xs uppercase transition-all text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveCategoryBuilder}
                    disabled={isUploading}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase transition-all shadow-sm"
                  >
                    {isUploading ? 'Uploading...' : editingCatId ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Passcode Modal ────────────────────────────────────────────────────── */}
      <PasscodeModal
        isOpen={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onVerified={handleVerifiedSave}
        actionName="Publish Page Layout"
      />
    </div>
  );
};

export default PageBuilder;
