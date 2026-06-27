/**
 * FoodMaxx – PWA Screen Transition Animation Library
 * 54 animations across 3 categories: Normal, Cinematic, 3D
 *
 * Each entry:
 *   id       – stored in Firestore (animations.mode)
 *   label    – display name
 *   category – 'normal' | 'cinematic' | '3d'
 *   emoji    – icon for the picker UI
 *   variants – framer-motion variants object { enter, center, exit }
 *   config   – framer-motion transition config object
 */

const spring = (stiffness = 320, damping = 30) => ({ type: 'spring', stiffness, damping });
const tween  = (duration = 0.35, ease = 'easeInOut') => ({ duration, ease });

// ─── NORMAL TRANSITIONS ────────────────────────────────────────────────────────
const NORMAL = [
  {
    id: 'fade',
    label: 'Fade',
    emoji: '🌫️',
    variants: {
      enter:  { opacity: 0 },
      center: { opacity: 1 },
      exit:   { opacity: 0 },
    },
    config: { opacity: tween(0.3) },
  },
  {
    id: 'slide-left',
    label: 'Slide Left',
    emoji: '⬅️',
    variants: {
      enter:  { x: '100%', opacity: 0 },
      center: { x: 0,      opacity: 1 },
      exit:   { x: '-100%',opacity: 0 },
    },
    config: { x: spring(), opacity: tween(0.2) },
  },
  {
    id: 'slide-right',
    label: 'Slide Right',
    emoji: '➡️',
    variants: {
      enter:  { x: '-100%', opacity: 0 },
      center: { x: 0,       opacity: 1 },
      exit:   { x: '100%',  opacity: 0 },
    },
    config: { x: spring(), opacity: tween(0.2) },
  },
  {
    id: 'slide-up',
    label: 'Slide Up',
    emoji: '⬆️',
    variants: {
      enter:  { y: '100%', opacity: 0 },
      center: { y: 0,      opacity: 1 },
      exit:   { y: '-100%',opacity: 0 },
    },
    config: { y: spring(), opacity: tween(0.2) },
  },
  {
    id: 'slide-down',
    label: 'Slide Down',
    emoji: '⬇️',
    variants: {
      enter:  { y: '-100%', opacity: 0 },
      center: { y: 0,       opacity: 1 },
      exit:   { y: '100%',  opacity: 0 },
    },
    config: { y: spring(), opacity: tween(0.2) },
  },
  {
    id: 'zoom-in',
    label: 'Zoom In',
    emoji: '🔍',
    variants: {
      enter:  { scale: 0.85, opacity: 0 },
      center: { scale: 1,    opacity: 1 },
      exit:   { scale: 1.1,  opacity: 0 },
    },
    config: { scale: tween(0.35, 'easeOut'), opacity: tween(0.3) },
  },
  {
    id: 'zoom-out',
    label: 'Zoom Out',
    emoji: '🔎',
    variants: {
      enter:  { scale: 1.15, opacity: 0 },
      center: { scale: 1,    opacity: 1 },
      exit:   { scale: 0.88, opacity: 0 },
    },
    config: { scale: tween(0.35, 'easeOut'), opacity: tween(0.3) },
  },
  {
    id: 'scale-fade',
    label: 'Scale Fade',
    emoji: '✨',
    variants: {
      enter:  { scale: 0.92, opacity: 0, y: 12 },
      center: { scale: 1,    opacity: 1, y: 0  },
      exit:   { scale: 0.94, opacity: 0, y: -8 },
    },
    config: { scale: spring(380, 32), opacity: tween(0.25), y: spring(380, 32) },
  },
  {
    id: 'rise',
    label: 'Rise',
    emoji: '🌅',
    variants: {
      enter:  { y: 40, opacity: 0, scale: 0.97 },
      center: { y: 0,  opacity: 1, scale: 1    },
      exit:   { y: -30,opacity: 0, scale: 0.97 },
    },
    config: { y: spring(400, 35), scale: spring(400, 35), opacity: tween(0.28) },
  },
  {
    id: 'blur-in',
    label: 'Blur In',
    emoji: '🌀',
    variants: {
      enter:  { opacity: 0, filter: 'blur(18px)', scale: 1.04 },
      center: { opacity: 1, filter: 'blur(0px)',  scale: 1    },
      exit:   { opacity: 0, filter: 'blur(14px)', scale: 0.97 },
    },
    config: { opacity: tween(0.35), scale: tween(0.35), filter: tween(0.35) },
  },
  {
    id: 'bounce-in',
    label: 'Bounce In',
    emoji: '🏀',
    variants: {
      enter:  { scale: 0.7, opacity: 0 },
      center: { scale: 1,   opacity: 1 },
      exit:   { scale: 0.8, opacity: 0 },
    },
    config: { scale: { type: 'spring', stiffness: 600, damping: 18 }, opacity: tween(0.2) },
  },
  {
    id: 'elastic-slide',
    label: 'Elastic Slide',
    emoji: '🎸',
    variants: {
      enter:  { x: '80%', opacity: 0 },
      center: { x: 0,     opacity: 1 },
      exit:   { x: '-80%',opacity: 0 },
    },
    config: { x: { type: 'spring', stiffness: 600, damping: 20 }, opacity: tween(0.25) },
  },
  {
    id: 'wipe-right',
    label: 'Wipe Right',
    emoji: '🖊️',
    variants: {
      enter:  { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
      center: { clipPath: 'inset(0 0% 0 0)',   opacity: 1 },
      exit:   { clipPath: 'inset(0 0 0 100%)', opacity: 1 },
    },
    config: { clipPath: tween(0.38, 'easeInOut'), opacity: tween(0.1) },
  },
  {
    id: 'wipe-up',
    label: 'Wipe Up',
    emoji: '🖊️',
    variants: {
      enter:  { clipPath: 'inset(100% 0 0 0)', opacity: 1 },
      center: { clipPath: 'inset(0% 0 0 0)',   opacity: 1 },
      exit:   { clipPath: 'inset(0 0 100% 0)', opacity: 1 },
    },
    config: { clipPath: tween(0.38, 'easeInOut'), opacity: tween(0.1) },
  },
  {
    id: 'push-up',
    label: 'Push Up',
    emoji: '🚀',
    variants: {
      enter:  { y: '100%' },
      center: { y: 0 },
      exit:   { y: '-30%' },
    },
    config: { y: spring(340, 28) },
  },
  {
    id: 'push-down',
    label: 'Push Down',
    emoji: '📥',
    variants: {
      enter:  { y: '-100%' },
      center: { y: 0 },
      exit:   { y: '30%' },
    },
    config: { y: spring(340, 28) },
  },
];

// ─── CINEMATIC TRANSITIONS ─────────────────────────────────────────────────────
const CINEMATIC = [
  {
    id: 'film-roll',
    label: 'Film Roll',
    emoji: '🎬',
    variants: {
      enter:  { x: '100%', skewX: 8,  opacity: 0, filter: 'brightness(0.6)' },
      center: { x: 0,      skewX: 0,  opacity: 1, filter: 'brightness(1)'   },
      exit:   { x: '-60%', skewX: -6, opacity: 0, filter: 'brightness(0.4)' },
    },
    config: { x: tween(0.5, [0.22, 1, 0.36, 1]), skewX: tween(0.5), opacity: tween(0.4), filter: tween(0.5) },
  },
  {
    id: 'whip-pan',
    label: 'Whip Pan',
    emoji: '📸',
    variants: {
      enter:  { x: '120%', opacity: 0, filter: 'blur(16px) brightness(1.4)' },
      center: { x: 0,      opacity: 1, filter: 'blur(0px)  brightness(1)'   },
      exit:   { x: '-120%',opacity: 0, filter: 'blur(16px) brightness(0.6)' },
    },
    config: { x: tween(0.28, [0.4, 0, 0.2, 1]), filter: tween(0.28), opacity: tween(0.15) },
  },
  {
    id: 'crossfade',
    label: 'Crossfade',
    emoji: '🌈',
    variants: {
      enter:  { opacity: 0, scale: 1.06 },
      center: { opacity: 1, scale: 1    },
      exit:   { opacity: 0, scale: 0.95 },
    },
    config: { opacity: tween(0.5, 'easeInOut'), scale: tween(0.5, 'easeInOut') },
  },
  {
    id: 'dolly',
    label: 'Dolly Zoom',
    emoji: '🎥',
    variants: {
      enter:  { scale: 1.35, opacity: 0, filter: 'blur(8px)' },
      center: { scale: 1,    opacity: 1, filter: 'blur(0px)' },
      exit:   { scale: 0.7,  opacity: 0, filter: 'blur(8px)' },
    },
    config: { scale: tween(0.48, 'easeInOut'), opacity: tween(0.35), filter: tween(0.4) },
  },
  {
    id: 'flash-cut',
    label: 'Flash Cut',
    emoji: '⚡',
    variants: {
      enter:  { opacity: 0, scale: 1.08, filter: 'brightness(3)' },
      center: { opacity: 1, scale: 1,    filter: 'brightness(1)' },
      exit:   { opacity: 0, scale: 0.96, filter: 'brightness(3)' },
    },
    config: { opacity: tween(0.18), scale: tween(0.18), filter: tween(0.18) },
  },
  {
    id: 'vignette',
    label: 'Vignette Reveal',
    emoji: '🔲',
    variants: {
      enter:  { opacity: 0, scale: 1.02, filter: 'brightness(0) contrast(2)' },
      center: { opacity: 1, scale: 1,    filter: 'brightness(1) contrast(1)' },
      exit:   { opacity: 0, scale: 0.98, filter: 'brightness(0) contrast(2)' },
    },
    config: { opacity: tween(0.45), scale: tween(0.45), filter: tween(0.45) },
  },
  {
    id: 'glitch',
    label: 'Glitch',
    emoji: '📺',
    variants: {
      enter:  { x: 12,  opacity: 0, filter: 'hue-rotate(90deg) saturate(3)' },
      center: { x: 0,   opacity: 1, filter: 'hue-rotate(0deg)  saturate(1)' },
      exit:   { x: -12, opacity: 0, filter: 'hue-rotate(90deg) saturate(3)' },
    },
    config: { x: tween(0.2, [0.8, 0.2, 0.2, 0.8]), opacity: tween(0.2), filter: tween(0.22) },
  },
  {
    id: 'letterbox',
    label: 'Letterbox',
    emoji: '🎞️',
    variants: {
      enter:  { x: '100%', opacity: 0, scaleY: 0.85 },
      center: { x: 0,      opacity: 1, scaleY: 1    },
      exit:   { x: '-100%',opacity: 0, scaleY: 0.85 },
    },
    config: { x: tween(0.5, [0.25, 1, 0.5, 1]), scaleY: tween(0.5), opacity: tween(0.3) },
  },
  {
    id: 'iris-in',
    label: 'Iris Wipe',
    emoji: '👁️',
    variants: {
      enter:  { scale: 0, opacity: 0, borderRadius: '50%' },
      center: { scale: 1, opacity: 1, borderRadius: '0%'  },
      exit:   { scale: 0, opacity: 0, borderRadius: '50%' },
    },
    config: { scale: tween(0.4, 'easeInOut'), opacity: tween(0.3), borderRadius: tween(0.4) },
  },
  {
    id: 'morph',
    label: 'Morph',
    emoji: '🫧',
    variants: {
      enter:  { scale: 0.5, opacity: 0, rotate: -8, filter: 'blur(12px)' },
      center: { scale: 1,   opacity: 1, rotate: 0,  filter: 'blur(0px)'  },
      exit:   { scale: 1.3, opacity: 0, rotate: 6,  filter: 'blur(12px)' },
    },
    config: { scale: tween(0.48, 'easeInOut'), opacity: tween(0.35), rotate: tween(0.48), filter: tween(0.42) },
  },
  {
    id: 'shutter',
    label: 'Shutter',
    emoji: '📷',
    variants: {
      enter:  { scaleX: 0, opacity: 0 },
      center: { scaleX: 1, opacity: 1 },
      exit:   { scaleX: 0, opacity: 0 },
    },
    config: { scaleX: tween(0.35, 'easeInOut'), opacity: tween(0.2) },
  },
  {
    id: 'tv-static',
    label: 'TV Static',
    emoji: '📡',
    variants: {
      enter:  { opacity: 0, scaleY: 0.02, filter: 'contrast(8) brightness(3)' },
      center: { opacity: 1, scaleY: 1,    filter: 'contrast(1) brightness(1)' },
      exit:   { opacity: 0, scaleY: 0.02, filter: 'contrast(8) brightness(3)' },
    },
    config: { scaleY: tween(0.3, 'easeOut'), opacity: tween(0.2), filter: tween(0.3) },
  },
  {
    id: 'diagonal-wipe',
    label: 'Diagonal Wipe',
    emoji: '↗️',
    variants: {
      enter:  { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', opacity: 1 },
      center: { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', opacity: 1 },
      exit:   { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)', opacity: 1 },
    },
    config: { clipPath: tween(0.45, 'easeInOut') },
  },
  {
    id: 'cinema-pan',
    label: 'Cinema Pan',
    emoji: '🎦',
    variants: {
      enter:  { x: '60%', opacity: 0, scale: 0.92, filter: 'blur(6px)' },
      center: { x: 0,     opacity: 1, scale: 1,    filter: 'blur(0px)' },
      exit:   { x: '-60%',opacity: 0, scale: 0.92, filter: 'blur(6px)' },
    },
    config: { x: tween(0.55, [0.2, 0.8, 0.2, 1]), scale: tween(0.55), opacity: tween(0.35), filter: tween(0.4) },
  },
  {
    id: 'ken-burns',
    label: 'Ken Burns',
    emoji: '🏛️',
    variants: {
      enter:  { scale: 1.2, opacity: 0, x: -20 },
      center: { scale: 1,   opacity: 1, x: 0   },
      exit:   { scale: 0.9, opacity: 0, x: 20  },
    },
    config: { scale: tween(0.65, 'easeInOut'), opacity: tween(0.5), x: tween(0.65) },
  },
  {
    id: 'split-h',
    label: 'Split Horizontal',
    emoji: '⬛',
    variants: {
      enter:  { scaleY: 0, opacity: 0, originY: '50%' },
      center: { scaleY: 1, opacity: 1, originY: '50%' },
      exit:   { scaleY: 0, opacity: 0, originY: '50%' },
    },
    config: { scaleY: tween(0.38, 'easeInOut'), opacity: tween(0.25) },
  },
  {
    id: 'split-v',
    label: 'Split Vertical',
    emoji: '⬜',
    variants: {
      enter:  { scaleX: 0, opacity: 0, originX: '50%' },
      center: { scaleX: 1, opacity: 1, originX: '50%' },
      exit:   { scaleX: 0, opacity: 0, originX: '50%' },
    },
    config: { scaleX: tween(0.38, 'easeInOut'), opacity: tween(0.25) },
  },
  {
    id: 'dream',
    label: 'Dream',
    emoji: '💫',
    variants: {
      enter:  { opacity: 0, scale: 1.06, filter: 'blur(20px) brightness(1.6)' },
      center: { opacity: 1, scale: 1,    filter: 'blur(0px)  brightness(1)'   },
      exit:   { opacity: 0, scale: 0.96, filter: 'blur(20px) brightness(0.5)' },
    },
    config: { opacity: tween(0.6, 'easeInOut'), scale: tween(0.6), filter: tween(0.6) },
  },
];

// ─── 3D TRANSITIONS ────────────────────────────────────────────────────────────
const THREE_D = [
  {
    id: 'flip-x',
    label: 'Flip X',
    emoji: '🔄',
    variants: {
      enter:  { rotateY: 90,  opacity: 0, z: -100 },
      center: { rotateY: 0,   opacity: 1, z: 0    },
      exit:   { rotateY: -90, opacity: 0, z: -100 },
    },
    config: { rotateY: spring(280, 28), opacity: tween(0.25), z: spring(280, 28) },
  },
  {
    id: 'flip-y',
    label: 'Flip Y',
    emoji: '🔃',
    variants: {
      enter:  { rotateX: -90, opacity: 0, z: -100 },
      center: { rotateX: 0,   opacity: 1, z: 0    },
      exit:   { rotateX: 90,  opacity: 0, z: -100 },
    },
    config: { rotateX: spring(280, 28), opacity: tween(0.25), z: spring(280, 28) },
  },
  {
    id: 'cube-left',
    label: 'Cube Left',
    emoji: '🎲',
    variants: {
      enter:  { x: '100%', rotateY: -90, z: -280, opacity: 0.6 },
      center: { x: 0,      rotateY: 0,   z: 0,    opacity: 1   },
      exit:   { x: '-100%',rotateY: 90,  z: -280, opacity: 0.6 },
    },
    config: { x: tween(0.5, [0.25, 1, 0.5, 1]), rotateY: tween(0.5), z: tween(0.5), opacity: tween(0.5) },
  },
  {
    id: 'cube-right',
    label: 'Cube Right',
    emoji: '📦',
    variants: {
      enter:  { x: '-100%', rotateY: 90,  z: -280, opacity: 0.6 },
      center: { x: 0,       rotateY: 0,   z: 0,    opacity: 1   },
      exit:   { x: '100%',  rotateY: -90, z: -280, opacity: 0.6 },
    },
    config: { x: tween(0.5, [0.25, 1, 0.5, 1]), rotateY: tween(0.5), z: tween(0.5), opacity: tween(0.5) },
  },
  {
    id: 'cube-up',
    label: 'Cube Up',
    emoji: '⬆️',
    variants: {
      enter:  { y: '100%', rotateX: 90,  z: -220, opacity: 0.6 },
      center: { y: 0,      rotateX: 0,   z: 0,    opacity: 1   },
      exit:   { y: '-100%',rotateX: -90, z: -220, opacity: 0.6 },
    },
    config: { y: tween(0.5, [0.25, 1, 0.5, 1]), rotateX: tween(0.5), z: tween(0.5), opacity: tween(0.5) },
  },
  {
    id: 'page-turn',
    label: 'Page Turn',
    emoji: '📄',
    variants: {
      enter:  { rotateY: 180, x: '40%', opacity: 0, z: -50 },
      center: { rotateY: 0,   x: 0,     opacity: 1, z: 0   },
      exit:   { rotateY: -180,x: '-40%',opacity: 0, z: -50 },
    },
    config: { rotateY: tween(0.6, 'easeInOut'), x: tween(0.5), opacity: tween(0.3), z: tween(0.5) },
  },
  {
    id: 'card-flip',
    label: 'Card Flip',
    emoji: '🃏',
    variants: {
      enter:  { rotateY: -180, scale: 0.85, opacity: 0 },
      center: { rotateY: 0,    scale: 1,    opacity: 1 },
      exit:   { rotateY: 180,  scale: 0.85, opacity: 0 },
    },
    config: { rotateY: tween(0.5, 'easeInOut'), scale: tween(0.5), opacity: tween(0.25) },
  },
  {
    id: 'fold',
    label: 'Fold',
    emoji: '📁',
    variants: {
      enter:  { rotateX: -90, scaleY: 0.3, opacity: 0, originY: 0 },
      center: { rotateX: 0,   scaleY: 1,   opacity: 1, originY: 0 },
      exit:   { rotateX: 90,  scaleY: 0.3, opacity: 0, originY: 1 },
    },
    config: { rotateX: tween(0.45, 'easeOut'), scaleY: tween(0.45), opacity: tween(0.3) },
  },
  {
    id: 'accordion',
    label: 'Accordion',
    emoji: '🪗',
    variants: {
      enter:  { scaleX: 0.1, opacity: 0, originX: 0 },
      center: { scaleX: 1,   opacity: 1, originX: 0 },
      exit:   { scaleX: 0.1, opacity: 0, originX: 1 },
    },
    config: { scaleX: spring(360, 30), opacity: tween(0.25) },
  },
  {
    id: 'carousel-3d',
    label: 'Carousel 3D',
    emoji: '🎠',
    variants: {
      enter:  { rotateY: 45,  x: '50%', scale: 0.7, opacity: 0 },
      center: { rotateY: 0,   x: 0,     scale: 1,   opacity: 1 },
      exit:   { rotateY: -45, x: '-50%',scale: 0.7, opacity: 0 },
    },
    config: { rotateY: tween(0.5, [0.25, 1, 0.5, 1]), x: tween(0.5), scale: tween(0.5), opacity: tween(0.35) },
  },
  {
    id: 'door-open',
    label: 'Door Open',
    emoji: '🚪',
    variants: {
      enter:  { rotateY: -90, x: '-20%', opacity: 0, originX: 0 },
      center: { rotateY: 0,   x: 0,      opacity: 1, originX: 0 },
      exit:   { rotateY: 90,  x: '20%',  opacity: 0, originX: 1 },
    },
    config: { rotateY: tween(0.55, 'easeInOut'), x: tween(0.5), opacity: tween(0.3) },
  },
  {
    id: 'spiral',
    label: 'Spiral',
    emoji: '🌀',
    variants: {
      enter:  { rotate: -180, scale: 0.3, opacity: 0 },
      center: { rotate: 0,    scale: 1,   opacity: 1 },
      exit:   { rotate: 180,  scale: 0.3, opacity: 0 },
    },
    config: { rotate: tween(0.55, 'easeInOut'), scale: tween(0.55), opacity: tween(0.35) },
  },
  {
    id: 'stack',
    label: 'Stack',
    emoji: '📚',
    variants: {
      enter:  { y: '100%', z: -300, scale: 0.8, opacity: 0 },
      center: { y: 0,      z: 0,    scale: 1,   opacity: 1 },
      exit:   { y: 0,      z: -300, scale: 0.8, opacity: 0 },
    },
    config: { y: spring(350, 30), z: spring(350, 30), scale: spring(350, 30), opacity: tween(0.3) },
  },
  {
    id: 'depth-push',
    label: 'Depth Push',
    emoji: '🔭',
    variants: {
      enter:  { z: -800, scale: 0.3, opacity: 0, rotateX: 20 },
      center: { z: 0,    scale: 1,   opacity: 1, rotateX: 0  },
      exit:   { z: 400,  scale: 1.3, opacity: 0, rotateX: -10 },
    },
    config: { z: tween(0.55, 'easeOut'), scale: tween(0.55), opacity: tween(0.4), rotateX: tween(0.55) },
  },
  {
    id: 'room-left',
    label: 'Room Left',
    emoji: '🏠',
    variants: {
      enter:  { x: '100%', rotateY: -35, z: -200, opacity: 0.4 },
      center: { x: 0,      rotateY: 0,   z: 0,    opacity: 1   },
      exit:   { x: '-30%', rotateY: 20,  z: -200, opacity: 0.4 },
    },
    config: { x: tween(0.55, [0.3, 1, 0.4, 1]), rotateY: tween(0.55), z: tween(0.5), opacity: tween(0.4) },
  },
  {
    id: 'orbit',
    label: 'Orbit',
    emoji: '🪐',
    variants: {
      enter:  { rotate: -45, scale: 0.6, x: '60%', opacity: 0 },
      center: { rotate: 0,   scale: 1,   x: 0,     opacity: 1 },
      exit:   { rotate: 45,  scale: 0.6, x: '-60%',opacity: 0 },
    },
    config: { rotate: tween(0.5, 'easeInOut'), scale: tween(0.5), x: tween(0.5), opacity: tween(0.35) },
  },
  {
    id: 'tunnel',
    label: 'Tunnel',
    emoji: '🕳️',
    variants: {
      enter:  { scale: 3, opacity: 0, filter: 'blur(20px)' },
      center: { scale: 1, opacity: 1, filter: 'blur(0px)'  },
      exit:   { scale: 0.2, opacity: 0, filter: 'blur(20px)' },
    },
    config: { scale: tween(0.5, 'easeInOut'), opacity: tween(0.4), filter: tween(0.4) },
  },
  {
    id: 'tilt-slide',
    label: 'Tilt Slide',
    emoji: '📐',
    variants: {
      enter:  { x: '100%', rotateZ: 8,  opacity: 0 },
      center: { x: 0,      rotateZ: 0,  opacity: 1 },
      exit:   { x: '-100%',rotateZ: -8, opacity: 0 },
    },
    config: { x: spring(340, 28), rotateZ: spring(340, 28), opacity: tween(0.25) },
  },
  {
    id: 'pendulum',
    label: 'Pendulum',
    emoji: '⏱️',
    variants: {
      enter:  { rotateZ: 30,  x: '40%', opacity: 0, originY: 0 },
      center: { rotateZ: 0,   x: 0,     opacity: 1, originY: 0 },
      exit:   { rotateZ: -30, x: '-40%',opacity: 0, originY: 0 },
    },
    config: { rotateZ: { type: 'spring', stiffness: 200, damping: 18 }, x: spring(300, 25), opacity: tween(0.3) },
  },
  {
    id: 'wave',
    label: 'Wave',
    emoji: '🌊',
    variants: {
      enter:  { x: '100%', rotateZ: 5,  scale: 0.9, opacity: 0 },
      center: { x: 0,      rotateZ: 0,  scale: 1,   opacity: 1 },
      exit:   { x: '-100%',rotateZ: -5, scale: 0.9, opacity: 0 },
    },
    config: { x: spring(380, 32), rotateZ: spring(380, 32), scale: spring(380, 32), opacity: tween(0.22) },
  },
];

// ─── Full library export ───────────────────────────────────────────────────────
export const TRANSITION_ANIMATIONS = [
  ...NORMAL.map(a => ({ ...a, category: 'normal' })),
  ...CINEMATIC.map(a => ({ ...a, category: 'cinematic' })),
  ...THREE_D.map(a => ({ ...a, category: '3d' })),
];

export const ANIMATION_CATEGORIES = [
  { id: 'normal',    label: 'Normal',    emoji: '✨', description: 'Clean, standard transitions' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬', description: 'Film-inspired dramatic effects' },
  { id: '3d',        label: '3D',        emoji: '🎲', description: 'Spatial depth and perspective' },
];

/**
 * Get framer-motion variants + config for a given animation id.
 * Falls back to 'slide-left' if not found.
 */
export function getAnimationDef(id) {
  const cleanId = (id || '').toLowerCase().trim();
  if (cleanId === 'slide') return TRANSITION_ANIMATIONS.find(a => a.id === 'slide-left');
  if (cleanId === 'fade') return TRANSITION_ANIMATIONS.find(a => a.id === 'fade');
  if (cleanId === 'zoom') return TRANSITION_ANIMATIONS.find(a => a.id === 'zoom-in');
  return TRANSITION_ANIMATIONS.find(a => a.id === cleanId)
    || TRANSITION_ANIMATIONS.find(a => a.id === 'slide-left');
}
