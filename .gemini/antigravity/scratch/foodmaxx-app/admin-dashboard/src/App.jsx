import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { OrderAlertProvider } from './context/OrderAlertContext';
import { ToastProvider } from './context/ToastContext';
import { auth } from './firebase/config';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import MobileLayout from './components/MobileLayout';

// ── Lazy page imports ─────────────────────────────────────────────────────────
const Login            = lazy(() => import('./pages/Login'));
const Dashboard        = lazy(() => import('./pages/Dashboard'));
const MobileHome       = lazy(() => import('./pages/MobileHome'));
const LiveOrderFeed    = lazy(() => import('./pages/LiveOrderFeed'));
const Orders           = lazy(() => import('./pages/Orders'));
const MenuManagement   = lazy(() => import('./pages/MenuManagement'));
const ReviewManagement = lazy(() => import('./pages/ReviewManagement'));
const CouponBuilder    = lazy(() => import('./pages/CouponBuilder'));
const UsersManagement  = lazy(() => import('./pages/UsersManagement'));
const RiderManagement  = lazy(() => import('./pages/RiderManagement'));
const AffiliatePayouts = lazy(() => import('./pages/AffiliatePayouts'));
const SupportChat      = lazy(() => import('./pages/SupportChat'));
const MarketingManager = lazy(() => import('./pages/MarketingManager'));
const GlobalSettings   = lazy(() => import('./pages/GlobalSettings'));
const AuditLogs        = lazy(() => import('./pages/AuditLogs'));
const PageBuilder      = lazy(() => import('./pages/PageBuilder'));
const PerformanceCenter = lazy(() => import('./pages/PerformanceCenter'));

// ── Loading spinners ──────────────────────────────────────────────────────────
const PageSpinner = () => (
  <div className="flex-1 flex items-center justify-center min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={28} className="animate-spin text-orange-500" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
    </div>
  </div>
);

const AuthLoader = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
    <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
    <div className="absolute bottom-[-25%] right-[-15%] w-[70%] h-[70%] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl relative z-10">
      <Loader2 size={36} className="animate-spin text-orange-500" />
      <h2 className="text-white font-extrabold text-sm tracking-wide uppercase">Verifying Credentials</h2>
      <p className="text-slate-400 text-xs font-semibold">Connecting to secure gateway...</p>
    </div>
  </div>
);

// ── Auth guard ────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!auth) {
      setUser({ email: 'admin@foodmaxx.com' });
      return;
    }
    const unsub = auth.onAuthStateChanged((u) => setUser(u ?? null));
    return unsub;
  }, []);

  if (user === undefined) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ── Mobile breakpoint hook ────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

// ── Sub-routes shared by both layouts ────────────────────────────────────────
const SUB_ROUTES = [
  { path: 'live-feed',     Page: LiveOrderFeed    },
  { path: 'orders',        Page: Orders           },
  { path: 'menu',          Page: MenuManagement   },
  { path: 'page-builder',  Page: PageBuilder      },
  { path: 'reviews',       Page: ReviewManagement },
  { path: 'coupons',       Page: CouponBuilder    },
  { path: 'users',         Page: UsersManagement  },
  { path: 'riders',        Page: RiderManagement  },
  { path: 'affiliates',    Page: AffiliatePayouts },
  { path: 'support',       Page: SupportChat      },
  { path: 'marketing',     Page: MarketingManager },
  { path: 'settings',      Page: GlobalSettings   },
  { path: 'performance',   Page: PerformanceCenter },
  { path: 'audit-logs',    Page: AuditLogs        },
];

// ── Root app ──────────────────────────────────────────────────────────────────
function App() {
  const isMobile = useIsMobile();

  return (
    <ToastProvider>
      <AppProvider>
        <OrderAlertProvider>
          <HashRouter>
            <Routes>
              {/* Public */}
              <Route
                path="/login"
                element={
                  <Suspense fallback={<AuthLoader />}>
                    <Login />
                  </Suspense>
                }
              />

              {/* Protected — shell switches on viewport */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    {isMobile ? <MobileLayout /> : <Layout />}
                  </ProtectedRoute>
                }
              >
                {/* Home — MobileHome on phone, Dashboard on desktop */}
                <Route
                  index
                  element={
                    <Suspense fallback={<PageSpinner />}>
                      {isMobile ? <MobileHome /> : <Dashboard />}
                    </Suspense>
                  }
                />

                {/* All sub-pages */}
                {SUB_ROUTES.map(({ path, Page }) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <Suspense fallback={<PageSpinner />}>
                        <Page />
                      </Suspense>
                    }
                  />
                ))}
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </OrderAlertProvider>
      </AppProvider>
    </ToastProvider>
  );
}

export default App;
