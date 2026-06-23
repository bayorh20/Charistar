/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  future: {
    // On mobile, hover styles only apply when the device actually supports hover
    // Without this, hovering (which mobile simulates after a tap) can get "stuck"
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        charistar: {
          green: '#A3C644',
          dark: '#0a0a0a',
          card: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.08)',
          cream: '#ffffff',
          gray: '#1c1c1c',
          textMain: '#ffffff',
          textSub: '#a0a0a0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 40px -10px rgba(0,0,0,0.5)',
        'nav': '0 -10px 40px -10px rgba(0,0,0,0.5)',
        'neon': '0 4px 15px rgba(0,0,0,0.25)',
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 12s linear infinite',
        'reverse-spin': 'reverse-spin 15s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'reverse-spin': {
          from: { transform: 'rotate(360deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      transitionDuration: {
        '0': '0ms',
      }
    },
  },
  plugins: [],
}
