import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db, auth } from '../firebase/config';
import { 
  collection, onSnapshot, doc, setDoc, updateDoc, 
  deleteDoc, addDoc, query, orderBy, limit 
} from 'firebase/firestore';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [categories, setCategories]             = useState(() => {
    try {
      const saved = localStorage.getItem('fm_menu_categories_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [menuItems, setMenuItems]               = useState(() => {
    try {
      const saved = localStorage.getItem('fm_menu_items_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [orders, setOrders]                     = useState([]);
  const [optionPresets, setOptionPresets]       = useState([]);
  const [users, setUsers]                       = useState([]);
  const [affiliates, setAffiliates]             = useState([]);
  const [coupons, setCoupons]                   = useState([]);
  const [riders, setRiders]                     = useState([]);
  const [auditLogs, setAuditLogs]               = useState([]);
  const [reviews, setReviews]                   = useState([]);
  const [marketingConfig, setMarketingConfig]   = useState(null);
  const [storeConfig, setStoreConfig]           = useState(null);
  const [pageLayout, setPageLayout]             = useState(null);
  const [loading, setLoading]                   = useState(() => {
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

  // ── Log administrative actions ───────────────────────────────────────────
  const logAction = useCallback(async (actionDesc, actorName = 'Super Admin') => {
    if (!db) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action: actionDesc,
        actor: actorName,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }, []);

  // ── Listeners Lifecycle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    let unsubs = [];
    let deferredTimer = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // Clean up previous listeners & timers
      unsubs.forEach(u => u());
      unsubs = [];
      if (deferredTimer) {
        clearTimeout(deferredTimer);
        deferredTimer = null;
      }

      if (!user) {
        setOrders([]);
        setOptionPresets([]);
        setUsers([]);
        setAffiliates([]);
        setCoupons([]);
        setRiders([]);
        setAuditLogs([]);
        setReviews([]);
        setLoading(false);
        return;
      }

      // Attach Phase 1 listeners immediately on login
      try {
        unsubs.push(
          onSnapshot(collection(db, 'orders'), (snap) => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }, (err) => console.error('Orders listener error:', err)),

          onSnapshot(doc(db, 'settings', 'store_config'), (docSnap) => {
            if (docSnap.exists()) {
              setStoreConfig(docSnap.data());
            } else {
              const defaults = {
                isOpen: true,
                baseDeliveryFee: 1500,
                cookingBufferMinutes: 20,
                supportContact: '+234 812 345 6789',
                securityPin: '1234',
                themeColors: { primary: '#ea580c', secondary: '#fb923c', accent: '#f97316' },
                animationConfig: { mode: 'Slide', duration: 0.35, adminChartSpeed: 1.0, adminHoverBounce: true, adminBadgePulse: true }
              };
              setDoc(doc(db, 'settings', 'store_config'), defaults);
              setStoreConfig(defaults);
            }
          }, (err) => console.error('Store config listener error:', err)),

          onSnapshot(doc(db, 'settings', 'marketing_config'), (docSnap) => {
            if (docSnap.exists()) {
              setMarketingConfig(docSnap.data());
            } else {
              const defaults = {
                heroSlides: [{ id: 'slide-1', title: 'Delicious Rice Bowls', desc: 'Starting from ₦3,500 only!', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', linkType: 'category', linkValue: 'rice' }],
                pwaPromptText: 'Add FoodMaxx to your home screen for fast food ordering!',
                appLogoUrl: ''
              };
              setDoc(doc(db, 'settings', 'marketing_config'), defaults);
              setMarketingConfig(defaults);
            }
          }, (err) => console.error('Marketing config listener error:', err)),

          onSnapshot(collection(db, 'categories'), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (a.order || 0) - (b.order || 0));
            setCategories(list);
            try {
              localStorage.setItem('fm_menu_categories_v5', JSON.stringify(list));
            } catch {}
          }, (err) => console.error('Categories listener error:', err)),

          onSnapshot(collection(db, 'menu_items'), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setMenuItems(list);
            try {
              localStorage.setItem('fm_menu_items_v5', JSON.stringify(list));
            } catch {}
            setLoading(false);
          }, (err) => {
            console.error('Menu items listener error:', err);
            setLoading(false);
          }),

          onSnapshot(doc(db, 'settings', 'page_layout'), (docSnap) => {
            const DEFAULT_LAYOUT = {
              sections: [
                { id: 'greeting',     label: 'Greeting Banner',      visible: true,  order: 0 },
                { id: 'hero',         label: 'Hero Slider / Video',  visible: true,  order: 1, type: 'video', videoUrl: '/splash.mp4', slides: [] },
                { id: 'announcement', label: 'Announcement Banner',  visible: true,  order: 2, text: 'Lunch order closes at 10:00 AM. Next window: Dinner starts at 3:00 PM.', badge: 'Pre-Order Only' },
                { id: 'categories',   label: 'Category Scroller',    visible: true,  order: 3 },
                { id: 'trending',     label: 'Trending Deals',       visible: true,  order: 4, title: 'Trending Deals', layout: 'carousel' },
                { id: 'dishes',       label: 'All Dishes Grid',      visible: true,  order: 5, title: 'All Dishes', defaultView: 'classic' },
              ],
              animations: { mode: 'Slide', duration: 0.35 }
            };
            if (docSnap.exists()) {
              setPageLayout(docSnap.data());
            } else {
              setDoc(doc(db, 'settings', 'page_layout'), DEFAULT_LAYOUT);
              setPageLayout(DEFAULT_LAYOUT);
            }
          }, (err) => console.error('Page layout listener error:', err))
        );
      } catch (err) {
        console.error('Failed to attach Phase 1 listeners:', err);
      }

      // Attach Phase 2 listeners with 400ms delay to balance performance
      deferredTimer = setTimeout(() => {
        try {
          unsubs.push(
            onSnapshot(collection(db, 'users'), (snap) => {
              setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Users listener error:', err)),

            onSnapshot(collection(db, 'riders'), (snap) => {
              setRiders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Riders listener error:', err)),

            onSnapshot(collection(db, 'reviews'), (snap) => {
              setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Reviews listener error:', err)),

            onSnapshot(collection(db, 'coupons'), (snap) => {
              setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Coupons listener error:', err)),

            onSnapshot(collection(db, 'affiliates'), (snap) => {
              setAffiliates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Affiliates listener error:', err)),

            onSnapshot(collection(db, 'option_presets'), (snap) => {
              setOptionPresets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, (err) => console.error('Option presets listener error:', err)),

            onSnapshot(
              query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(150)),
              (snap) => { setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); },
              (err) => console.error('Audit logs listener error:', err)
            )
          );
        } catch (err) {
          console.error('Failed to attach Phase 2 listeners:', err);
        }
      }, 400);
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(u => u());
      if (deferredTimer) clearTimeout(deferredTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={{
      categories,
      menuItems,
      orders,
      optionPresets,
      users,
      affiliates,
      coupons,
      riders,
      auditLogs,
      reviews,
      marketingConfig,
      storeConfig,
      pageLayout,
      loading,
      logAction
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
