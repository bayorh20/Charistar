import React, { useContext, useState, useEffect } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import { trackPageView } from './utils/analytics';
import Header from './components/Header';
import MenuSection from './components/MenuSection';
import CartDrawer from './components/CartDrawer';
import InstallPwaBanner from './components/InstallPwaBanner';
import { safeSessionStorage as sessionStorage } from './utils/storage';
import ErrorBoundary from './components/ErrorBoundary';
import { auth } from './firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// A resilient wrapper around React.lazy that handles dynamic import failures (e.g. from network drops or new version deploys)
// and reloads the application to get the latest assets, avoiding blank white screens.
const lazyWithRetry = (componentImport) => React.lazy(async () => {
  const hasRetried = sessionStorage.getItem('fm_retry_lazy');
  try {
    const component = await componentImport();
    sessionStorage.removeItem('fm_retry_lazy');
    return component;
  } catch (error) {
    console.error("Chunk load failure caught:", error);
    
    // CRITICAL: If the user is offline, DO NOT unregister the service worker or reload!
    // Simply throw an error to delegate rendering to the ErrorBoundary.
    if (!navigator.onLine) {
      console.warn("Chunk load failed because user is offline. Propagating error to ErrorBoundary.");
      throw new Error("OfflineChunkLoadError");
    }

    // Check if persistent sessionStorage is available
    const isPersistentSessionStorageAvailable = () => {
      try {
        const key = '__session_storage_test__';
        window.sessionStorage.setItem(key, key);
        window.sessionStorage.removeItem(key);
        return true;
      } catch (e) {
        return false;
      }
    };

    if (!isPersistentSessionStorageAvailable()) {
      console.warn("sessionStorage is not persistent. Skipping reload to avoid loop.");
      throw error;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('r') || window.location.hash.includes('r=1')) {
      console.warn("Recovery reload already attempted. Skipping reload to avoid loop.");
      throw error;
    }

    if (!hasRetried) {
      sessionStorage.setItem('fm_retry_lazy', 'true');
      const separator = window.location.href.indexOf('?') !== -1 ? '&' : '?';
      window.location.href = window.location.href + separator + 'r=1';
    } else {
      console.warn("Retrying chunk load failed again. Flushing service workers...");
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      sessionStorage.removeItem('fm_retry_lazy');
      const separator = window.location.href.indexOf('?') !== -1 ? '&' : '?';
      window.location.href = window.location.href + separator + 'r=1';
    }
    return new Promise(() => {}); // Return a pending promise to prevent rendering crash before reload
  }
});

const ProductModal = lazyWithRetry(() => import('./components/ProductModal'));
const CheckoutModal = lazyWithRetry(() => import('./components/CheckoutModal'));
const OrderTracker = lazyWithRetry(() => import('./components/OrderTracker'));
const ProfilePanel = lazyWithRetry(() => import('./components/ProfilePanel'));
const SearchScreen = lazyWithRetry(() => import('./components/SearchScreen'));
const SupportChat = lazyWithRetry(() => import('./components/SupportChat'));
const OrdersScreen = lazyWithRetry(() => import('./components/OrdersScreen'));
const AffiliateWallet = lazyWithRetry(() => import('./components/AffiliateWallet'));
const RewardsScreen = lazyWithRetry(() => import('./components/RewardsScreen'));

const prefetchProductModal = () => import('./components/ProductModal');
const prefetchCheckoutModal = () => import('./components/CheckoutModal');
const prefetchOrderTracker = () => import('./components/OrderTracker');
const prefetchProfilePanel = () => import('./components/ProfilePanel');
const prefetchSearchScreen = () => import('./components/SearchScreen');
const prefetchOrdersScreen = () => import('./components/OrdersScreen');
const prefetchSupportChat = () => import('./components/SupportChat');
const prefetchAffiliateWallet = () => import('./components/AffiliateWallet');
const prefetchRewardsScreen = () => import('./components/RewardsScreen');

if (typeof window !== 'undefined') {
  window.__prefetchProduct = prefetchProductModal;
  window.__prefetchCheckout = prefetchCheckoutModal;
  window.__prefetchTracker = prefetchOrderTracker;
  window.__prefetchProfile = prefetchProfilePanel;
  window.__prefetchSearch = prefetchSearchScreen;
  window.__prefetchOrders = prefetchOrdersScreen;
  window.__prefetchSupport = prefetchSupportChat;
  window.__prefetchWallet = prefetchAffiliateWallet;
  window.__prefetchRewards = prefetchRewardsScreen;
}

import { Home, Compass, User, ShoppingBag, Heart, ClipboardList, Wallet, Gift, Loader2, Download, Search, WifiOff, ShoppingCart, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTick, playSuccessChime } from './utils/sound';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { getAnimationDef } from './utils/transitionAnimations';

function AppContent() {
  const {
    activeScreen,
    setActiveScreen,
    currentOrder,
    customizingItem,
    setCustomizingItem,
    showProfile,
    setShowProfile,
    showSupport,
    setShowSupport,
    soundEnabled,
    isCartOpen,
    setIsCartOpen,
    cartTotalItems,
    cartSubtotal,
    isLoading,
    refreshApp,
    userProfile,
    registerUser,
    setGuestMode,
    deferredPrompt,
    unreadSupport,
    setUnreadSupport,
    storeConfig,
    marketingConfig,
    cartNotification,
    setCartNotification,
    pageLayout
  } = useContext(AppContext);

  // ── Analytics Page View Tracking ──────────────────────────────────────────
  useEffect(() => {
    let screenName = activeScreen;
    if (showProfile) screenName = 'profile';
    else if (showSupport) screenName = 'support';
    trackPageView(screenName);
  }, [activeScreen, showProfile, showSupport]);

  useEffect(() => {
    if (marketingConfig?.appName) {
      document.title = `${marketingConfig.appName} - ${marketingConfig.appDescription || 'Ibadan Delivery'}`;
    }
  }, [marketingConfig]);

  useEffect(() => {
    if (cartNotification) {
      const timer = setTimeout(() => {
        setCartNotification(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [cartNotification, setCartNotification]);

  useEffect(() => {
    // Remove the reload recovery parameter from query string or hash after a successful mount
    let changed = false;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('r')) {
        url.searchParams.delete('r');
        changed = true;
      }
      if (url.hash.includes('r=1')) {
        url.hash = url.hash.replace(/[?&]r=1|r=1[?&]?/, '');
        changed = true;
      }
      if (changed) {
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        console.log('Cleaned reload flag from URL.');
      }
    } catch (e) {
      console.warn('Failed to clean reload flag:', e);
    }
  }, []);

  const animMode = pageLayout?.animations?.mode || 'Slide';
  const animDuration = pageLayout?.animations?.duration || 0.35;

  const getTransitionVariants = () => {
    const def = getAnimationDef(animMode);
    return def.variants;
  };

  const getTransitionConfig = () => {
    const def = getAnimationDef(animMode);
    if (!def || !def.config) return {};
    const config = JSON.parse(JSON.stringify(def.config));
    
    const animSettings = pageLayout?.animations || {};
    const type = animSettings.type || 'default';
    
    Object.keys(config).forEach(key => {
      if (config[key] && typeof config[key] === 'object') {
        if (type === 'spring') {
          config[key].type = 'spring';
          config[key].stiffness = animSettings.stiffness ?? 320;
          config[key].damping = animSettings.damping ?? 30;
          config[key].mass = animSettings.mass ?? 1;
        } else if (type === 'tween') {
          config[key].type = 'tween';
          config[key].ease = animSettings.ease || 'easeInOut';
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

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update().catch(err => console.warn('PWA SW background update failed:', err));
        }, 30000);
      }
    }
  });

  const [isSplashActive, setIsSplashActive] = useState(false);
  const [pulseBadge, setPulseBadge] = useState(false);
  const [showInstallSuccessToast, setShowInstallSuccessToast] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Firebase Phone Verification States
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verificationError, setVerificationError] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    const handleFocus = (e) => {
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        setIsInputFocused(true);
      }
    };
    const handleBlur = (e) => {
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  useEffect(() => {
    const handleInstallSuccess = (e) => {
      // 1. Play success arpeggio chime & haptics
      playSuccessChime();

      // 2. Trigger web native push notification
      try {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification("🎉 FoodMaxx Installed!", {
              body: "Launch FoodMaxx from your home screen now to start ordering!",
              icon: "/icon-192.png",
              badge: "/icon-192.png"
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification("🎉 FoodMaxx Installed!", {
                  body: "Launch FoodMaxx from your home screen now to start ordering!",
                  icon: "/icon-192.png",
                  badge: "/icon-192.png"
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('Native notification failed:', err);
      }

      // 3. Show our gorgeous native-adapted inside-app Toast alert
      setShowInstallSuccessToast(true);
      
      // Auto-hide the inside-app Toast after 8 seconds
      setTimeout(() => {
        setShowInstallSuccessToast(false);
      }, 8000);
    };

    window.addEventListener('appinstalled', handleInstallSuccess);
    return () => window.removeEventListener('appinstalled', handleInstallSuccess);
  }, []);

  // Initialize Capacitor Native App shell features (StatusBar & Splashscreen)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { StatusBar, SplashScreen } = window.Capacitor.Plugins || {};
        if (StatusBar) {
          // Set style matching our light soft white app theme
          StatusBar.setStyle({ style: 'LIGHT' }).catch(() => {});
          // Allow content to overlay/bleed under status bar for full-screen immersive native feel
          StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        }
        if (SplashScreen) {
          // Hide splash screen immediately on mount
          SplashScreen.hide().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Failed to initialize Capacitor native plugins:', e);
    }
  }, []);

  // Time-Aware Ambient Background State
  const getAmbientClass = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'ambient-morning';
    if (hour >= 12 && hour < 17) return 'ambient-midday';
    return 'ambient-night';
  };
  const [ambientClass, setAmbientClass] = useState(getAmbientClass);

  useEffect(() => {
    const timer = setInterval(() => {
      setAmbientClass(getAmbientClass());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Pull-to-refresh states
  const [pullHeight, setPullHeight] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const mainRef = React.useRef(null);

  // Onboarding & Network states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingSlide, setOnboardingSlide] = useState(1);
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupGender, setSignupGender] = useState('male');
  const [signupError, setSignupError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Reset scroll container position when changing screens
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeScreen]);

  const [prevScreen, setPrevScreen] = useState('home');
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const screenIndices = { home: 0, explore: 1, orders: 2 };
    const prevIdx = screenIndices[prevScreen] !== undefined ? screenIndices[prevScreen] : 0;
    const newIdx = screenIndices[activeScreen] !== undefined ? screenIndices[activeScreen] : 0;
    if (newIdx !== prevIdx) {
      setDirection(newIdx > prevIdx ? 1 : -1);
      setPrevScreen(activeScreen);
    }
  }, [activeScreen, prevScreen]);


  // Physical back button integration (managing history states for popstate)
  const isPopStateRef = React.useRef(false);

  useEffect(() => {
    // Set initial state
    const initialState = {
      screen: activeScreen,
      cartOpen: isCartOpen,
      profileOpen: showProfile,
      customizing: !!customizingItem
    };
    window.history.replaceState(initialState, '');

    const handlePopState = (event) => {
      if (event.state) {
        isPopStateRef.current = true;
        setActiveScreen(event.state.screen || 'home');
        setIsCartOpen(!!event.state.cartOpen);
        setShowProfile(!!event.state.profileOpen);
        if (!event.state.customizing) {
          setCustomizingItem(null);
        }
        setTimeout(() => {
          isPopStateRef.current = false;
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setActiveScreen, setIsCartOpen, setShowProfile, setCustomizingItem]);

  useEffect(() => {
    if (isPopStateRef.current) return;

    const currentState = {
      screen: activeScreen,
      cartOpen: isCartOpen,
      profileOpen: showProfile,
      customizing: !!customizingItem
    };

    const historyState = window.history.state;
    if (!historyState) {
      window.history.replaceState(currentState, '');
      return;
    }

    const closedCart = historyState.cartOpen && !currentState.cartOpen;
    const closedProfile = historyState.profileOpen && !currentState.profileOpen;
    const closedCustomizing = historyState.customizing && !currentState.customizing;
    const closedCheckout = historyState.screen === 'checkout' && currentState.screen !== 'checkout';

    if ((closedCart || closedProfile || closedCustomizing || closedCheckout) && (historyState.screen === currentState.screen)) {
      window.history.back();
    } else {
      if (historyState.screen !== currentState.screen ||
          historyState.cartOpen !== currentState.cartOpen ||
          historyState.profileOpen !== currentState.profileOpen ||
          historyState.customizing !== currentState.customizing) {
        window.history.pushState(currentState, '');
      }
    }
  }, [activeScreen, isCartOpen, showProfile, customizingItem]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Response expired
        }
      });
    }
  };

  const handleRegisterSubmit = async () => {
    if (!signupName.trim() || !signupPhone.trim()) {
      setSignupError('Please enter both your name and phone number.');
      return;
    }
    if (signupPhone.trim().length < 8) {
      setSignupError('Please enter a valid phone number.');
      return;
    }
    setSignupError('');

    // If Firebase Auth is not active, skip verification (mock mode / fallback)
    if (!auth) {
      console.warn("Firebase Auth not initialized. Registering user locally.");
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const canInstall = !!deferredPrompt || isIOS;
      if (!isStandalone && canInstall) {
        setOnboardingStep(2);
      } else {
        registerUser(signupName.trim(), signupPhone.trim(), signupGender);
      }
      return;
    }

    setIsSendingSms(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Normalize to E.164 (Nigeria country code +234)
      let normalizedPhone = signupPhone.trim();
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+234' + normalizedPhone.slice(1);
      } else if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+234' + normalizedPhone;
      }
      
      const confirmation = await signInWithPhoneNumber(auth, normalizedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOnboardingStep('otp');
    } catch (error) {
      console.error("SMS Send Error:", error);
      const code = error?.code || '';
      let msg = 'Failed to send SMS. ';
      if (code === 'auth/invalid-phone-number') msg += 'Invalid phone number format.';
      else if (code === 'auth/too-many-requests') msg += 'Too many attempts — try again later.';
      else if (code === 'auth/captcha-check-failed') msg += 'reCAPTCHA failed — try again.';
      else if (code === 'auth/quota-exceeded') msg += 'SMS quota exceeded.';
      else if (code === 'auth/network-request-failed') msg += 'No internet connection.';
      else msg += `[${code || error.message}]`;
      setSignupError(msg);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setIsSendingSms(false);
    }
  };

  const verifyOtpCode = async () => {
    if (!confirmationResult) return;
    setIsVerifyingOtp(true);
    setVerificationError('');
    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      
      // Successfully authenticated! Go to install step or register directly
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const canInstall = !!deferredPrompt || isIOS;
      
      if (!isStandalone && canInstall) {
        setOnboardingStep(2);
      } else {
        registerUser(signupName.trim(), signupPhone.trim(), signupGender, user.uid);
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      setVerificationError('Invalid verification code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleFinishRegistration = () => {
    const userUid = auth?.currentUser?.uid || null;
    registerUser(signupName.trim(), signupPhone.trim(), signupGender, userUid);
  };

  const handleGuestExplore = () => {
    setGuestMode();
  };

  const handleOnboardingInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      const userUid = auth?.currentUser?.uid || null;
      registerUser(signupName.trim(), signupPhone.trim(), signupGender, userUid);
    }
  };

  // Optimized, non-blocking Pull-to-refresh gesture listeners (100% passive to prevent touch latency)
  useEffect(() => {
    const mainEl = mainRef.current;
    if (!mainEl) return;

    let startY = 0;
    let pullHeightVal = 0;
    let isPullingActive = false;

    const onTouchMove = (e) => {
      if (!isPullingActive) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;

      if (diffY > 0) {
        // Apply a gentle exponential dampening factor for a premium feel
        const calculatedHeight = Math.min(80, Math.pow(diffY, 0.8));
        pullHeightVal = calculatedHeight;
        setPullHeight(calculatedHeight);
      }
    };

    const onTouchEnd = () => {
      mainEl.removeEventListener('touchmove', onTouchMove);
      mainEl.removeEventListener('touchend', onTouchEnd);
      mainEl.removeEventListener('touchcancel', onTouchEnd);

      if (isPullingActive) {
        setIsPulling(false);
        isPullingActive = false;
        
        if (pullHeightVal >= 45) {
          setPullHeight(45);
          refreshApp(600);
        } else {
          setPullHeight(0);
        }
      }
    };

    const onTouchStart = (e) => {
      // Ignore if not on Home screen or inside modals/cart/profile
      if (activeScreen !== 'home' || customizingItem || isCartOpen || showProfile || activeScreen === 'checkout') return;

      // Only activate if we are at the absolute top of the container
      if (mainEl.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pullHeightVal = 0;
        isPullingActive = true;
        setIsPulling(true);

        // Attach move and end handlers with passive: true so they never block native scrolling
        mainEl.addEventListener('touchmove', onTouchMove, { passive: true });
        mainEl.addEventListener('touchend', onTouchEnd, { passive: true });
        mainEl.addEventListener('touchcancel', onTouchEnd, { passive: true });
      }
    };

    mainEl.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      mainEl.removeEventListener('touchstart', onTouchStart);
      mainEl.removeEventListener('touchmove', onTouchMove);
      mainEl.removeEventListener('touchend', onTouchEnd);
      mainEl.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [activeScreen, customizingItem, isCartOpen, showProfile, refreshApp]);

  // Hide indicator when loading completes
  useEffect(() => {
    if (!isLoading) {
      setPullHeight(0);
    }
  }, [isLoading]);



  useEffect(() => {
    if (cartTotalItems > 0) {
      // Delay by 800ms to perfectly align with the parabolic landing!
      const delayTimer = setTimeout(() => {
        setPulseBadge(true);
        const resetTimer = setTimeout(() => setPulseBadge(false), 300);
        return () => clearTimeout(resetTimer);
      }, 800);
      return () => clearTimeout(delayTimer);
    }
  }, [cartTotalItems]);

  const handleTabClick = (screenName) => {
    if (screenName === 'profile') {
      setShowProfile(prev => !prev);
      setIsCartOpen(false);
      setShowSupport(false);
    } else if (screenName === 'support') {
      setShowSupport(prev => !prev);
      setIsCartOpen(false);
      setShowProfile(false);
      setUnreadSupport(false);
    } else if (screenName === 'cart') {
      setIsCartOpen(prev => !prev);
      setShowProfile(false);
      setShowSupport(false);
    } else {
      setShowProfile(false);
      setShowSupport(false);
      setIsCartOpen(false);
      setActiveScreen(screenName);
    }
    playTick(soundEnabled);
  };

  let activeTabIndex = 0;
  if (showProfile) {
    activeTabIndex = 4;
  } else if (showSupport) {
    activeTabIndex = 3;
  } else if (activeScreen === 'explore') {
    activeTabIndex = 1;
  } else if (activeScreen === 'orders') {
    activeTabIndex = 2;
  } else {
    activeTabIndex = 0;
  }

  const isAnyModalOpen = isCartOpen || showProfile || showSupport || activeScreen === 'checkout' || customizingItem;

  return (
    <div className="app-viewport">
      {/* Hidden SVG for liquid tab morph gooey filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          <filter id="gooey-nav" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
          </filter>
        </defs>
      </svg>



      {/* Main Native Phone Mockup Container */}
      <div className="phone-wrapper">
        <div className="phone-notch-bar"></div>
        
        <div className={`phone-screen ${ambientClass}`} style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
          {/* Ambient Background Mesh Blobs */}
          <div className="ambient-mesh-bg">
            <div className="ambient-blob blob-1"></div>
            <div className="ambient-blob blob-2"></div>
            <div className="ambient-blob blob-3"></div>
          </div>

          {/* Offline Warning Banner */}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  color: '#EF4444',
                  borderBottom: '1px solid rgba(239, 68, 68, 0.18)',
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  zIndex: 9999,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
                }}
              >
                <WifiOff size={14} style={{ strokeWidth: 2.5 }} />
                <span>Connection lost. Operating in offline mode.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome/Registration Screen Overlay */}
          <AnimatePresence>
            {!isSplashActive && !userProfile.registered && !userProfile.isGuest && (
              <motion.div
                className="welcome-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--bg-app)',
                  zIndex: 1500,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '24px',
                  boxSizing: 'border-box',
                  overflowY: 'auto'
                }}
              >
                {/* Floating Mesh Gradient Background Blobs */}
                <div className="onboarding-bg-blobs">
                  <div className="bg-glow-blob blob-orange"></div>
                  <div className="bg-glow-blob blob-purple"></div>
                  <div className="bg-glow-blob blob-yellow"></div>
                </div>

                <div className="onboarding-glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '32px 20px', position: 'relative', zIndex: 10, margin: 'auto 0' }}>
                  {onboardingStep === 1 ? (
                    <>
                      {/* Walkthrough Slide 1 */}
                      {onboardingSlide === 1 && (
                        <motion.div
                          key="slide-1"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                          <div className="onboarding-graphic">
                            <svg viewBox="0 0 100 100" className="graphic-float" style={{ width: '90px', height: '90px' }}>
                              <defs>
                                <linearGradient id="dishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="var(--primary)" />
                                  <stop offset="100%" stopColor="#FF8A65" />
                                </linearGradient>
                                <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.1" />
                                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.8" />
                                </linearGradient>
                              </defs>
                              <path d="M20,65 C20,35 80,35 80,65 Z" fill="url(#dishGrad)" filter="drop-shadow(0 8px 16px rgba(255,91,38,0.3))" />
                              <path d="M15,65 L85,65 A4,4 0 0,1 89,69 L11,69 A4,4 0 0,1 15,65 Z" fill="#E0DCD5" />
                              <circle cx="50" cy="33" r="5" fill="#FFB74D" />
                              <path d="M42,25 Q38,15 42,5 Q46,15 42,25" fill="none" stroke="url(#steamGrad)" strokeWidth="3" strokeLinecap="round" />
                              <path d="M50,22 Q46,12 50,2 Q54,12 50,22" fill="none" stroke="url(#steamGrad)" strokeWidth="3" strokeLinecap="round" />
                              <path d="M58,25 Q54,15 58,5 Q62,15 58,25" fill="none" stroke="url(#steamGrad)" strokeWidth="3" strokeLinecap="round" />
                              <line x1="5" y1="45" x2="15" y2="45" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
                              <line x1="-2" y1="55" x2="12" y2="55" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                              <line x1="8" y1="35" x2="16" y2="35" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                            </svg>
                            <div className="graphic-glow"></div>
                          </div>
                          
                          <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 10px 0', lineHeight: 1.25 }}>
                            {new Date().getHours() >= 6 && new Date().getHours() < 12 ? 'Good Morning ☀️' : new Date().getHours() >= 12 && new Date().getHours() < 17 ? 'Good Afternoon 🍔' : 'Good Evening 🍕'}
                          </h2>
                          <h3 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 10px 0' }}>
                            Gourmet Meals Delivered Fast
                          </h3>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, lineHeight: 1.45, padding: '0 8px' }}>
                            Order from the finest local kitchens in Ibadan and get it delivered hot, fresh, and on time.
                          </p>
                        </motion.div>
                      )}

                      {/* Walkthrough Slide 2 */}
                      {onboardingSlide === 2 && (
                        <motion.div
                          key="slide-2"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                          <div className="onboarding-graphic">
                            <svg viewBox="0 0 100 100" className="graphic-float" style={{ width: '90px', height: '90px' }}>
                              <defs>
                                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#FFD54F" />
                                  <stop offset="50%" stopColor="#FFB300" />
                                  <stop offset="100%" stopColor="#FF8F00" />
                                </linearGradient>
                                <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#B388FF" />
                                  <stop offset="100%" stopColor="#6200EA" />
                                </linearGradient>
                              </defs>
                              <rect x="15" y="25" width="70" height="46" rx="10" fill="url(#purpleGrad)" transform="rotate(-6 50 48)" filter="drop-shadow(0 10px 20px rgba(98,0,234,0.25))" />
                              <circle cx="32" cy="42" r="8" fill="#FFF" opacity="0.15" />
                              <rect x="25" y="56" width="30" height="6" rx="3" fill="#FFF" opacity="0.3" />
                              <g transform="translate(68, 20)">
                                <circle cx="0" cy="0" r="14" fill="url(#goldGrad)" filter="drop-shadow(0 4px 8px rgba(255,179,0,0.4))" />
                                <text x="0" y="5" fontFamily="var(--font-accent)" fontSize="14" fontWeight="900" fill="#FFF" textAnchor="middle">₦</text>
                              </g>
                              <g transform="translate(18, 62) scale(0.75)">
                                <circle cx="0" cy="0" r="14" fill="url(#goldGrad)" filter="drop-shadow(0 4px 8px rgba(255,179,0,0.4))" />
                                <text x="0" y="5" fontFamily="var(--font-accent)" fontSize="14" fontWeight="900" fill="#FFF" textAnchor="middle">₦</text>
                              </g>
                              <g transform="translate(76, 68) scale(0.6)">
                                <circle cx="0" cy="0" r="14" fill="url(#goldGrad)" filter="drop-shadow(0 4px 8px rgba(255,179,0,0.4))" />
                                <text x="0" y="5" fontFamily="var(--font-accent)" fontSize="14" fontWeight="900" fill="#FFF" textAnchor="middle">₦</text>
                              </g>
                            </svg>
                            <div className="graphic-glow" style={{ background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)' }}></div>
                          </div>
                          
                          <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 10px 0', lineHeight: 1.25 }}>
                            Delicious Rewards 🎁
                          </h2>
                          <h3 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 10px 0' }}>
                            Cashback & Referral Bonuses
                          </h3>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, lineHeight: 1.45, padding: '0 8px' }}>
                            Get reward points on every single order and build your affiliate wallet balance by inviting your friends.
                          </p>
                        </motion.div>
                      )}

                      {/* Walkthrough Slide 3 (Signup Form) */}
                      {onboardingSlide === 3 && (
                        <motion.div
                          key="slide-3"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                          style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
                        >
                          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img loading="lazy" decoding="async" 
                              src="/icon-192.png" 
                              alt="FoodMaxx Logo" 
                              style={{ width: '56px', height: '56px', borderRadius: '14px', marginBottom: '10px', boxShadow: '0 4px 12px rgba(255, 91, 38, 0.2)' }} 
                            />
                            <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                              Get Started with FoodMaxx
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                              Sign up now and get <span style={{ color: 'var(--primary)', fontWeight: 800 }}>₦1,000 off</span> your first order!
                            </p>
                          </div>
                          
                          {/* Signup Form Fields */}
                          <div className="onboarding-form-block">
                            <div>
                              <label className="onboarding-label">
                                Your Name
                              </label>
                              <input
                                type="text"
                                placeholder="Input your name"
                                value={signupName}
                                onChange={(e) => setSignupName(e.target.value)}
                                className="onboarding-input"
                              />
                            </div>
                            
                            <div>
                              <label className="onboarding-label">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                placeholder="Input your phone number"
                                value={signupPhone}
                                onChange={(e) => setSignupPhone(e.target.value)}
                                className="onboarding-input"
                              />
                            </div>

                            <div>
                              <label className="onboarding-label">
                                Gender
                              </label>
                              <div className="onboarding-gender-row" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  type="button"
                                  className={`onboarding-gender-btn ${signupGender === 'male' ? 'active' : ''}`}
                                  onClick={() => setSignupGender('male')}
                                  style={{
                                    flex: 1,
                                    background: signupGender === 'male' ? 'var(--primary)' : 'var(--bg-input)',
                                    color: signupGender === 'male' ? '#FFFFFF' : 'var(--text-main)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  👦 Male
                                </button>
                                <button
                                  type="button"
                                  className={`onboarding-gender-btn ${signupGender === 'female' ? 'active' : ''}`}
                                  onClick={() => setSignupGender('female')}
                                  style={{
                                    flex: 1,
                                    background: signupGender === 'female' ? 'var(--primary)' : 'var(--bg-input)',
                                    color: signupGender === 'female' ? '#FFFFFF' : 'var(--text-main)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  👩 Female
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Invisible reCAPTCHA Anchor */}
                      <div id="recaptcha-container"></div>
                      
                      {signupError && onboardingSlide === 3 && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#EF4444', fontWeight: 700, textAlign: 'center' }}>
                          ⚠️ {signupError}
                        </p>
                      )}
                      
                      {/* Carousel Indicator Dots */}
                      <div className="carousel-dots">
                        <span onClick={() => { setOnboardingSlide(1); playTick(soundEnabled); }} className={`carousel-dot ${onboardingSlide === 1 ? 'active' : ''}`}></span>
                        <span onClick={() => { setOnboardingSlide(2); playTick(soundEnabled); }} className={`carousel-dot ${onboardingSlide === 2 ? 'active' : ''}`}></span>
                        <span onClick={() => { setOnboardingSlide(3); playTick(soundEnabled); }} className={`carousel-dot ${onboardingSlide === 3 ? 'active' : ''}`}></span>
                      </div>

                      {/* Navigation Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                        <button
                          onClick={() => {
                            if (onboardingSlide < 3) {
                              setOnboardingSlide(onboardingSlide + 1);
                              playTick(soundEnabled);
                            } else {
                              handleRegisterSubmit();
                            }
                          }}
                          className="onboarding-btn-primary"
                          disabled={isSendingSms}
                        >
                          {isSendingSms ? 'Sending SMS...' : onboardingSlide === 3 ? 'Sign Up & Get Bonus' : 'Next'}
                        </button>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', width: '100%', minHeight: '32px' }}>
                          {onboardingSlide > 1 ? (
                            <button
                              onClick={() => {
                                setOnboardingSlide(onboardingSlide - 1);
                                playTick(soundEnabled);
                              }}
                              className="onboarding-btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700 }}
                            >
                              ← Back
                            </button>
                          ) : (
                            <div />
                          )}
                          
                          <button
                            onClick={handleGuestExplore}
                            className="onboarding-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'underline' }}
                          >
                            Explore as Guest
                          </button>
                        </div>
                      </div>
                    </>
                  ) : onboardingStep === 'otp' ? (
                    <>
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '12px' }}>🔒</span>
                        <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                          Verify Your Phone
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                          We sent a 6-digit verification code to <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{signupPhone}</span>
                        </p>
                      </div>
                      
                      <div className="onboarding-form-block">
                        <div>
                          <label className="onboarding-label" style={{ textAlign: 'center', display: 'block' }}>
                            Verification Code (OTP)
                          </label>
                          <input
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="onboarding-input"
                            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.4rem', fontWeight: 900 }}
                          />
                        </div>
                      </div>
                      
                      {verificationError && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#EF4444', fontWeight: 700, textAlign: 'center' }}>
                          ⚠️ {verificationError}
                        </p>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                          onClick={verifyOtpCode}
                          className="onboarding-btn-primary"
                          disabled={otpCode.length !== 6 || isVerifyingOtp}
                        >
                          {isVerifyingOtp ? 'Verifying OTP...' : 'Verify & Continue'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setOnboardingStep(1);
                            setOtpCode('');
                            setVerificationError('');
                          }}
                          className="onboarding-btn-secondary"
                        >
                          Edit Phone Number
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '12px' }}>📱</span>
                        <h2 style={{ fontFamily: 'var(--font-accent)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                          Install FoodMaxx App to your phone
                        </h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                          Install Foodmaxx App for Quick Orders
                        </p>
                      </div>

                      {/* Device-Specific PWA Instructions */}
                      <div className="onboarding-form-block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {deferredPrompt ? (
                          // Android / Chrome direct install available
                          <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600, margin: '0 0 16px 0' }}>
                              Click below to install directly on your Android phone or Chromebook.
                            </p>
                            <button
                              onClick={handleOnboardingInstallClick}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--text-main)',
                                color: 'var(--bg-card)',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '10px 20px',
                                fontSize: '0.82rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                              }}
                            >
                              <Download size={16} />
                              <span>Install FoodMaxx</span>
                            </button>
                          </div>
                        ) : (
                          // Safari / iOS instructions
                          <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              On iPhone (Safari):
                            </p>
                            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <li>Tap the <strong>Share</strong> button (📤) in Safari.</li>
                              <li>Scroll down and select <strong>Add to Home Screen</strong> (➕).</li>
                              <li>Confirm by clicking <strong>Add</strong> at the top right.</li>
                            </ol>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                          onClick={handleFinishRegistration}
                          className="onboarding-btn-primary"
                        >
                          Finish & Enter App
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Header (Only render on main screens when user is registered or in guest mode) */}
          {activeScreen === 'home' && (userProfile.registered || userProfile.isGuest) && (
            <Header onCartOpen={() => setIsCartOpen(prev => !prev)} />
          )}

          {/* Pull-To-Refresh Indicator */}
          {activeScreen === 'home' && (pullHeight > 0 || isLoading) && (
            <div 
              className="pull-to-refresh-indicator"
              style={{
                transform: `translate3d(-50%, ${pullHeight - 45}px, 0)`,
                opacity: Math.min(1, pullHeight / 45),
                transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s'
              }}
            >
              <div className="refresher-circle">
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
                ) : (
                  <span style={{ transform: `rotate(${pullHeight * 6}deg)`, display: 'inline-block', fontSize: '1.2rem' }}>
                    🥗
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Core Scrollable Content */}
          <motion.main 
            ref={mainRef}
            className={`screen-scroll-content ${activeScreen !== 'home' ? 'no-header-offset' : ''} ${customizingItem || isCartOpen || showProfile || activeScreen === 'checkout' ? 'no-scroll' : ''}`}
            animate={{
              scale: isAnyModalOpen ? 0.93 : 1,
              rotateX: isAnyModalOpen ? 6 : 0,
              y: isAnyModalOpen ? 10 : 0,
              z: isAnyModalOpen ? -120 : 0
            }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={{ 
              transformStyle: 'preserve-3d',
              transformOrigin: 'top center'
            }}
          >
            <div 
              className="screen-active-container" 
              style={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                perspective: '1200px',
                transformStyle: 'preserve-3d'
              }}
            >
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                  key={activeScreen}
                  custom={direction}
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
                    willChange: 'transform, opacity'
                  }}
                >
                  <React.Suspense fallback={null}>
                    {activeScreen === 'home' && <MenuSection />}
                    {activeScreen === 'explore' && <SearchScreen />}
                    {activeScreen === 'orders' && <OrdersScreen />}
                  </React.Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.main>

          {/* Checkout Screen Overlay (Renders full screen inside viewport) */}
          <AnimatePresence>
            {activeScreen === 'checkout' && (
              <React.Suspense fallback={null}>
                <CheckoutModal />
              </React.Suspense>
            )}
          </AnimatePresence>

           {/* PWA Success Install Toast Overlay */}
           <AnimatePresence>
             {showInstallSuccessToast && (
               <motion.div
                 initial={{ y: -100, x: '-50%', opacity: 0 }}
                 animate={{ y: 20, x: '-50%', opacity: 1 }}
                 exit={{ y: -100, x: '-50%', opacity: 0 }}
                 transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                 style={{
                   position: 'fixed',
                   top: 'env(safe-area-inset-top, 0px)',
                   left: '50%',
                   width: 'calc(100% - 32px)',
                   maxWidth: '358px',
                   zIndex: 999999,
                   backgroundColor: 'rgba(16, 185, 129, 0.95)',
                   backdropFilter: 'blur(16px)',
                   WebkitBackdropFilter: 'blur(16px)',
                   borderRadius: '20px',
                   boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
                   border: '1px solid rgba(255, 255, 255, 0.2)',
                   padding: '14px 16px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '12px',
                   color: '#FFFFFF'
                 }}
               >
                 <div style={{
                   width: '28px',
                   height: '28px',
                   borderRadius: '50%',
                   backgroundColor: 'rgba(255, 255, 255, 0.2)',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   flexShrink: 0
                 }}>
                   <Download size={14} strokeWidth={3} />
                 </div>
                 <div style={{ flex: 1, textAlign: 'left' }}>
                   <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '900' }}>App Installed Successfully! 🎉</h5>
                   <p style={{ margin: '2px 0 0 0', fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600', lineHeight: 1.35 }}>
                     Launch <strong>FoodMaxx</strong> from your home screen now to start ordering!
                   </p>
                 </div>
                 <button
                   onClick={() => setShowInstallSuccessToast(false)}
                   style={{
                     background: 'rgba(255,255,255,0.15)',
                     border: 'none',
                     borderRadius: '50%',
                     width: '24px',
                     height: '24px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: '#fff',
                     cursor: 'pointer'
                   }}
                 >
                   <X size={12} strokeWidth={3} />
                 </button>
               </motion.div>
             )}
           </AnimatePresence>

           <InstallPwaBanner />

          {/* Interactive Modal Drawer sheets */}
          <React.Suspense fallback={null}>
            <ProductModal />
          </React.Suspense>
          <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
          <React.Suspense fallback={null}>
            <ProfilePanel />
            <SupportChat />
          </React.Suspense>

          {/* Added to Cart Toast Notification */}
          <AnimatePresence>
            {cartNotification && (
              <motion.div
                key={cartNotification.id}
                initial={{ y: -100, x: '-50%', opacity: 0 }}
                animate={{ y: 20, x: '-50%', opacity: 1 }}
                exit={{ y: -100, x: '-50%', opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                onClick={() => {
                  setIsCartOpen(true);
                  setCartNotification(null);
                }}
                style={{
                  position: 'absolute',
                  top: 'env(safe-area-inset-top, 0px)',
                  left: '50%',
                  width: 'calc(100% - 32px)',
                  maxWidth: '358px',
                  zIndex: 99999,
                  backgroundColor: 'rgba(15, 23, 42, 0.93)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <img loading="lazy" decoding="async" 
                  src={cartNotification.image || '/icon-192.png'} 
                  alt={cartNotification.name} 
                  style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Added to Cart!</h5>
                  <p style={{ margin: '1px 0 0 0', fontSize: '13px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cartNotification.name}
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#FFFFFF', backgroundColor: 'var(--primary)', padding: '6px 12px', borderRadius: '12px', flexShrink: 0 }}>
                  View Cart ➔
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Native Sticky Bottom Navigation Bar */}
          {(userProfile.registered || userProfile.isGuest) && (
            <nav className={`bottom-nav ${customizingItem || activeScreen === 'checkout' || isInputFocused ? 'nav-hidden' : ''}`}>
              {/* Gooey Underlay Layer */}
              <div className="bottom-nav-gooey-container">
                <div className="gooey-anchor" style={{ left: '10%' }}></div>
                <div className="gooey-anchor" style={{ left: '30%' }}></div>
                <div className="gooey-anchor" style={{ left: '50%' }}></div>
                <div className="gooey-anchor" style={{ left: '70%' }}></div>
                <div className="gooey-anchor" style={{ left: '90%' }}></div>
                <div className="gooey-bubble-slider" style={{ left: `${10 + activeTabIndex * 20}%` }}></div>
              </div>

              {/* 1. Home */}
              <button
                className={`nav-tab ${activeScreen === 'home' && !showProfile && !isCartOpen && !showSupport ? 'active' : ''}`}
                onClick={() => handleTabClick('home')}
              >
                <div className="nav-tab-content">
                  <div className="nav-tab-icon-wrapper">
                    <Home size={20} />
                  </div>
                  <span className="nav-tab-label">Home</span>
                </div>
              </button>

              {/* 2. Search */}
              <button
                className={`nav-tab ${activeScreen === 'explore' && !showProfile && !isCartOpen && !showSupport ? 'active' : ''}`}
                onClick={() => handleTabClick('explore')}
                onMouseEnter={prefetchSearchScreen}
                onTouchStart={prefetchSearchScreen}
              >
                <div className="nav-tab-content">
                  <div className="nav-tab-icon-wrapper">
                    <Search size={20} />
                  </div>
                  <span className="nav-tab-label">Search</span>
                </div>
              </button>

              {/* 4. Orders */}
              <button
                className={`nav-tab ${activeScreen === 'orders' && !showProfile && !isCartOpen && !showSupport ? 'active' : ''}`}
                onClick={() => handleTabClick('orders')}
                onMouseEnter={prefetchOrdersScreen}
                onTouchStart={prefetchOrdersScreen}
              >
                <div className="nav-tab-content">
                  <div className="nav-tab-icon-wrapper">
                    <ClipboardList size={20} />
                  </div>
                  <span className="nav-tab-label">Orders</span>
                </div>
              </button>

              {/* Support */}
              <button
                className={`nav-tab ${showSupport ? 'active' : ''}`}
                onClick={() => handleTabClick('support')}
                onMouseEnter={prefetchSupportChat}
                onTouchStart={prefetchSupportChat}
              >
                <div className="nav-tab-content">
                  <div className="nav-tab-icon-wrapper" style={{ position: 'relative' }}>
                    <MessageSquare size={20} fill={showSupport ? "currentColor" : "none"} />
                    {unreadSupport && (
                      <span className="support-nav-badge" />
                    )}
                  </div>
                  <span className="nav-tab-label">Support</span>
                </div>
              </button>

              {/* 5. Profile */}
              <button
                className={`nav-tab ${showProfile ? 'active' : ''}`}
                onClick={() => handleTabClick('profile')}
                onMouseEnter={prefetchProfilePanel}
                onTouchStart={prefetchProfilePanel}
              >
                <div className="nav-tab-content">
                  <div className="nav-tab-icon-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' }}>
                    {userProfile.photo && (userProfile.photo.startsWith('/') || userProfile.photo.includes('.')) ? (
                      <img loading="lazy" decoding="async" 
                        src={userProfile.photo} 
                        alt="Profile" 
                        style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          objectFit: 'cover', 
                          border: 'none',
                          boxShadow: 'none',
                          boxSizing: 'border-box',
                          display: 'block',
                          transition: 'all 0.2s ease',
                          backgroundColor: '#FFFFFF',
                          filter: 'brightness(1.08) contrast(1.02)'
                        }} 
                      />
                    ) : (
                      <User size={32} fill={showProfile ? "currentColor" : "none"} />
                    )}
                    {currentOrder && currentOrder.statusIndex < 4 && (
                      <span className="nav-badge-alert">!</span>
                    )}
                  </div>
                </div>
              </button>
            </nav>
          )}

          {/* PWA Update Toast Notification Prompt */}
          <AnimatePresence>
            {needRefresh && (
              <motion.div
                className="pwa-update-toast"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className="pwa-update-content">
                  <div className="pwa-update-icon">🚀</div>
                  <div className="pwa-update-text">
                    <span className="pwa-update-title">Update Available!</span>
                    <span className="pwa-update-desc">A new version of FoodMaxx is ready.</span>
                  </div>
                </div>
                <div className="pwa-update-actions">
                  <button className="pwa-update-btn primary" onClick={() => updateServiceWorker(true)}>
                    Update
                  </button>
                  <button className="pwa-update-btn secondary" onClick={() => setNeedRefresh(false)}>
                    Later
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bottom-nav.nav-hidden {
          transform: translateY(100%);
          opacity: 0;
          pointer-events: none;
        }

        .floating-cart-capsule {
          position: absolute;
          bottom: calc(96px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          z-index: 990;
          background: var(--primary) !important;
          border: none !important;
          border-radius: 40px !important;
          padding: 12px 24px !important;
          box-shadow: 0 8px 24px rgba(255, 91, 38, 0.3) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-sizing: border-box;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .dark-mode .floating-cart-capsule {
          background: var(--primary) !important;
          box-shadow: 0 8px 24px rgba(255, 109, 59, 0.35) !important;
        }
        .floating-cart-pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 40px;
          background: var(--primary);
          opacity: 0;
          z-index: -1;
          pointer-events: none;
          animation: cart-ring-pulse 2s infinite cubic-bezier(0.25, 0, 0, 1);
        }
        @keyframes cart-ring-pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.75;
            box-shadow: 0 0 0 0 rgba(255, 91, 38, 0.7);
          }
          40% {
            transform: scale(1.06);
            opacity: 0.55;
            box-shadow: 0 0 0 8px rgba(255, 91, 38, 0);
          }
          100% {
            transform: scale(1.18);
            opacity: 0;
            box-shadow: 0 0 0 16px rgba(255, 91, 38, 0);
          }
        }
        .floating-cart-content {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-accent);
          font-weight: 900;
          font-size: 0.88rem;
          color: #FFFFFF !important;
        }
        .dark-mode .floating-cart-content {
          color: #FFFFFF !important;
        }
        .floating-cart-divider {
          opacity: 0.35;
        }
        .floating-cart-arrow {
          margin-left: 2px;
        }
      `}} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}

export default App;
