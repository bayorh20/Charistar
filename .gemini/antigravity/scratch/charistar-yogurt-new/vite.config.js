import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

const generateMetaPlugin = () => {
  return {
    name: 'generate-meta',
    buildStart() {
      if (!fs.existsSync('public')) {
        fs.mkdirSync('public');
      }
      fs.writeFileSync('public/meta.json', JSON.stringify({ version: Date.now().toString() }));
    }
  };
};

export default defineConfig({
  plugins: [
    generateMetaPlugin(),
    react(),
    VitePWA({
      // Auto-update: new SW activates immediately without waiting
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // Take control of all clients immediately on activation
        skipWaiting: true,
        clientsClaim: true,
        // Clean old caches on every SW activation
        cleanupOutdatedCaches: true,
        // Cache the app shell and assets
        globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2}'],
        // Network-first for HTML so fresh index.html is always fetched
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell-cache',
              expiration: { maxAgeSeconds: 60 * 60 * 24 }, // 24h max
              networkTimeoutSeconds: 3,
            },
          },
          {
            // Unsplash images — cache for 7 days
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // DiceBear avatars — cache for 24h
            urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatar-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      manifest: {
        name: 'Charistar Yogurt',
        short_name: 'Charistar',
        description: 'Premium yogurt & parfait delivery',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1200,
    minify: 'esbuild',
    cssCodeSplit: true,
  }
})
