import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ── Icon + colour maps ────────────────────────────────────────────────────────
const CONFIG = {
  success: {
    icon: CheckCircle2,
    bar:  'bg-green-500',
    bg:   'bg-white dark:bg-slate-800 border-green-200 dark:border-green-500/30',
    icon_color: 'text-green-500',
    title_color: 'text-green-700 dark:text-green-400',
  },
  error: {
    icon: XCircle,
    bar:  'bg-red-500',
    bg:   'bg-white dark:bg-slate-800 border-red-200 dark:border-red-500/30',
    icon_color: 'text-red-500',
    title_color: 'text-red-700 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bar:  'bg-amber-500',
    bg:   'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-500/30',
    icon_color: 'text-amber-500',
    title_color: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    icon: Info,
    bar:  'bg-blue-500',
    bg:   'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-500/30',
    icon_color: 'text-blue-500',
    title_color: 'text-blue-700 dark:text-blue-400',
  },
};

// ── Single Toast card ─────────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
  const cfg = CONFIG[toast.type] || CONFIG.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,   scale: 1     }}
      exit={{    opacity: 0, y: -16,  scale: 0.9   }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className={`relative flex items-start gap-3 w-full max-w-sm rounded-2xl border shadow-xl shadow-black/10 px-4 py-3.5 overflow-hidden ${cfg.bg}`}
    >
      {/* Left colour bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-2xl`} />

      {/* Icon */}
      <Icon size={20} className={`shrink-0 mt-0.5 ${cfg.icon_color}`} />

      {/* Text */}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <p className={`font-black text-sm leading-tight ${cfg.title_color}`}>{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 transition-colors p-0.5"
      >
        <X size={14} />
      </button>

      {/* Auto-progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-40`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type, title, message, duration = 4000) => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [{ id, type, title, message, duration }, ...prev].slice(0, 6));
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Convenience helpers
  const success = useCallback((title, msg, dur)  => toast('success', title, msg, dur),  [toast]);
  const error   = useCallback((title, msg, dur)  => toast('error',   title, msg, dur),  [toast]);
  const warning = useCallback((title, msg, dur)  => toast('warning', title, msg, dur),  [toast]);
  const info    = useCallback((title, msg, dur)  => toast('info',    title, msg, dur),  [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}

      {/* ── Toast portal — top-right on desktop, top-center on mobile ── */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto w-full sm:w-auto">
              <Toast toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
