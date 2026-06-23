import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  dark: {
    key: 'dark',
    label: 'Dark',
    emoji: '🌑',
    // CSS vars applied to :root
    vars: {
      '--bg-primary':     '#121214',
      '--bg-primary-rgb': '18,18,20',
      '--bg-secondary':   '#1a1a1e',
      '--bg-secondary-rgb': '26,26,30',
      '--bg-card':        'rgba(255,255,255,0.045)',
      '--bg-nav':         'rgba(18,18,20,0.92)',
      '--text-primary':   '#f3f4f6',
      '--text-secondary': '#a1a1aa',
      '--text-muted':     '#6b7280',
      '--border-color':   'rgba(255,255,255,0.065)',
      '--accent':         '#A3C644',
      '--accent-text':    '#000000',
      '--accent-glow':    'rgba(204,255,0,0.35)',
      '--glass-bg':       'rgba(255,255,255,0.045)',
      '--glass-blur':     '6px',
      '--input-bg':       'rgba(255,255,255,0.03)',
      '--input-border':   'rgba(255,255,255,0.07)',
      '--shadow-card':    '0 8px 30px rgba(0,0,0,0.3)',
    }
  },
  light: {
    key: 'light',
    label: 'Light',
    emoji: '☀️',
    vars: {
      '--bg-primary':     '#f5f5f0',
      '--bg-primary-rgb': '245,245,240',
      '--bg-secondary':   '#ebebeb',
      '--bg-secondary-rgb': '235,235,235',
      '--bg-card':        'rgba(255,255,255,0.85)',
      '--bg-nav':         'rgba(245,245,240,0.92)',
      '--text-primary':   '#0a0a0a',
      '--text-secondary': '#555555',
      '--text-muted':     '#888888',
      '--border-color':   'rgba(0,0,0,0.08)',
      '--accent':         '#22a000',
      '--accent-text':    '#ffffff',
      '--accent-glow':    'rgba(34,160,0,0.25)',
      '--glass-bg':       'rgba(255,255,255,0.7)',
      '--glass-blur':     '8px',
      '--input-bg':       'rgba(0,0,0,0.04)',
      '--input-border':   'rgba(0,0,0,0.12)',
      '--shadow-card':    '0 4px 24px -4px rgba(0,0,0,0.12)',
    }
  },
  green: {
    key: 'green',
    label: 'Green',
    emoji: '🌿',
    vars: {
      '--bg-primary':     '#050f03',
      '--bg-primary-rgb': '5,15,3',
      '--bg-secondary':   '#0a1f06',
      '--bg-secondary-rgb': '10,31,6',
      '--bg-card':        'rgba(204,255,0,0.06)',
      '--bg-nav':         'rgba(5,15,3,0.92)',
      '--text-primary':   '#e8ffcc',
      '--text-secondary': '#7db85a',
      '--text-muted':     '#4a7030',
      '--border-color':   'rgba(204,255,0,0.12)',
      '--accent':         '#A3C644',
      '--accent-text':    '#050f03',
      '--accent-glow':    'rgba(204,255,0,0.45)',
      '--glass-bg':       'rgba(204,255,0,0.05)',
      '--glass-blur':     '6px',
      '--input-bg':       'rgba(204,255,0,0.05)',
      '--input-border':   'rgba(204,255,0,0.15)',
      '--shadow-card':    '0 10px 40px -10px rgba(0,0,0,0.4)',
    }
  }
};

function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.dark;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
  // Body class for extra overrides
  root.classList.remove('theme-dark', 'theme-light', 'theme-green');
  root.classList.add(`theme-${themeKey}`);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('charistar_theme');
      if (stored) return stored;
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isSystemDark ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  const [fontSize, setFontSize] = useState(() => {
    try { return localStorage.getItem('charistar_fontsize') || 'normal'; }
    catch { return 'normal'; }
  });

  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('charistar_animations_enabled');
      if (stored !== null) return stored === 'true';
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return !prefersReduced;
    } catch {
      return true;
    }
  });

  // Detect low-end device on mount and apply class + override animations if needed
  const [isLowEndDevice] = useState(() => {
    try {
      const memory = navigator.deviceMemory;
      const cores = navigator.hardwareConcurrency;
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const isSlowNetwork = connection && (connection.saveData || ['2g', '3g'].includes(connection.effectiveType));
      const lowEnd = (memory && memory <= 2) || (cores && cores <= 4) || isSlowNetwork;
      if (lowEnd) {
        document.documentElement.classList.add('low-performance');
      }
      return !!lowEnd;
    } catch (e) {
      console.warn('[PerformanceProfiling] Bypassed:', e);
      return false;
    }
  });

  const [isPromptOpen, setIsPromptOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem('charistar_theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    root.classList.add(`font-size-${fontSize}`);
    try { localStorage.setItem('charistar_fontsize', fontSize); } catch {}
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    if (animationsEnabled) {
      root.classList.remove('animations-disabled');
    } else {
      root.classList.add('animations-disabled');
    }
    try { localStorage.setItem('charistar_animations_enabled', String(animationsEnabled)); } catch {}
  }, [animationsEnabled]);
  const cycleTheme = () => {
    const order = ['dark', 'light', 'green'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, cycleTheme, themes: THEMES, isPromptOpen, setIsPromptOpen,
      fontSize, setFontSize, animationsEnabled, setAnimationsEnabled, isLowEndDevice
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}


