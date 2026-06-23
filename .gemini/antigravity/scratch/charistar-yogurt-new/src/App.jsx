import { Suspense, lazy, useEffect, useState, useLayoutEffect } from 'react';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PhoneWrapper from './components/PhoneWrapper';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import FlashLoader from './components/FlashLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { trackPixelEvent } from './utils/pixel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const NotificationToast = lazy(() => import('./components/NotificationToast'));
const MarketingPopup = lazy(() => import('./components/MarketingPopup'));
const OfflineBanner = lazy(() => import('./components/OfflineBanner'));
const PullToRefresh = lazy(() => import('./components/PullToRefresh'));
const AutoUpdater   = lazy(() => import('./components/AutoUpdater'));
import { CartProvider, useCart } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { onMessage } from 'firebase/messaging';
import app, { messaging, db } from './firebase';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';

// All pages lazy-loaded for fast initial bundle
const LandingPage    = lazy(() => import('./pages/LandingPage'));
const Profile        = lazy(() => import('./pages/Profile'));
const ShopPage       = lazy(() => import('./pages/ShopPage'));
const Favorites      = lazy(() => import('./pages/Favorites'));
const Checkout       = lazy(() => import('./pages/Checkout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TrackOrder     = lazy(() => import('./pages/TrackOrder'));
const ActiveTrack    = lazy(() => import('./pages/ActiveTrack'));
const OrdersPage     = lazy(() => import('./pages/OrdersPage'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));

function FCMTokenManager() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const requestPermission = async () => {
      try {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const { isSupported, getMessaging, getToken } = await import('firebase/messaging');
          const supported = await isSupported();
          if (!supported) return;
          const msg = getMessaging(app);
          const vapidKey = import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY;
          const token = await getToken(msg, vapidKey ? { vapidKey } : undefined);
          if (token) {
            await setDoc(doc(db, 'users', currentUser.uid), {
              fcmToken: token,
              email: currentUser.email
            }, { merge: true });
          }
        }
      } catch (err) {
        console.error('FCM Token Error:', err);
      }
    };
    const runDeferred = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => requestPermission());
      } else {
        setTimeout(requestPermission, 2500);
      }
    };
    runDeferred();
  }, [currentUser]);

  useEffect(() => {
    if (!messaging) return;
    const unsub = onMessage(messaging, (payload) => {
      if (Notification.permission === 'granted') {
        try {
          new Notification(payload.notification?.title || 'Charistar Update', {
            body: payload.notification?.body || 'New update received.',
            icon: '/favicon.svg'
          });
        } catch (e) {
            console.warn('Failed to show FCM notification:', e);
          }
      }
      window.dispatchEvent(new CustomEvent('fcm-message-received', { detail: payload }));
    });
    return () => unsub();
  }, []); // messaging is module-level, stable reference

  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Track pageview on route change
    trackPixelEvent('PageView', { content_name: pathname });
    
    // Instant jump to top on route change — bypass Lenis for this
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

function GlobalAdminListener() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      setIsAdmin(localStorage.getItem('charistar_admin_logged_in') === 'true');
    };
    checkAdmin();
    window.addEventListener('storage', checkAdmin);
    const interval = setInterval(checkAdmin, 5000);
    return () => {
      window.removeEventListener('storage', checkAdmin);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    let initialLoad = true;

    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      if (initialLoad) {
        initialLoad = false;
        return;
      }
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          console.log("New order detected, playing sound...");
          const audio = new Audio('/notification.mp3');
          // Important: Some browsers require interaction before playing audio.
          audio.play().catch(e => {
            console.warn('Audio play blocked. Admin must interact with the page first:', e);
          });
        }
      });
    });

    return () => unsub();
  }, [isAdmin]);

  return null;
}

function PrivateRoute({ children }) {
  const { currentUser, openAuthModal } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      openAuthModal('login');
    }
  }, [currentUser, openAuthModal]);

  return currentUser ? children : <Navigate to="/" replace />;
}

function Layout() {
  const location = useLocation();
  const { isCartOpen } = useCart();
  const { isAuthModalOpen } = useAuth();

  const mainRoutes = ['/', '/shop', '/favorites', '/profile', '/track', '/orders'];
  const showNav = mainRoutes.includes(location.pathname);

  return (
    <div className="relative min-h-screen w-full bg-charistar-dark flex flex-col">
      <div className="flex-1 w-full relative overflow-x-hidden no-scrollbar">
        <Suspense fallback={<FlashLoader />}>
          <PullToRefresh onRefresh={async () => { 
            try {
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (let reg of regs) { await reg.unregister(); }
              }
              if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
              }
            } catch(e) {
              console.warn('PullToRefresh cache clear failed (non-critical):', e);
            }
            window.location.href = window.location.href + '?t=' + Date.now(); 
          }}>
            <div className="pb-32 min-h-screen">
              <Suspense fallback={<FlashLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/track" element={<ActiveTrack />} />
                  <Route path="/track-order/:orderId" element={<TrackOrder />} />
                  <Route path="/orders" element={<OrdersPage />} />
                </Routes>
              </Suspense>
            </div>
          </PullToRefresh>
        </Suspense>
      </div>
      {(showNav || isCartOpen || isAuthModalOpen) && <Navbar />}
    </div>
  );
}

function AppContent() {
  // ── Lenis Buttery Smooth Scroll ────────────────────────────────
  const lenisRef = useSmoothScroll();

  // Expose lenis on window so ScrollToTop can call scrollTo(0, immediate)
  useEffect(() => {
    if (lenisRef.current) window.__lenis = lenisRef.current;
    return () => { window.__lenis = null; };
  }, [lenisRef]);

  // ── Aggressive Auto-Update ──────────────────────────────────────
  // Now handled exclusively by AutoUpdater component to show toasts and aggressively clear PWA caches.

  // Prefetch heavy routes after idle
  useEffect(() => {
    const prefetch = () => {
      import('./pages/ProductDetails').catch(() => {});
      import('./pages/Checkout').catch(() => {});
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 3000);
    }
  }, []);

  // Check version on mount and when user returns to the tab — no polling interval
  useEffect(() => {
    let currentVersion = null;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/meta.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json();
        if (!currentVersion) {
          currentVersion = version;
        } else if (currentVersion !== version) {
          try {
            if ('caches' in window) {
              const names = await caches.keys();
              await Promise.all(names.map(n => caches.delete(n)));
            }
          } catch (cacheErr) {
            console.warn('Failed to clear caches before reload:', cacheErr);
          }
          window.location.reload(true);
        }
      } catch (versionErr) {
        console.warn('Version check failed:', versionErr);
      }
    };

    checkVersion();
    const onVisible = () => { if (document.visibilityState === 'visible') checkVersion(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkVersion);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', checkVersion);
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <FCMTokenManager />
      <GlobalAdminListener />
      <Suspense fallback={null}>
        <AutoUpdater />
        <OfflineBanner />
        <MarketingPopup />
        <NotificationToast />
      </Suspense>
      <ErrorBoundary>
        <Routes>
          <Route path="/admin/*" element={<Suspense fallback={<Loader />}><AdminDashboard /></Suspense>} />
          <Route path="*" element={
            <PhoneWrapper>
              <Layout />
            </PhoneWrapper>
          } />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

