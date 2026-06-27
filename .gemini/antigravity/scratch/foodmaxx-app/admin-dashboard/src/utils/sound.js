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

// Play a bright double-tone alert chime (for New Orders)
export const playNewOrderChime = (enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Double high-pitched alert chime (C6 -> G6)
    const notes = [1046.50, 1567.98]; 
    const delays = [0, 0.15];
    const durations = [0.25, 0.4];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle'; // Smooth but clear alert
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gainNode.gain.setValueAtTime(0, now + delays[i]);
      gainNode.gain.linearRampToValueAtTime(0.12, now + delays[i] + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + durations[i]);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + durations[i]);
    });
  } catch (e) {
    console.warn('Audio playNewOrderChime failed:', e);
  }
};

// Play a friendly notifications alert chime (for Support Messages)
export const playNewMessageChime = (enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Pleasant high-low sound (A5 -> F5)
    const notes = [880.00, 698.46]; 
    const delays = [0, 0.12];
    const durations = [0.2, 0.3];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);

      gainNode.gain.setValueAtTime(0, now + delays[i]);
      gainNode.gain.linearRampToValueAtTime(0.1, now + delays[i] + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + durations[i]);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + durations[i]);
    });
  } catch (e) {
    console.warn('Audio playNewMessageChime failed:', e);
  }
};

// Play a clean success chime
export const playSuccessChime = (enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Ascending arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    const durations = [0.12, 0.12, 0.12, 0.35];
    const delays = [0, 0.08, 0.16, 0.24];

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
    console.warn('Audio playSuccessChime failed:', e);
  }
};

// Play a subtle click sound
export const playTick = (enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.04);

    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // Initial user gesture block
  }
};
