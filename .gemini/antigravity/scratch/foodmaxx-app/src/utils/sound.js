// Synthesized Sound Effects using Web Audio API
// This avoids needing to load static audio files and works instantly

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Safe native haptic feedback trigger helper (Capacitor Native Plugins + HTML5 Web Vibrate API)
export const triggerHaptic = (type = 'light') => {
  try {
    // 1. Check if running inside Capacitor native web view
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
      const Haptics = window.Capacitor.Plugins?.Haptics;
      if (Haptics) {
        if (type === 'light') {
          Haptics.impact({ style: 'LIGHT' }).catch(() => {});
        } else if (type === 'medium') {
          Haptics.impact({ style: 'MEDIUM' }).catch(() => {});
        } else if (type === 'heavy') {
          Haptics.impact({ style: 'HEAVY' }).catch(() => {});
        } else if (type === 'success') {
          Haptics.notification({ type: 'SUCCESS' }).catch(() => {});
        } else if (type === 'warning') {
          Haptics.notification({ type: 'WARNING' }).catch(() => {});
        }
        return;
      }
    }

    // 2. Fallback to HTML5 Web Vibrate API (for mobile browsers / PWAs on Android)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate(20);
      } else if (type === 'heavy') {
        navigator.vibrate(40);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 15]);
      } else if (type === 'warning') {
        navigator.vibrate([35, 45, 35]);
      }
    }
  } catch (e) {
    // Suppress haptic errors silently in unsupported environments
  }
};

// Play a subtle, organic button pop/click sound (Adding to Cart)
export const playPop = (enabled = true) => {
  triggerHaptic('medium');
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Short, cute pop: frequency sweeps quickly from 300Hz to 150Hz in 0.08s
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn('Audio playPop failed:', e);
  }
};

// Play a clean, premium chord arpeggio (Checkout Success)
export const playSuccessChime = (enabled = true) => {
  triggerHaptic('success');
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // We will play three sweet notes in an ascending arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const durations = [0.1, 0.1, 0.1, 0.3];
    const delays = [0, 0.08, 0.16, 0.24];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle'; // Soft, clean sound
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gainNode.gain.setValueAtTime(0, now + delays[i]);
      gainNode.gain.linearRampToValueAtTime(0.1, now + delays[i] + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + durations[i]);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + durations[i]);
    });
  } catch (e) {
    console.warn('Audio playSuccessChime failed:', e);
  }
};

// Play a friendly notification alert (Rider Dispatched/Milestones)
export const playNotificationChime = (enabled = true) => {
  triggerHaptic('warning');
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // A pleasant double chime (high-low)
    const notes = [880.00, 698.46]; // A5 -> F5
    const delays = [0, 0.12];
    const durations = [0.15, 0.25];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gainNode.gain.setValueAtTime(0, now + delays[i]);
      gainNode.gain.linearRampToValueAtTime(0.08, now + delays[i] + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + durations[i]);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + durations[i]);
    });
  } catch (e) {
    console.warn('Audio playNotificationChime failed:', e);
  }
};

// Play a light slider-tick or hover sound (Category toggle)
export const playTick = (enabled = true) => {
  triggerHaptic('light');
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);

    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    // Audio context may be blocked initially, ignore
  }
};
