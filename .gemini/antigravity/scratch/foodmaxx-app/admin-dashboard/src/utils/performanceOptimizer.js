/**
 * FoodMaxx Admin Dashboard Performance Optimizer & Layout Accelerator
 * ------------------------------------------------------------------
 * This script runs at dashboard startup to enforce responsiveness,
 * accelerate table rendering, and prefetch modules during idle times.
 */

(function () {
  if (typeof window === 'undefined') return;

  console.log('⚡ [Admin Performance Optimizer] Installing runtime accelerators...');

  // 1. Passive Event Listener Optimizer (Eliminates mousewheel/touch lag on tables)
  const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
  const originalAddEventListener = window.EventTarget.prototype.addEventListener;

  window.EventTarget.prototype.addEventListener = function (type, listener, options) {
    let opt = options;
    if (passiveEvents.includes(type)) {
      if (typeof opt === 'boolean') {
        opt = { capture: opt, passive: true };
      } else if (typeof opt === 'object') {
        if (opt.passive === undefined) {
          opt = { ...opt, passive: true };
        }
      } else {
        opt = { passive: true };
      }
    }
    return originalAddEventListener.call(this, type, listener, opt);
  };

  // 2. Hardware Acceleration CSS Injection (Forces GPU composite layers for dashboards)
  const injectGPUStyles = () => {
    const style = document.createElement('style');
    style.id = 'admin-perf-gpu-accelerator';
    style.textContent = `
      /* Force GPU rasterization for smooth scrolling lists, sidebars & pages */
      .sidebar,
      .page-builder-content,
      .table-container,
      .order-card,
      .modal-backdrop,
      .modal-content,
      .chart-container,
      main {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
        will-change: transform, opacity;
      }
      /* Optimize rendering in tables and cards */
      table, td, th, div {
        content-visibility: auto;
      }
      /* Keep header and navigation always in hardware layers */
      header, nav {
        transform: translateZ(0);
      }
    `;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectGPUStyles);
  } else {
    injectGPUStyles();
  }

  // 3. Intelligent Chunk Prefetching Engine (Idle-time prediction)
  // Automatically prefetches lazy-loaded Admin routes when idle
  const prefetchChunk = (key) => {
    const prefetcher = window[key];
    if (typeof prefetcher === 'function') {
      try {
        prefetcher();
        console.log(`🚀 [Admin Performance Optimizer] Prefetched page: ${key}`);
      } catch (e) {
        // Suppress silently if fetch fails
      }
    }
  };

  const initPrefetcher = () => {
    // List of prefetch keys mapped in App.jsx
    const prefetchKeys = [
      '__prefetchDashboard',
      '__prefetchOrders',
      '__prefetchLiveOrderFeed',
      '__prefetchMenuManagement',
      '__prefetchPageBuilder',
      '__prefetchPerformanceCenter',
      '__prefetchSupportChat',
      '__prefetchRiderManagement',
      '__prefetchCouponBuilder',
      '__prefetchMarketingManager',
      '__prefetchUsersManagement',
      '__prefetchAffiliatePayouts',
      '__prefetchReviewManagement',
      '__prefetchGlobalSettings',
      '__prefetchAuditLogs'
    ];

    // Use requestIdleCallback to download chunks when CPU is unoccupied
    const schedulePrefetch = () => {
      const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 2500));
      
      idleCallback(() => {
        // Prefetch high-frequency pages first
        const highPriority = ['__prefetchDashboard', '__prefetchOrders', '__prefetchLiveOrderFeed', '__prefetchPageBuilder'];
        highPriority.forEach(prefetchChunk);

        // Defer remaining chunks slightly
        setTimeout(() => {
          idleCallback(() => {
            prefetchKeys
              .filter(key => !highPriority.includes(key))
              .forEach(prefetchChunk);
          });
        }, 2000);
      });
    };

    // Trigger prefetching once page is fully loaded
    if (document.readyState === 'complete') {
      schedulePrefetch();
    } else {
      window.addEventListener('load', schedulePrefetch);
    }
  };

  initPrefetcher();

  // 4. Global Non-Blocking Scheduler (Wraps requestIdleCallback for background operations)
  window.requestIdleWork = (callback, timeout = 3000) => {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(callback, { timeout });
    }
    return setTimeout(callback, 50);
  };

  console.log('✅ [Admin Performance Optimizer] Acceleration active.');
})();
