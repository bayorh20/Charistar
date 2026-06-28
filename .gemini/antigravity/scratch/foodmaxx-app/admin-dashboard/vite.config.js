import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger']
  },
  base: './',
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase/app') || id.includes('firebase/auth')) return 'firebase-core';
          if (id.includes('firebase/firestore') || id.includes('firebase/storage')) return 'firebase-db';
          if (id.includes('node_modules/framer-motion')) return 'framer';
          if (id.includes('node_modules/lucide-react')) return 'lucide';
          if (id.includes('node_modules/react-router')) return 'router';
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'lucide-react',
      'framer-motion'
    ]
  }
})
