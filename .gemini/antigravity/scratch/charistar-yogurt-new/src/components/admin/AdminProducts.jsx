import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit2, Copy, Image as ImageIcon, Loader2, Sparkles, Upload, X, FolderEdit, ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDoc, collection, deleteDoc, doc, updateDoc, getDocs, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';

// Local helper to compress image files before upload
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL (highly compressed JPEG)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

        // Convert to blob for Storage upload
        canvas.toBlob((blob) => {
          resolve({ blob: blob || file, dataUrl });
        }, 'image/jpeg', 0.7);
      };
      img.onerror = () => {
        resolve({ blob: file, dataUrl: event.target.result });
      };
    };
    reader.onerror = () => {
      resolve({ blob: file, dataUrl: null });
    };
  });
};

export default function AdminProducts({ products, setProducts }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Dynamic categories management
  const [categories, setCategories] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? Number(a.sortOrder) : 9999;
        const orderB = b.sortOrder !== undefined ? Number(b.sortOrder) : 9999;
        return orderA - orderB;
      });
      setCategories(fetched);
    }, (err) => {
      console.error("Error fetching categories:", err);
    });
    return () => unsub();
  }, []);

  const defaultCategories = ['Parfait', 'Yogurt', 'Drinks', 'Smoothie'];
  const displayCategories = categories.length > 0 ? categories.map(c => c.name) : defaultCategories;
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = add new, obj = edit

  // Form State - every single bit of details
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState(''); // Long description
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('Parfait');
  const [customCategory, setCustomCategory] = useState(''); // Custom write-in
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fats, setFats] = useState('');
  const [carbo, setCarbo] = useState('');
  const [rating, setRating] = useState('4.8');
  const [active, setActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Drag and drop state
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState(null);

  const [displayStyle, setDisplayStyle] = useState('Standard');

  // Add-ons configuration states
  const [addons, setAddons] = useState([]);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');

  const sortedProducts = [...products].sort((a, b) => {
    const orderA = a.sortOrder !== undefined ? Number(a.sortOrder) : 9999;
    const orderB = b.sortOrder !== undefined ? Number(b.sortOrder) : 9999;
    return orderA - orderB;
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);

    try {
      // Compress the image locally first!
      const { blob, dataUrl } = await compressImage(file);

      // 2.5s Timeout Promise for Firebase Storage upload to prevent hanging
      const storageUpload = (async () => {
        const fileRef = ref(storage, `products/${Date.now()}_compressed.jpg`);
        await uploadBytes(fileRef, blob);
        return await getDownloadURL(fileRef);
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage upload timed out")), 2500)
      );

      try {
        const url = await Promise.race([storageUpload, timeoutPromise]);
        setImage(url);
        setSuccess('Image uploaded to cloud! 📸');
        setTimeout(() => setSuccess(''), 3000);
        setUploadingImage(false);
      } catch (err) {
        console.warn("Firebase Storage failed or timed out, trying Base64 fallback:", err);
        if (dataUrl) {
          setImage(dataUrl);
          setSuccess('Image loaded via Base64 fallback! 📸');
          setTimeout(() => setSuccess(''), 3000);
        } else {
          alert('Failed to process image file.');
        }
        setUploadingImage(false);
      }
    } catch (compressErr) {
      console.error("Compression error:", compressErr);
      setUploadingImage(false);
      alert('Failed to process image.');
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setSubtitle('');
    setDescription('');
    setPrice('');
    setImage('');
    setCategory('Parfait');
    setCustomCategory('');
    setKcal('');
    setProtein('');
    setFats('');
    setCarbo('');
    setRating('4.8');
    setActive(true);
    setDisplayStyle('Standard');
    setAddons([]);
    setNewAddonName('');
    setNewAddonPrice('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setTitle(product.title || '');
    setSubtitle(product.subtitle || '');
    setDescription(product.description || '');
    setPrice(product.price || '');
    setImage(product.image || product.img || '');
    
    // Check if category is standard
    const isStandardCategory = ['Parfait', 'Yogurt', 'Smoothie', 'Drinks'].includes(product.category);
    if (isStandardCategory) {
      setCategory(product.category || 'Parfait');
      setCustomCategory('');
    } else {
      setCategory('Custom...');
      setCustomCategory(product.category || '');
    }

    setKcal(product.nutrition?.kcal !== undefined ? String(product.nutrition.kcal) : '');
    setProtein(product.nutrition?.protein !== undefined ? String(product.nutrition.protein) : '');
    setFats(product.nutrition?.fats !== undefined ? String(product.nutrition.fats) : '');
    setCarbo(product.nutrition?.carbo !== undefined ? String(product.nutrition.carbo) : '');
    setRating(product.rating !== undefined ? String(product.rating) : '4.8');
    setActive(product.active !== false); // default to true
    setDisplayStyle(product.displayStyle || 'Standard');
    setAddons(product.addons || []);
    setNewAddonName('');
    setNewAddonPrice('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const safeFloat = (val, fallback = 0) => {
      if (val === undefined || val === null || String(val).trim() === '') return fallback;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? fallback : parsed;
    };

    // Prevent massive Base64 payloads from hanging Firestore writes (limit to 150KB)
    if (image && image.startsWith('data:image') && image.length > 150 * 1024) {
      alert("⚠️ Image file is too large to save in the database directly. Please choose a smaller image file (under 100KB), or paste a direct image URL link in the box below instead.");
      return;
    }

    const finalCategory = category === 'Custom...' ? customCategory : category;

    const formattedPrice = price.trim().startsWith('₦') ? price.trim() : `₦${price.trim()}`;

    const payload = {
      title,
      subtitle,
      description,
      price: formattedPrice,
      image,
      category: finalCategory || 'Parfait',
      active,
      displayStyle,
      rating: safeFloat(rating, 4.8),
      addons,
      nutrition: {
        kcal: safeFloat(kcal, 0),
        protein: safeFloat(protein, 0),
        fats: safeFloat(fats, 0),
        carbo: safeFloat(carbo, 0)
      }
    };

    // Close modal instantly to provide immediate, ultra-responsive tactile feedback
    setIsModalOpen(false);

    // Save product asynchronously in the background
    (async () => {
      try {
        if (editingProduct) {
          const safeProductId = String(editingProduct.id);
          await setDoc(doc(db, 'products', safeProductId), payload, { merge: true });
          setSuccess('Product updated successfully!');
        } else {
          await addDoc(collection(db, 'products'), { ...payload, liked: false });
          setSuccess('Product added successfully!');
        }
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error("Background Save Product Exception:", err);
        alert('Error saving product in background: ' + err.message);
      }
    })();
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', String(productId)));
      } catch (err) {
        console.error(err);
        alert('Failed to delete product');
      }
    }
  };

  const handleDuplicate = async (product) => {
    try {
      const payload = {
        title: `${product.title} (Copy)`,
        subtitle: product.subtitle || '',
        description: product.description || '',
        price: product.price || '',
        image: product.image || product.img || '',
        category: product.category || 'Parfait',
        active: product.active !== false,
        displayStyle: product.displayStyle || 'Standard',
        rating: product.rating || 4.8,
        addons: product.addons || [],
        nutrition: product.nutrition || { kcal: 0, protein: 0, fats: 0, carbo: 0 }
      };

      await addDoc(collection(db, 'products'), { ...payload, liked: false });
      setSuccess('Product duplicated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Duplicate Product Exception:", err);
      alert('Failed to duplicate product: ' + err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const name = newCategoryName.trim();
      const catId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'categories', catId), { name, sortOrder: categories.length });
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

  const handleAddAddon = (e) => {
    e.preventDefault();
    if (!newAddonName.trim() || !newAddonPrice.trim()) return;

    const formattedAddonPrice = newAddonPrice.trim().startsWith('₦') 
      ? newAddonPrice.trim() 
      : `₦${newAddonPrice.trim()}`;

    setAddons(prev => [
      ...prev,
      {
        name: newAddonName.trim(),
        price: formattedAddonPrice
      }
    ]);
    setNewAddonName('');
    setNewAddonPrice('');
  };

  const handleDeleteAddon = (index) => {
    setAddons(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (e, index) => {
    setDraggedCategoryIndex(index);
    setTimeout(() => { if(e.target) e.target.style.opacity = '0.5'; }, 0);
  };

  const handleDragEnd = (e) => {
    if(e.target) e.target.style.opacity = '1';
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;
    setDragOverCategoryIndex(index);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === targetIndex) {
      setDragOverCategoryIndex(null);
      return;
    }

    const reordered = [...categories];
    const draggedItem = reordered[draggedCategoryIndex];
    reordered.splice(draggedCategoryIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    const updatedWithOrder = reordered.map((cat, i) => ({...cat, sortOrder: i}));
    
    // Optimistic update
    setCategories(updatedWithOrder);
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);

    try {
      const batchPromises = updatedWithOrder.map((cat) => {
        return updateDoc(doc(db, 'categories', cat.id), { sortOrder: cat.sortOrder });
      });
      await Promise.all(batchPromises);
      setSuccess('Categories rearranged! ✅');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setSuccess('⚠️ Failed to reorder categories. Please try again.');
      setTimeout(() => setSuccess(''), 4000);
      console.error(err);
    }
  };

  const handleMoveCategory = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const reordered = [...categories];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    try {
      const batchPromises = reordered.map((cat, i) => {
        if (cat.sortOrder !== i) {
          return updateDoc(doc(db, 'categories', cat.id), { sortOrder: i });
        }
        return null;
      }).filter(Boolean);

      if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
      }
    } catch (err) {
      console.error("Failed to reorder categories:", err);
      alert("Error reordering categories: " + err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedProducts.length) return;

    const reordered = [...sortedProducts];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    try {
      const batchPromises = reordered.map((prod, i) => {
        if (prod.sortOrder !== i) {
          return updateDoc(doc(db, 'products', prod.id), { sortOrder: i });
        }
        return null;
      }).filter(Boolean);

      if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
      }
    } catch (err) {
      console.error("Failed to reorder products:", err);
      alert("Error reordering products: " + err.message);
    }
  };

  const IMAGE_BANK = [
    'https://images.unsplash.com/photo-1488477304112-49658c47eefb?w=600&q=80', // parfait layers
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80', // yogurt bowl
    'https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=600&q=80', // smoothie bowl
    'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=600&q=80', // mango yogurt
    'https://images.unsplash.com/photo-1584314918532-841da3671a74?w=600&q=80', // plain greek
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80', // green smoothie
    'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80', // berry parfait
    'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=600&q=80', // fruit yogurt
    'https://images.unsplash.com/photo-1624939614319-4a6e4c62ca74?w=600&q=80', // creamy parfait
    'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=600&q=80', // granola bowl
  ];

  const pickImage = (product, index) => {
    const name = (product.title || product.name || '').toLowerCase();
    const cat  = (product.category || '').toLowerCase();
    if (name.includes('fura') || name.includes('nono'))        return IMAGE_BANK[1];
    if (name.includes('zobo') || name.includes('berry'))       return IMAGE_BANK[0];
    if (name.includes('tigernut') || name.includes('coconut')) return IMAGE_BANK[2];
    if (name.includes('mango') || name.includes('pineapple'))  return IMAGE_BANK[3];
    if (name.includes('plain') || name.includes('greek'))      return IMAGE_BANK[4];
    if (name.includes('moringa') || name.includes('green'))    return IMAGE_BANK[5];
    if (name.includes('berry') || name.includes('straw'))      return IMAGE_BANK[6];
    if (cat.includes('smoothie'))                               return IMAGE_BANK[5];
    if (cat.includes('drinks'))                                 return IMAGE_BANK[7];
    return IMAGE_BANK[index % IMAGE_BANK.length];
  };

  const handleFixProducts = async () => {
    if (!window.confirm('This will activate ALL products, add smart images to missing ones, and sanitize legacy oversized images. Continue?')) return;
    setLoading(true);
    setSuccess('');
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const updates = [];
      let idx = 0;
      let sanitizedCount = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const patch = { active: true };
        
        // 1. Check if image is missing or empty
        const currentImg = data.image || data.img || '';
        if (!currentImg) {
          patch.image = pickImage(data, idx);
        } 
        // 2. Check if image is a massive Base64 string (>100KB)
        else if (currentImg.startsWith('data:image/') && currentImg.length > 100000) {
          console.log(`Sanitizing oversized Base64 image in product: ${data.title}`);
          patch.image = pickImage(data, idx);
          sanitizedCount++;
        }
        
        updates.push(updateDoc(doc(db, 'products', docSnap.id), patch));
        idx++;
      });
      await Promise.all(updates);
      setSuccess(`✅ ${updates.length} products activated! Sanity-cleaned ${sanitizedCount} oversized images.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to fix products: ' + err.message);
    }
    setLoading(false);
  };

  const handleWipeCatalog = async () => {
    if (!window.confirm('🚨 WARNING: This will permanently DELETE ALL PRODUCTS from the cloud database. You will have to upload your own or click "Seed Demo". Continue?')) return;
    setLoading(true);
    setSuccess('');
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'products', d.id))));
      setSuccess('🧹 All products wiped successfully! Your catalog is now completely empty.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to wipe products: ' + err.message);
    }
    setLoading(false);
  };

  const DEMO_PRODUCTS = [
    {
      title: 'Classic Berry Parfait',
      subtitle: 'Layers of yogurt, berries & crunchy granola',
      description: 'Our signature parfait — thick Greek yogurt layered with fresh mixed berries, local granola, and a drizzle of wildflower honey. A timeless crowd-pleaser.',
      price: '₦3,500',
      category: 'Parfait',
      image: 'https://images.unsplash.com/photo-1488477304112-49658c47eefb?w=600&q=80',
      rating: 4.9, liked: false, active: true,
      nutrition: { kcal: 220, protein: 14, fats: 7, carbo: 30 },
    },
    {
      title: 'Fura da Nono Blend',
      subtitle: 'Traditional millet & creamy Greek yogurt',
      description: 'A luxurious modern take on the classic northern Nigerian Fura da Nono. Premium thick yogurt meets perfectly spiced millet dough for a culturally rich experience.',
      price: '₦3,800',
      category: 'Yogurt',
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&q=80',
      rating: 4.8, liked: true, active: true,
      nutrition: { kcal: 240, protein: 18, fats: 10, carbo: 32 },
    },
    {
      title: 'Zobo Berry Bliss',
      subtitle: 'Hibiscus-infused yogurt with fresh fruits',
      description: 'Rich Greek yogurt infused with our signature Zobo reduction, giving it a vibrant ruby hue and tart flavor. Layered with strawberries, blueberries, and granola.',
      price: '₦4,200',
      category: 'Parfait',
      image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&q=80',
      rating: 4.9, liked: false, active: true,
      nutrition: { kcal: 198, protein: 15, fats: 8, carbo: 28 },
    },
    {
      title: 'Tigernut Coconut Dream',
      subtitle: 'Kunu Aya blended with coconut milk',
      description: 'A creamy dairy-free inspired option featuring local Tigernuts and fresh coconut milk blended into a smooth yogurt base. Naturally sweet, earthy, and incredibly refreshing.',
      price: '₦4,000',
      category: 'Yogurt',
      image: 'https://images.unsplash.com/photo-1563805042-7684c8e9e533?w=600&q=80',
      rating: 4.7, liked: true, active: true,
      nutrition: { kcal: 210, protein: 12, fats: 14, carbo: 22 },
    },
    {
      title: 'Mango Sunrise Parfait',
      subtitle: 'Tropical mango & pineapple yogurt layers',
      description: 'A burst of sunshine in a cup. Thick yogurt with fresh Ogbomosho mangoes and tangy pineapple chunks. Topped with coconut flakes and honey. Perfect for a hot afternoon.',
      price: '₦4,500',
      category: 'Parfait',
      image: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=600&q=80',
      rating: 4.8, liked: false, active: true,
      nutrition: { kcal: 185, protein: 14, fats: 5, carbo: 30 },
    },
    {
      title: 'Moringa Power Bowl',
      subtitle: 'Detox yogurt with fresh moringa & ginger',
      description: 'A powerhouse of nutrition. Our yogurt blended with fresh Moringa leaves, ginger, and sweet apple. A detoxifying, energy-boosting super-bowl that tastes incredible.',
      price: '₦3,700',
      category: 'Smoothie',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
      rating: 4.8, liked: true, active: true,
      nutrition: { kcal: 175, protein: 16, fats: 7, carbo: 20 },
    },
  ];

  const handleSeedDemo = async () => {
    if (!window.confirm('⚠️ This will DELETE all existing products and replace them with 10 fresh demo products. Continue?')) return;
    setLoading(true);
    setSuccess('');
    try {
      // Step 1: Delete all existing products
      const snapshot = await getDocs(collection(db, 'products'));
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'products', d.id))));

      // Step 2: Add all demo products
      await Promise.all(
        DEMO_PRODUCTS.map(p => addDoc(collection(db, 'products'), p))
      );

      // Step 3: Success message
      setSuccess(`🎉 Replaced with ${DEMO_PRODUCTS.length} fresh demo products!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to seed demo products: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {success && (
        <div className="bg-charistar-green/20 text-charistar-green px-4 py-3 rounded-2xl border border-charistar-green/30 font-bold text-center text-sm animate-pulse">
          {success}
        </div>
      )}

      {/* Header Controls */}
      <div className="flex justify-between items-center flex-wrap gap-6 bg-[#050505]/40 p-6 rounded-[1.5rem] border border-white/5 mb-2">
        <h2 className="text-white font-black text-xl">Catalog ({products.length})</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleSeedDemo}
            disabled={loading}
            className="bg-purple-500/20 text-purple-300 font-black uppercase tracking-wider text-xs px-6 py-4 rounded-xl flex items-center gap-2 hover:bg-purple-500/30 active:scale-95 transition-all shadow-sm border border-purple-500/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            Seed Demo
          </button>
          <button 
            onClick={handleWipeCatalog}
            disabled={loading}
            className="bg-red-500/20 text-red-300 font-black uppercase tracking-wider text-xs px-6 py-4 rounded-xl flex items-center gap-2 hover:bg-red-500/30 active:scale-95 transition-all shadow-sm border border-red-500/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            Wipe Catalog
          </button>
          <button 
            onClick={handleFixProducts}
            disabled={loading}
            className="bg-white/10 text-white font-black uppercase tracking-wider text-xs px-6 py-4 rounded-xl flex items-center gap-2 hover:bg-white/20 active:scale-95 transition-all shadow-sm border border-white/10 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
            Auto-Fix
          </button>
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white/10 text-white font-black uppercase tracking-wider text-xs px-6 py-4 rounded-xl flex items-center gap-2 hover:bg-white/20 active:scale-95 transition-all shadow-sm border border-white/10"
          >
            <FolderEdit size={16} />
            Categories
          </button>
          <button 
            onClick={openAddModal}
            className="bg-charistar-green text-black font-black uppercase tracking-wider text-xs px-8 py-4 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProducts.map((product, index) => (
          <div key={product.id} className={`glass-panel p-5.5 rounded-[1.5rem] border border-white/10 flex flex-col group transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.5)] ${product.active === false ? 'opacity-40 border-red-500/20 bg-red-500/5' : 'bg-[#0c0c0c]/85 hover:bg-[#121212]/95 hover:border-charistar-green/20'}`}>
            <div className="w-full aspect-square rounded-[1.2rem] bg-white/5 relative mb-5 overflow-hidden border border-white/5">
              <img src={product.image || product.img} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              
              {/* Reordering Controls */}
              <div className="absolute top-3 left-3 flex gap-1 z-10 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  disabled={index === 0}
                  onClick={(e) => { e.stopPropagation(); handleMove(index, 'left'); }}
                  className="w-7.5 h-7.5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-charistar-green hover:bg-white/10 transition-all active:scale-90 disabled:opacity-30 disabled:hover:text-white disabled:hover:bg-transparent"
                  title="Move Left"
                >
                  <ArrowLeft size={11} />
                </button>
                <button 
                  disabled={index === sortedProducts.length - 1}
                  onClick={(e) => { e.stopPropagation(); handleMove(index, 'right'); }}
                  className="w-7.5 h-7.5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-charistar-green hover:bg-white/10 transition-all active:scale-90 disabled:opacity-30 disabled:hover:text-white disabled:hover:bg-transparent"
                  title="Move Right"
                >
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="absolute top-3 right-3 flex gap-1.5 z-10 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/5">
                <button onClick={() => openEditModal(product)} className="w-8.5 h-8.5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-sky-400 hover:bg-white/10 transition-all active:scale-90" title="Edit Product">
                  <Edit2 size={12} />
                </button>
                <button onClick={() => handleDuplicate(product)} className="w-8.5 h-8.5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-charistar-green hover:bg-white/10 transition-all active:scale-90" title="Duplicate Product">
                  <Copy size={12} />
                </button>
                <button onClick={() => handleDelete(product.id)} className="w-8.5 h-8.5 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-red-500 hover:bg-white/10 transition-all active:scale-90" title="Delete Product">
                  <Trash2 size={12} />
                </button>
              </div>
              
              {/* Active Badge */}
              <div className={`absolute bottom-2.5 left-2.5 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${product.active === false ? 'bg-red-500 text-white' : 'bg-charistar-green text-black'}`}>
                {product.active === false ? 'Inactive' : 'Active'}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between px-2 pb-1">
              <div>
                <h3 className="text-white text-[14px] font-black leading-snug break-words">{product.title}</h3>
                <p className="text-gray-400 text-[10px] font-extrabold mt-1.5 uppercase tracking-widest">{product.category || 'Parfait'}</p>
                {product.subtitle && (
                  <p className="text-gray-500 text-[11px] font-medium line-clamp-1 mt-1 leading-normal">{product.subtitle}</p>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5">
                <span className="text-charistar-green text-[14px] font-black">
                  {product.price ? (String(product.price).startsWith('₦') ? product.price : `₦${product.price}`) : '₦0'}
                </span>
                {product.rating && (
                  <span className="text-yellow-400 text-[11px] font-extrabold flex items-center gap-0.5">★ {product.rating}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
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
              className="relative w-full max-w-xl glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8.5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Close Icon Button */}
              <button 
                type="button"
                onClick={() => !loading && setIsModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                <X size={16} />
              </button>

              <h2 className="text-2xl font-black text-white mb-8 tracking-tight">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Switch for Active Status */}
                <div className="flex items-center justify-between bg-white/5 p-4.5 rounded-xl border border-white/5">
                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-wider">Product Status</h4>
                    <p className="text-gray-500 text-[10px] font-semibold mt-1">Deactivated products won't show in the menu.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={active}
                      onChange={e => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-charistar-green"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Title</label>
                    <input required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Price (e.g. ₦3,500)</label>
                    <input required value={price} onChange={e=>setPrice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Category</label>
                    <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none appearance-none cursor-pointer transition-all text-xs font-semibold">
                      {displayCategories.map(catOpt => (
                        <option key={catOpt} value={catOpt} className="bg-black">{catOpt}</option>
                      ))}
                      <option value="Custom..." className="bg-black">Custom Write-in...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Rating ({rating})</label>
                    <div className="flex items-center gap-3 pt-2">
                      <input 
                        type="range" 
                        min="1.0" 
                        max="5.0" 
                        step="0.1" 
                        value={rating} 
                        onChange={e => setRating(e.target.value)} 
                        className="flex-1 accent-charistar-green bg-white/10 rounded-lg h-2" 
                      />
                      <span className="text-white font-extrabold text-sm w-8 text-center">{rating}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Display Style</label>
                    <select value={displayStyle} onChange={e=>setDisplayStyle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none appearance-none cursor-pointer transition-all text-xs font-semibold">
                      <option value="Standard" className="bg-black">Standard Grid Card</option>
                      <option value="Featured" className="bg-black">Featured (Wide 2-col)</option>
                      <option value="Banner" className="bg-black">Banner (Full width)</option>
                      <option value="Compact List" className="bg-black">Compact List Row</option>
                      <option value="Highlight" className="bg-black">Highlight (Golden Border)</option>
                      <option value="Minimal" className="bg-black">Minimal (Text Only)</option>
                    </select>
                  </div>
                </div>

                {category === 'Custom...' && (
                  <div className="animate-fadeIn">
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Custom Category Name</label>
                    <input required placeholder="e.g. Dessert" value={customCategory} onChange={e=>setCustomCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" />
                  </div>
                )}

                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Short Subtitle / Tagline</label>
                  <input required value={subtitle} onChange={e=>setSubtitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold" />
                </div>

                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Long Rich Description</label>
                  <textarea rows="3" value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none transition-all text-xs font-semibold leading-relaxed" placeholder="Write a gorgeous description for the product details page..."></textarea>
                </div>

                {/* Nutrition Facts Grid */}
                <div>
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1">Nutrition Facts</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 text-center">Protein (g)</span>
                      <input type="number" step="any" placeholder="18.5" value={protein} onChange={e=>setProtein(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center text-white text-xs outline-none focus:border-charistar-green focus:bg-black/35 font-bold" />
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 text-center">Fats (g)</span>
                      <input type="number" step="any" placeholder="10.2" value={fats} onChange={e=>setFats(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center text-white text-xs outline-none focus:border-charistar-green focus:bg-black/35 font-bold" />
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 text-center">Carbs (g)</span>
                      <input type="number" step="any" placeholder="32.4" value={carbo} onChange={e=>setCarbo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center text-white text-xs outline-none focus:border-charistar-green focus:bg-black/35 font-bold" />
                    </div>
                  </div>
                </div>

                {/* Add-ons Configuration Panel */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-wider">Product Add-ons (Toppings / Upgrades)</h4>
                    <p className="text-gray-500 text-[10px] font-semibold mt-1">Configure optional toppings customers can select for an extra price.</p>
                  </div>

                  {/* Add-on Creator Inputs */}
                  <div className="flex gap-2.5 items-end">
                    <div className="flex-1">
                      <label className="block text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Topping Name</label>
                      <input 
                        type="text"
                        placeholder="e.g. Granola Toppings" 
                        value={newAddonName} 
                        onChange={e => setNewAddonName(e.target.value)} 
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-charistar-green text-xs font-semibold" 
                      />
                    </div>
                    <div className="w-[120px]">
                      <label className="block text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1.5 ml-1">Extra Price (₦)</label>
                      <input 
                        type="text"
                        placeholder="e.g. 800" 
                        value={newAddonPrice} 
                        onChange={e => setNewAddonPrice(e.target.value)} 
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-charistar-green text-xs font-semibold" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddAddon}
                      className="bg-charistar-green text-black font-black uppercase text-[10px] h-10.5 px-4.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center flex-shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  {/* Configured Add-ons List */}
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                    {addons.length === 0 ? (
                      <p className="text-gray-500 text-[10px] italic text-center py-2">No add-ons configured yet for this product.</p>
                    ) : (
                      addons.map((addon, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/40 px-3.5 py-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-charistar-green"></span>
                            <span className="text-white text-xs font-bold">{addon.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-charistar-green text-xs font-black">{addon.price}</span>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteAddon(index)}
                              className="text-[9px] font-black text-gray-400 hover:text-red-400 transition-colors uppercase tracking-wider"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Advanced Premium Image Selector */}
                <div className="space-y-3">
                  <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2.5 ml-1 flex items-center gap-2">
                    <ImageIcon size={14}/> Product Image
                  </label>
                  
                  {/* Image Preview / Drag Zone */}
                  <div className="relative w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-white/10 overflow-hidden flex flex-col items-center justify-center bg-black/40 group hover:border-charistar-green/45 transition-colors">
                    {image ? (
                      <>
                        <img src={image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity cursor-pointer">
                          <Upload size={20} className="text-white animate-bounce" />
                          <span className="text-[10px] text-white font-black uppercase tracking-wider">Replace Image</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2.5 relative">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="animate-spin text-charistar-green" size={28} />
                            <span className="text-[10px] text-charistar-green font-black uppercase tracking-wider animate-pulse">Uploading & Compressing...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-charistar-green/10 group-hover:text-charistar-green transition-all">
                              <Upload size={18} />
                            </div>
                            <div>
                              <p className="text-white text-xs font-black uppercase tracking-wider">Upload Product Image</p>
                              <p className="text-gray-500 text-[9px] font-bold mt-1 uppercase tracking-widest">JPG, PNG, WebP up to 5MB</p>
                            </div>
                          </>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={uploadingImage}
                          onChange={handleImageUpload} 
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>

                  {/* Backup Direct URL Input */}
                  <div>
                    <label className="block text-gray-600 text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1">Or Paste Direct Image URL</label>
                    <input 
                      type="text" 
                      placeholder="https://..." 
                      value={image} 
                      onChange={e=>setImage(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-charistar-green focus:bg-black/40 outline-none text-xs transition-all" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4.5 bg-white/5 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all font-black uppercase tracking-widest">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-4.5 bg-charistar-green text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#b3e600] transition-all shadow-sm disabled:opacity-50 font-black uppercase tracking-widest">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Save Product'}
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
              onClick={() => setIsCategoryModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel bg-[#090909] rounded-[1.8rem] border border-white/10 p-8 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Close Icon Button */}
              <button 
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
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
                />
                <button type="submit" className="bg-charistar-green text-black font-black uppercase text-[10px] px-5 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm">
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
                  categories.map((cat, index) => (
                    <div 
                      key={cat.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border ${dragOverCategoryIndex === index ? 'border-charistar-green bg-white/10 border-dashed' : 'border-white/5'} cursor-grab active:cursor-grabbing transition-colors`}
                    >
                      {editingCategory?.id === cat.id ? (
                        <form onSubmit={handleUpdateCategory} className="flex-1 flex gap-2">
                          <input 
                            required
                            value={editCategoryName}
                            onChange={e => setEditCategoryName(e.target.value)}
                            className="flex-1 bg-white/10 border border-charistar-green/30 rounded-lg px-3 py-1.5 text-white outline-none text-xs font-semibold"
                          />
                          <button type="submit" className="text-[10px] font-black text-charistar-green hover:underline">Save</button>
                          <button type="button" onClick={() => setEditingCategory(null)} className="text-[10px] font-black text-gray-500 hover:underline">Cancel</button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <GripVertical size={14} className="text-gray-500 cursor-grab" />
                            <span className="text-white text-xs font-bold">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleMoveCategory(index, 'up')}
                              disabled={index === 0}
                              className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-charistar-green hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:text-white disabled:hover:bg-transparent"
                              title="Move Up"
                            >
                              <ArrowLeft className="rotate-90" size={11} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleMoveCategory(index, 'down')}
                              disabled={index === categories.length - 1}
                              className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-charistar-green hover:bg-white/10 transition-all disabled:opacity-30 disabled:hover:text-white disabled:hover:bg-transparent"
                              title="Move Down"
                            >
                              <ArrowRight className="rotate-90" size={11} />
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <button 
                              onClick={() => { setEditingCategory(cat); setEditCategoryName(cat.name); }}
                              className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-sky-400 hover:bg-white/10 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white hover:text-red-500 hover:bg-white/10 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={11} />
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
