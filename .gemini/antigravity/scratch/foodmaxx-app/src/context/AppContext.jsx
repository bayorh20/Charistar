import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { playPop, playSuccessChime, playNotificationChime } from '../utils/sound';
import { safeStorage as localStorage } from '../utils/storage';
// Menu data comes exclusively from Firestore — no local seed data
import { db, auth } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { trackEvent, identifyUser } from '../utils/analytics';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Menu and categories come exclusively from Firestore.
  // State starts empty; onSnapshot fills it within ~200ms.
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_menu_categories_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [menuItems, setMenuItems]   = useState(() => {
    try {
      const saved = localStorage.getItem('fm_menu_items_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── One-time stale cache purge ─────────────────────────────────────────────
  // Clears any old localStorage menu data that may have been written by a
  // previous version of the app (seed data, etc.) so Firestore is always fresh.
  useEffect(() => {
    // Version 5: force-clearing local menu and category caches to sync newest page layout
    const CACHE_VERSION = '5';
    if (localStorage.getItem('fm_cache_version') !== CACHE_VERSION) {
      localStorage.removeItem('fm_menu_items');
      localStorage.removeItem('fm_menu_categories');
      localStorage.removeItem('fm_menu_items_v4');
      localStorage.removeItem('fm_menu_categories_v4');
      localStorage.removeItem('fm_menu_items_v5');
      localStorage.removeItem('fm_menu_categories_v5');
      localStorage.removeItem('fm_favs');
      // Clear ALL keys that might have old menu-related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('fm_menu')) localStorage.removeItem(key);
      });
      localStorage.setItem('fm_cache_version', CACHE_VERSION);
    }
  }, []);


  const getAutoTheme = () => {
    return 'light';
  };
  
  const [guestUid] = useState(() => {
    try {
      let uid = localStorage.getItem('fm_guest_uid');
      if (!uid) {
        uid = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('fm_guest_uid', uid);
      }
      return uid;
    } catch {
      return 'guest_temp_' + Math.random().toString(36).substring(2, 10);
    }
  });

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  
  const [selectedAddress, setSelectedAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_address');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === 'object' && parsed.name) {
        return parsed;
      }
    } catch (e) {
      console.warn("Error parsing selectedAddress:", e);
    }
    return { name: 'Set Location', desc: 'No address set yet' };
  });

  const [orderHistory, setOrderHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_orders');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Error parsing orderHistory:", e);
    }
    return [];
  });

  const [currentOrder, setCurrentOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_current_order');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === 'object' && parsed.id) return parsed;
    } catch (e) {
      console.warn("Error parsing currentOrder:", e);
    }
    return null;
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_sound');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'boolean') return parsed;
      }
    } catch (e) {
      console.warn("Error parsing soundEnabled:", e);
    }
    return true;
  });

  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.warn("Error parsing theme:", e);
    }
    return getAutoTheme();
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_favs');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed.filter(item => typeof item === 'string');
    } catch (e) {
      console.warn("Error parsing favorites:", e);
    }
    return [];
  });

  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_saved_addresses');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Error parsing savedAddresses:", e);
    }
    return [];
  });

  const [activeScreen, setActiveScreen] = useState(() => {
    const saved = localStorage.getItem('fm_active_screen');
    return saved || 'home';
  });
  
  const [storeConfig, setStoreConfig] = useState(null);
  const [marketingConfig, setMarketingConfig] = useState(null);
  const [pageLayout, setPageLayout] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customizingItem, setCustomizingItem] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartNotification, setCartNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('fm_menu_items_v5');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return false;
        }
      }
    } catch {}
    return true;
  });

  // Unread Support message status
  const [unreadSupport, setUnreadSupport] = useState(() => {
    return localStorage.getItem('fm_unread_support') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('fm_unread_support', unreadSupport ? 'true' : 'false');
  }, [unreadSupport]);

  // Editable Profile state
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('fm_user_profile');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.gender) {
            parsed.gender = 'male';
          }
          const hasValidPhoto = parsed.photo && (parsed.photo.startsWith('/') || parsed.photo.includes('.'));
          if (!hasValidPhoto) {
            parsed.photo = parsed.gender === 'female' ? '/avatar_female.webp' : '/avatar_male.webp';
          } else if (parsed.photo.endsWith('.png')) {
            parsed.photo = parsed.photo.replace('.png', '.webp');
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing user profile:", e);
    }
    return {
      name: '',
      phone: '',
      photo: '/avatar_male.webp',
      gender: 'male',
      pushEnabled: true,
      registered: false,
      isGuest: false
    };
  });

  // Rewards and points system state
  const [userPoints, setUserPoints] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_user_points');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'number' && !isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Error parsing userPoints:", e);
    }
    return 0;
  });

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const [lastBonusClaimed, setLastBonusClaimed] = useState(() => {
    return localStorage.getItem('fm_last_bonus_claimed') || '';
  });

  const [unlockedPerks, setUnlockedPerks] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_unlocked_perks');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Error parsing unlockedPerks:", e);
    }
    return [];
  });


  // Real-time synchronization with Firestore user profile document
  useEffect(() => {
    if (!auth || !db) return;
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Sync user profile fields
            setUserProfile({
              name: data.name || '',
              phone: data.phone || user.phoneNumber || '',
              photo: data.photo || (data.gender === 'female' ? '/avatar_female.webp' : '/avatar_male.webp'),
              gender: data.gender || 'male',
              pushEnabled: data.pushEnabled !== false,
              registered: true,
              isGuest: false
            });
            
            if (typeof data.points === 'number') {
              setUserPoints(data.points);
            }
            if (Array.isArray(data.savedAddresses)) {
              setSavedAddresses(data.savedAddresses);
            }
            if (Array.isArray(data.favorites)) {
              setFavorites(data.favorites);
            }
            if (Array.isArray(data.unlockedPerks)) {
              setUnlockedPerks(data.unlockedPerks);
            }
          } else {
            // Auto-create missing user document if they are logged in via Auth
            // (e.g. if the Firestore document was cleared during a database purge)
            const name = user.displayName || 'Foodie';
            const phone = user.phoneNumber || '';
            setDoc(userDocRef, {
              name,
              phone,
              gender: 'male',
              photo: '/avatar_male.webp',
              pushEnabled: true,
              points: 200,
              savedAddresses: [],
              favorites: [],
              unlockedPerks: [],
              registered: true,
              createdAt: new Date().toISOString()
            }).catch(err => console.error("Error auto-creating missing user document:", err));
          }
        }, (err) => {
          console.warn("Firestore user snapshot failed:", err);
        });
      }
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      unsubscribeAuth();
    };
  }, []);

  // Real-time synchronization of order history from Firestore
  useEffect(() => {
    if (!auth || !db) return;
    let unsubscribeOrders = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
      }
      
      const targetUserId = user ? user.uid : guestUid;
      const q = query(collection(db, 'orders'), where('userId', '==', targetUserId));
      
      unsubscribeOrders = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        list.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : 0;
          const dateB = b.createdAt ? new Date(b.createdAt) : 0;
          return dateB - dateA;
        });

        setOrderHistory(list);
        localStorage.setItem('fm_orders', JSON.stringify(list));

        // Sync current active order if any (statusIndex < 4 && statusIndex >= 0)
        const active = list.find(o => typeof o.statusIndex === 'number' && o.statusIndex < 4 && o.statusIndex >= 0);
        if (active) {
          setCurrentOrder(active);
        } else {
          // Keep completed/rated order if it was selected, so user can see rating card
          setCurrentOrder(prev => {
            if (prev) {
              const match = list.find(o => o.id === prev.id);
              if (match) return match;
            }
            return null;
          });
        }
      }, (err) => {
        console.warn("Firestore orders snapshot failed:", err);
      });
    });

    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      unsubscribeAuth();
    };
  }, [guestUid]);

  // Real-time synchronization of menu items, categories, and settings from Firestore
  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    // Categories — live from Firestore only. Admin Dashboard manages these.
    const unsubscribeCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
      // Only display visible and active categories to customer app
      const customerCats = list.filter(c => c.visibility !== 'hidden' && c.status !== 'inactive');
      setCategories(customerCats);
      try {
        localStorage.setItem('fm_menu_categories_v5', JSON.stringify(customerCats));
      } catch {}
    }, (err) => {
      console.warn('Firestore categories stream failed:', err);
    });

    // Menu items — live from Firestore only. Admin Dashboard manages these.
    const unsubscribeItems = onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Only display active, non-draft products to customer app
      const customerItems = list.filter(item => item.isDraft !== true && item.status !== 'inactive');
      setMenuItems(customerItems);
      try {
        localStorage.setItem('fm_menu_items_v5', JSON.stringify(customerItems));
      } catch {}
      setIsLoading(false);
    }, (err) => {
      console.warn('Firestore menu items stream failed:', err);
      setIsLoading(false);
    });

    const unsubscribeStore = onSnapshot(doc(db, 'settings', 'store_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreConfig(data);
        
        // Remote Cache Purge Engine
        if (data.cacheVersion !== undefined) {
          const localVer = parseInt(localStorage.getItem('fm_cache_version') || '0', 10);
          const remoteVer = parseInt(data.cacheVersion || 0, 10);
          if (remoteVer > localVer) {
            localStorage.setItem('fm_cache_version', String(remoteVer));
            console.warn('Remote cache purge requested (v' + remoteVer + '). Clearing client caches...');
            
            // Unregister Service Workers
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (let r of registrations) {
                  r.unregister();
                }
              });
            }
            // Clear Cache Storages
            if ('caches' in window) {
              caches.keys().then((keys) => {
                for (let k of keys) {
                  caches.delete(k);
                }
              });
            }
            
            // Clear Storage while preserving user identifiers and configuration
            const preservedKeys = ['fm_user_profile', 'fm_guest_uid', 'fm_cache_version', 'sound_enabled', 'soundEnabled', 'dark_mode'];
            const preserved = {};
            preservedKeys.forEach(k => {
              const val = localStorage.getItem(k);
              if (val !== null) preserved[k] = val;
            });
            localStorage.clear();
            sessionStorage.clear();
            Object.entries(preserved).forEach(([k, v]) => {
              localStorage.setItem(k, v);
            });
            
            setTimeout(() => {
              window.location.reload();
            }, 400);
          } else if (localStorage.getItem('fm_cache_version') === null) {
            localStorage.setItem('fm_cache_version', String(remoteVer));
          }
        }
        
        // Dynamically apply colors to DOM
        const root = document.documentElement;
        if (data.themeColors) {
          if (data.themeColors.primary) {
            root.style.setProperty('--primary', data.themeColors.primary);
            root.style.setProperty('--primary-hover', data.themeColors.primary + 'd6');
            root.style.setProperty('--primary-glow', data.themeColors.primary + '20');
          }
          if (data.themeColors.secondary) {
            root.style.setProperty('--secondary', data.themeColors.secondary);
          }
          if (data.themeColors.accent) {
            root.style.setProperty('--accent', data.themeColors.accent);
          }
        }
      }
    }, (err) => {
      console.warn("Firestore store settings stream failed:", err);
    });

    const unsubscribeMarketing = onSnapshot(doc(db, 'settings', 'marketing_config'), (docSnap) => {
      if (docSnap.exists()) {
        setMarketingConfig(docSnap.data());
      }
    }, (err) => {
      console.warn("Firestore marketing settings stream failed:", err);
    });

    const unsubscribeLayout = onSnapshot(doc(db, 'settings', 'page_layout'), (docSnap) => {
      if (docSnap.exists()) {
        setPageLayout(docSnap.data());
      }
    }, (err) => {
      console.warn("Firestore page layout stream failed:", err);
    });

    return () => {
      unsubscribeCats();
      unsubscribeItems();
      unsubscribeStore();
      unsubscribeMarketing();
      unsubscribeLayout();
    };
  }, []);

  // Real-time synchronization of active order status from Firestore
  useEffect(() => {
    if (!db || !currentOrder?.id) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', currentOrder.id), (docSnap) => {
      if (docSnap.exists()) {
        // ✅ FIXED: include the document id — docSnap.data() does NOT contain it
        const data = { id: docSnap.id, ...docSnap.data() };
        setCurrentOrder(prev => {
          // If status index changed, play notification chime
          if (prev && (prev.statusIndex !== data.statusIndex || prev.status !== data.status)) {
            playNotificationChime(soundEnabled);
          }
          return data;
        });

        // Sync to orderHistory and localStorage to update Delivered/Ongoing lists in real-time
        setOrderHistory(prevHistory => {
          const index = prevHistory.findIndex(o => o.id === data.id);
          let nextHistory;
          if (index !== -1) {
            nextHistory = [...prevHistory];
            nextHistory[index] = { ...nextHistory[index], ...data };
          } else {
            nextHistory = [data, ...prevHistory];
          }
          localStorage.setItem('fm_orders', JSON.stringify(nextHistory));
          return nextHistory;
        });
      }
    }, (err) => {
      console.warn("Error streaming active order status:", err);
    });

    return () => unsubscribe();
  }, [currentOrder?.id, soundEnabled]);

  // Real-time synchronization of states from localStorage changes (fired from Admin Dashboard)
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (e && e.key === 'fm_support_messages') {
          // If the message history was updated from another window (e.g. admin dashboard replies)
          // and support chat is currently closed, show a glowing notification badge on the Support tab.
          if (!showSupport) {
            setUnreadSupport(true);
            playNotificationChime(soundEnabled);
          }
        }

        const activeOrder = localStorage.getItem('fm_current_order');
        if (activeOrder) {
          const parsed = JSON.parse(activeOrder);
          if (parsed && parsed.id) {
            setCurrentOrder(prev => {
              if (!prev || prev.statusIndex !== parsed.statusIndex || prev.status !== parsed.status) {
                // Play notification sound when order status changes in real-time
                if (prev && (prev.statusIndex !== parsed.statusIndex || prev.status !== parsed.status)) {
                  playNotificationChime(soundEnabled);
                }
                return parsed;
              }
              return prev;
            });
          }
        } else {
          setCurrentOrder(prev => prev ? null : prev);
        }

        const history = localStorage.getItem('fm_orders');
        if (history) {
          const parsed = JSON.parse(history);
          if (Array.isArray(parsed)) {
            setOrderHistory(parsed);
          }
        }

        // Note: menu categories and items are NOT loaded from localStorage.
        // They come exclusively from Firestore via onSnapshot listeners.
        // Reading them from localStorage would overwrite fresh Firestore data with stale cache.
      } catch (err) {
        console.warn("Storage sync failed in AppContext:", err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [showSupport, soundEnabled]);

  // Request browser notification permission if not already decided
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        Notification.requestPermission()
          .then(permission => {
            console.log('Notification permission:', permission);
          })
          .catch(err => {
            console.warn('Notification permission request error:', err);
          });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleFavorite = useCallback((itemId) => {
    setFavorites(prev => {
      const exists = prev.includes(itemId);
      const next = exists ? prev.filter(id => id !== itemId) : [...prev, itemId];
      if (auth?.currentUser && db) {
        updateDoc(doc(db, 'users', auth.currentUser.uid), { favorites: next })
          .catch(err => console.error("Error updating favorites in Firestore:", err));
      }
      playPop(soundEnabled);
      return next;
    });
  }, [soundEnabled]);

  const addAddress = useCallback((address) => {
    setSavedAddresses(prev => {
      const next = [...prev, { ...address, id: Date.now().toString() }];
      if (auth?.currentUser && db) {
        updateDoc(doc(db, 'users', auth.currentUser.uid), { savedAddresses: next })
          .catch(err => console.error("Error adding address in Firestore:", err));
      }
      playPop(soundEnabled);
      return next;
    });
  }, [soundEnabled]);

  const deleteAddress = useCallback((id) => {
    setSavedAddresses(prev => {
      const next = prev.filter(addr => addr.id !== id);
      if (auth?.currentUser && db) {
        updateDoc(doc(db, 'users', auth.currentUser.uid), { savedAddresses: next })
          .catch(err => console.error("Error deleting address in Firestore:", err));
      }
      playPop(soundEnabled);
      return next;
    });
  }, [soundEnabled]);

  const selectAddress = useCallback((addr) => {
    setSelectedAddress({
      name: addr.name,
      desc: addr.details,
      id: addr.id,
      isSaved: true
    });
  }, []);

  // Search History State
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('fm_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('fm_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const addSearchHistory = useCallback((term) => {
    if (!term || term.trim() === '') return;
    setSearchHistory(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 10);
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  // One-Tap Reorder
  const reorderItems = useCallback((items) => {
    const refreshed = items.map(item => ({
      ...item,
      uniqueId: item.uniqueId || `${item.id}-reorder-${Date.now()}`,
      quantity: item.quantity || 1
    }));
    setCart(refreshed);
    playSuccessChime(soundEnabled);
  }, [soundEnabled]);

  const loadGoogleFonts = useCallback((font1, font2) => {
    if (!font1 || !font2) return;
    const cleanFont1 = font1.trim();
    const cleanFont2 = font2.trim();
    const fontKey = `gf-${cleanFont1.replace(/\s+/g, '-')}-${cleanFont2.replace(/\s+/g, '-')}`;
    if (document.getElementById(fontKey)) return;
    
    // Clear old links
    const existing = document.querySelectorAll('link[id^="gf-"]');
    existing.forEach(el => el.remove());
    
    const link = document.createElement('link');
    link.id = fontKey;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${cleanFont1.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&family=${cleanFont2.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    } else {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }
    localStorage.setItem('fm_theme', theme);

    // Apply dynamic styling settings if available
    if (storeConfig?.stylingSettings) {
      const styling = storeConfig.stylingSettings;
      
      // 1. Google Fonts loading
      const fontPrimary = styling.fontFamilyPrimary || 'Plus Jakarta Sans';
      const fontAccent = styling.fontFamilyAccent || 'Outfit';
      loadGoogleFonts(fontPrimary, fontAccent);

      // 2. Apply typography properties
      root.style.setProperty('--font-primary', `'${fontPrimary}', -apple-system, sans-serif`);
      root.style.setProperty('--font-accent', `'${fontAccent}', sans-serif`);
      
      // 3. Apply base font size
      if (styling.fontSizeBase) {
        root.style.setProperty('--font-size-base', `${styling.fontSizeBase}px`);
      }

      // 4. Apply scaled border corner radius properties
      const baseRadius = styling.borderRadiusBase !== undefined ? styling.borderRadiusBase : 14;
      root.style.setProperty('--radius-xs', `${Math.max(4, baseRadius - 6)}px`);
      root.style.setProperty('--radius-sm', `${baseRadius}px`);
      root.style.setProperty('--radius-md', `${baseRadius + 6}px`);
      root.style.setProperty('--radius-lg', `${baseRadius + 10}px`);

      // 5. Apply layout density padding scale
      const density = styling.spacingDensity || 'cozy';
      let paddingScale = 1.0;
      if (density === 'compact') paddingScale = 0.85;
      else if (density === 'spacious') paddingScale = 1.2;
      root.style.setProperty('--spacing-scale', paddingScale);

      // 6. Apply mode-specific layout color overrides
      if (theme === 'dark') {
        root.style.setProperty('--bg-app', styling.darkBgApp || '#0F0B09');
        root.style.setProperty('--bg-card', styling.darkBgCard || '#171210');
        root.style.setProperty('--text-main', styling.darkTextMain || '#D5CFC7');
        root.style.setProperty('--text-muted', styling.darkTextMuted || '#9D9187');
        root.style.setProperty('--border-color', styling.darkBorderColor || '#2D231F');
      } else {
        root.style.setProperty('--bg-app', styling.lightBgApp || '#FDFDFD');
        root.style.setProperty('--bg-card', styling.lightBgCard || '#FFFFFF');
        root.style.setProperty('--text-main', styling.lightTextMain || '#4D423E');
        root.style.setProperty('--text-muted', styling.lightTextMuted || '#9A9189');
        root.style.setProperty('--border-color', styling.lightBorderColor || '#EAEAEA');
      }
    }
  }, [theme, storeConfig, loadGoogleFonts]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('fm_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem('fm_address', JSON.stringify(selectedAddress));
    }
  }, [selectedAddress]);

  useEffect(() => {
    localStorage.setItem('fm_orders', JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    if (currentOrder) {
      localStorage.setItem('fm_current_order', JSON.stringify(currentOrder));
    } else {
      localStorage.removeItem('fm_current_order');
    }
  }, [currentOrder]);

  useEffect(() => {
    localStorage.setItem('fm_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('fm_saved_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  useEffect(() => {
    localStorage.setItem('fm_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('fm_active_screen', activeScreen);
  }, [activeScreen]);

  useEffect(() => {
    localStorage.setItem('fm_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('fm_user_points', JSON.stringify(userPoints));
  }, [userPoints]);

  useEffect(() => {
    localStorage.setItem('fm_unlocked_perks', JSON.stringify(unlockedPerks));
  }, [unlockedPerks]);

  // Note: categories and menuItems are NOT written to localStorage.
  // Firestore is the single source of truth. Writing them to localStorage
  // would allow stale data to override fresh Firestore snapshots.

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Pure DOM-based Web Animations API flying animation
  const triggerFly = useCallback((image, clientX, clientY) => {
    try {
      const screenEl = document.querySelector('.phone-screen');
      if (!screenEl) return;
      
      const screenRect = screenEl.getBoundingClientRect();
      const startX = clientX - screenRect.left;
      const startY = clientY - screenRect.top;
      
      let optimizedImage = image;
      if (image && image.includes('images.unsplash.com')) {
        optimizedImage = image.replace(/w=\d+/, 'w=120').replace(/q=\d+/, 'q=40');
      }

      const flyer = document.createElement('div');
      flyer.style.position = 'absolute';
      flyer.style.left = '0';
      flyer.style.top = '0';
      flyer.style.width = '54px';
      flyer.style.height = '54px';
      flyer.style.borderRadius = '50%';
      flyer.style.border = '3px solid var(--primary)';
      flyer.style.boxShadow = '0 8px 24px rgba(255, 91, 38, 0.4)';
      flyer.style.backgroundImage = `url(${optimizedImage})`;
      flyer.style.backgroundSize = 'cover';
      flyer.style.backgroundPosition = 'center';
      flyer.style.pointerEvents = 'none';
      flyer.style.zIndex = '12000';
      
      screenEl.appendChild(flyer);
      
      const targetX = 195 - 27; 
      const targetY = 740 - 27; 
      const startXAdjusted = startX - 27;
      const startYAdjusted = startY - 27;
      
      const anim = flyer.animate([
        {
          transform: `translate3d(${startXAdjusted}px, ${startYAdjusted}px, 0) scale(1) rotate(0deg)`,
          opacity: 1
        },
        {
          transform: `translate3d(${(startXAdjusted + targetX) / 2}px, ${startYAdjusted - 180}px, 0) scale(1.4) rotate(180deg)`,
          opacity: 1,
          offset: 0.5
        },
        {
          transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(0.15) rotate(360deg)`,
          opacity: 0
        }
      ], {
        duration: 850,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      });
      
      anim.onfinish = () => flyer.remove();
      anim.onerror = () => flyer.remove();
    } catch (err) {
      console.warn('Failed to animate flying item:', err);
    }
  }, []);

  const addToCart = useCallback((item, customizations = [], quantity = 1, event = null) => {
    const customKey = customizations.map(c => c.name).sort().join('|');
    const uniqueId = `${item.id}-${customKey}`;

    const customPrice = customizations.reduce((acc, c) => acc + c.price, 0);
    const itemTotalPrice = item.price + customPrice;

    setCartNotification({
      name: item.name,
      image: item.image,
      id: Date.now()
    });

    trackEvent('add_to_cart', {
      item_id: item.id,
      item_name: item.name,
      price: itemTotalPrice,
      quantity
    });

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.uniqueId === uniqueId);
      playPop(soundEnabled);

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      }
      
      return [...prevCart, {
        ...item,
        uniqueId,
        customizations,
        price: itemTotalPrice,
        basePrice: item.price,
        quantity
      }];
    });
  }, [soundEnabled]);

  const removeFromCart = useCallback((uniqueId) => {
    trackEvent('remove_from_cart', { unique_id: uniqueId });
    setCart(prevCart => prevCart.filter(item => item.uniqueId !== uniqueId));
    playPop(soundEnabled);
  }, [soundEnabled]);

  const updateCartQuantity = useCallback((uniqueId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(uniqueId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.uniqueId === uniqueId ? { ...item, quantity: newQty } : item
      )
    );
    playPop(soundEnabled);
  }, [soundEnabled, removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const placeOrder = useCallback((paymentDetails) => {
    const total = paymentDetails.totalAmount !== undefined ? paymentDetails.totalAmount : getCartTotal();
    const orderId = `FMX-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderAddress = paymentDetails.street
      ? { name: paymentDetails.street, details: paymentDetails.street }
      : selectedAddress;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const orderData = {
      id: orderId,
      userId: auth?.currentUser?.uid || guestUid,
      customerName: paymentDetails.name || userProfile.name || 'Guest User',
      customerPhone: paymentDetails.phone || userProfile.phone || '',
      cart: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || '',
        customizations: item.customizations || []
      })),
      total,
      couponCode: paymentDetails.couponCode || null,
      discount: paymentDetails.discount || 0,
      address: orderAddress,
      payment: paymentDetails,
      notes: paymentDetails.notes || '',
      allergies: paymentDetails.allergies || '',
      status: 'Order Received',
      statusIndex: 0,
      timestamp,
      createdAt: new Date().toISOString(),
      deliveryType: null,
      driverName: null,
      rating: null,
      reviewText: null,
      activityLogs: [
        {
          event: 'Order Received',
          timestamp: new Date().toISOString(),
          actor: 'Customer PWA Client',
          note: 'Order placed successfully by customer'
        }
      ]
    };

    if (paymentDetails.street) {
      setSelectedAddress(orderAddress);
    }

    trackEvent('purchase', {
      transaction_id: orderId,
      value: total,
      currency: 'NGN',
      items: cart.map(i => ({ item_id: i.id, item_name: i.name, quantity: i.quantity, price: i.price }))
    });

    const pointsEarned = Math.floor(total / 1000) * 10;
    
    // Update local state first for fast response
    if (pointsEarned > 0) {
      setUserPoints(prev => {
        const next = prev + pointsEarned;
        return next;
      });
    }

    if (unlockedPerks.includes('free_delivery')) {
      setUnlockedPerks(prev => {
        const next = prev.filter(p => p !== 'free_delivery');
        return next;
      });
    }

    if (db) {
      setDoc(doc(db, 'orders', orderId), orderData)
        .catch(err => console.error("Error saving order to Firestore:", err));
      
      // Update points and perks on Firestore user document
      if (auth?.currentUser) {
        const updatedPoints = userPoints + pointsEarned;
        const updatedPerks = unlockedPerks.filter(p => p !== 'free_delivery');
        updateDoc(doc(db, 'users', auth.currentUser.uid), {
          points: updatedPoints,
          unlockedPerks: updatedPerks
        }).catch(err => console.error("Error updating user stats in Firestore:", err));
      }
    }

    setCurrentOrder(orderData);
    setOrderHistory(prev => {
      const next = [orderData, ...prev];
      localStorage.setItem('fm_orders', JSON.stringify(next));
      return next;
    });
    setCart([]);
    playSuccessChime(soundEnabled);
    
    import('canvas-confetti').then((module) => {
      const confetti = module.default;
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#ea580c', '#f97316', '#fb923c', '#10b981', '#ffffff']
      };

      function fire(particleRatio, opts) {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(count * particleRatio)
        }));
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    });

    setActiveScreen('orders');
  }, [cart, selectedAddress, soundEnabled, unlockedPerks, getCartTotal, userProfile, userPoints, guestUid]);

  const updateProfile = useCallback((updated) => {
    setUserProfile(prev => {
      const next = { ...prev, ...updated };
      if (auth?.currentUser && db) {
        updateDoc(doc(db, 'users', auth.currentUser.uid), updated)
          .catch(err => console.error("Error updating Firestore profile:", err));
      }
      return next;
    });
    playSuccessChime(soundEnabled);
  }, [soundEnabled]);

  const registerUser = useCallback((name, phone, gender = 'male', uid = null) => {
    const avatar = gender === 'female' ? '/avatar_female.webp' : '/avatar_male.webp';
    const profileData = {
      name,
      phone,
      photo: avatar,
      gender,
      registered: true,
      isGuest: false
    };

    if (uid && db) {
      setDoc(doc(db, 'users', uid), {
        ...profileData,
        points: 200, // 200 Welcome points
        savedAddresses: [],
        favorites: [],
        unlockedPerks: [],
        createdAt: new Date().toISOString()
      }).catch(err => console.error("Error registering user in Firestore:", err));
    } else {
      setUserProfile(profileData);
      setUserPoints(200);
    }

    playSuccessChime(soundEnabled);
    import('canvas-confetti').then((module) => {
      module.default({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.8 }
      });
    });
  }, [soundEnabled]);

  const setGuestMode = useCallback(() => {
    setUserProfile(prev => ({
      ...prev,
      isGuest: true
    }));
    playPop(soundEnabled);
  }, [soundEnabled]);

  const clearAppCache = useCallback(async () => {
    try {
      // 1. Clear browser caches (Service Worker cache storage)
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      // 2. Clear stale local storage keys (keeping Firebase auth keys and profile/guest mode details)
      const keysToKeep = ['fm_user_profile', 'fm_guest_uid'];
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('firebase:') && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // 3. Clear session storage
      sessionStorage.clear();

      // 4. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      playSuccessChime(soundEnabled);
      return true;
    } catch (e) {
      console.warn("Manual cache cleaning failed:", e);
      return false;
    }
  }, [soundEnabled]);

  const logoutUser = useCallback(async () => {
    try {
      // Sign out from Firebase Auth
      if (auth) await signOut(auth);
    } catch (err) {
      console.warn('[Auth] Sign-out error:', err);
    }
    // Clear all local app state keys
    const keysToRemove = [
      'fm_user_profile', 'fm_user_points', 'fm_orders', 'fm_current_order',
      'fm_cart', 'fm_favs', 'fm_saved_addresses', 'fm_active_screen',
      'fm_unlocked_perks', 'fm_last_bonus_claimed', 'fm_unread_support',
      'fm_sw_version'
    ];
    keysToRemove.forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });
    // Automatic Cache Invalidation on Logout
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
    } catch (e) {
      console.warn("Cache clearing on logout failed:", e);
    }
    // Reload to reset all React state and land back on onboarding
    window.location.reload();
  }, []);

  const rateOrder = useCallback((orderId, rating, reviewText) => {
    if (db) {
      updateDoc(doc(db, 'orders', orderId), { rating, reviewText })
        .catch(err => console.error("Error rating order in Firestore:", err));
    }
    if (currentOrder && currentOrder.id === orderId) {
      setCurrentOrder(prev => ({ ...prev, rating, reviewText }));
    }
    setOrderHistory(prevHistory => 
      prevHistory.map(order => 
        order.id === orderId ? { ...order, rating, reviewText } : order
      )
    );
    playSuccessChime(soundEnabled);
  }, [currentOrder, soundEnabled]);

  const claimDailyBonus = useCallback(() => {
    const today = new Date().toDateString();
    if (lastBonusClaimed === today) {
      return { success: false, message: 'Daily bonus already claimed today!' };
    }
    setUserPoints(prev => prev + 50);
    setLastBonusClaimed(today);
    localStorage.setItem('fm_last_bonus_claimed', today);
    playSuccessChime(soundEnabled);
    return { success: true, message: 'Bonus claimed! +50 Points 🎁' };
  }, [lastBonusClaimed, soundEnabled]);

  const redeemReward = useCallback((rewardId, pointsCost) => {
    if (userPoints < pointsCost) {
      return { success: false, message: 'Insufficient points!' };
    }
    setUserPoints(prev => prev - pointsCost);
    setUnlockedPerks(prev => [...prev, rewardId]);
    playSuccessChime(soundEnabled);
    return { success: true, message: 'Reward redeemed successfully! 🌟' };
  }, [userPoints, soundEnabled]);

  const cancelActiveOrder = useCallback(() => {
    if (currentOrder) {
      if (db) {
        updateDoc(doc(db, 'orders', currentOrder.id), { statusIndex: -1, status: 'Cancelled' })
          .catch(err => console.error("Error cancelling order in Firestore:", err));
      }
      setOrderHistory(prevHistory => {
        const nextHistory = prevHistory.map(o => o.id === currentOrder.id ? { ...o, statusIndex: -1, status: 'Cancelled' } : o);
        localStorage.setItem('fm_orders', JSON.stringify(nextHistory));
        return nextHistory;
      });
    }
    setCurrentOrder(null);
    setActiveScreen('home');
  }, [currentOrder]);

  const refreshApp = useCallback((delay = 600) => {
    setIsLoading(true);
    setSelectedCategory('all');
    setCustomizingItem(null);
    setShowProfile(false);
    setIsCartOpen(false);
    setActiveScreen('home');
    setTimeout(() => {
      window.location.reload();
    }, delay);
  }, []);

  // Memoize the provider value object to prevent unnecessary renders for downstream consumers
  const providerValue = useMemo(() => ({
    refreshApp,
    clearAppCache,
    cart,
    selectedAddress,
    setSelectedAddress,
    orderHistory,
    currentOrder,
    setCurrentOrder,
    soundEnabled,
    toggleSound,
    theme,
    setTheme,
    activeScreen,
    setActiveScreen,
    selectedCategory,
    setSelectedCategory,
    customizingItem,
    setCustomizingItem,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    placeOrder,
    cancelActiveOrder,
    showProfile,
    setShowProfile,
    showSupport,
    setShowSupport,
    favorites,
    toggleFavorite,
    savedAddresses,
    addAddress,
    deleteAddress,
    selectAddress,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
    reorderItems,
    isCartOpen,
    setIsCartOpen,
    cartNotification,
    setCartNotification,
    isLoading,
    cartTotalItems,
    cartSubtotal,
    userProfile,
    updateProfile,
    registerUser,
    setGuestMode,
    logoutUser,
    userPoints,
    claimDailyBonus,
    redeemReward,
    unlockedPerks,
    rateOrder,
    deferredPrompt,
    setDeferredPrompt,
    categories,
    setCategories,
    menuItems,
    setMenuItems,
    unreadSupport,
    setUnreadSupport,
    storeConfig,
    marketingConfig,
    pageLayout
  }), [
    refreshApp,
    clearAppCache,
    cart,
    selectedAddress,
    orderHistory,
    currentOrder,
    soundEnabled,
    toggleSound,
    theme,
    setTheme,
    activeScreen,
    selectedCategory,
    customizingItem,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    placeOrder,
    cancelActiveOrder,
    showProfile,
    showSupport,
    favorites,
    toggleFavorite,
    savedAddresses,
    addAddress,
    deleteAddress,
    selectAddress,
    searchHistory,
    addSearchHistory,
    clearSearchHistory,
    reorderItems,
    isCartOpen,
    cartNotification,
    isLoading,
    cartTotalItems,
    cartSubtotal,
    userProfile,
    updateProfile,
    registerUser,
    setGuestMode,
    logoutUser,
    userPoints,
    claimDailyBonus,
    redeemReward,
    unlockedPerks,
    rateOrder,
    deferredPrompt,
    categories,
    menuItems,
    unreadSupport,
    storeConfig,
    marketingConfig,
    pageLayout
  ]);

  return (
    <AppContext.Provider value={providerValue}>
      {children}
    </AppContext.Provider>
  );
};
