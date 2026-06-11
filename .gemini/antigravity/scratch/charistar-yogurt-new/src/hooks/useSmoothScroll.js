import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * useSmoothScroll
 * ───────────────
 * Initialises Lenis for buttery-smooth, physics-based scrolling.
 * - lerp: 0.085 → silky deceleration (lower = more butter, higher = snappier)
 * - smoothWheel: true → desktop mouse-wheel also gets smoothed
 * - touchMultiplier: 1.8 → slightly amplified touch momentum on mobile
 *
 * Integrates with framer-motion: forwards Lenis scroll events so that
 * framer's `whileInView` and `useScroll` still fire correctly.
 */
export function useSmoothScroll() {
  const lenisRef = useRef(null);
  const { animationsEnabled } = useTheme();

  useEffect(() => {
    // Disable on mobile devices to prevent sluggishness
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (!animationsEnabled || isMobile) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    let lenis;
    let rafId;

    const init = async () => {
      try {
        const { default: Lenis } = await import('lenis');

        lenis = new Lenis({
          lerp: 0.085,            // Physics interpolation — the magic butter knob
          smoothWheel: true,      // Smooth mouse-wheel on desktop
          touchMultiplier: 1.8,   // Extra momentum on touch screens
          infinite: false,
          gestureOrientation: 'vertical',
          normalizeWheel: true,   // Normalise cross-browser wheel delta
          syncTouch: false,       // Let native touch handle itself (prevents conflicts on iOS)
        });

        lenisRef.current = lenis;

        // Keep framer-motion's scroll tracking in sync with Lenis
        lenis.on('scroll', ({ scroll, progress }) => {
          // Dispatch a synthetic scroll event so framer-motion's whileInView still fires
          window.dispatchEvent(new Event('scroll', { bubbles: false }));
        });

        // The RAF loop — runs every frame, advances Lenis physics
        const raf = (time) => {
          lenis.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

      } catch (err) {
        // Lenis failed to load (e.g. SSR, old browser) — fall back silently
        console.warn('[SmoothScroll] Lenis unavailable, using native scroll:', err.message);
      }
    };

    init();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
      lenisRef.current = null;
    };
  }, [animationsEnabled]);

  return lenisRef;
}
