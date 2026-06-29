import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const brandName = env.VITE_BRAND_NAME || 'FoodMaxx';
  const brandTagline = env.VITE_BRAND_TAGLINE || 'Food Delivery - Ibadan';
  const brandDesc = env.VITE_BRAND_DESCRIPTION || 'Premium food delivery in Ibadan.';
  const themeColor = env.VITE_THEME_COLOR || '#FF5B26';

  return {
    esbuild: {
      drop: ['console', 'debugger']
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          }
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['icon-192.png', 'icon-512.png', 'favicon.svg', 'icons.svg', 'avatar_male.webp', 'avatar_female.webp', 'offline.html'],
        manifest: {
          name: `${brandName} - ${brandTagline}`,
          short_name: brandName,
          description: brandDesc,
          theme_color: themeColor,
          background_color: '#ffffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cacheId: 'foodmaxx-v5',
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/admin/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'foodmaxx-v5-fonts-css',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'foodmaxx-v5-fonts-wf',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|webp|gif|svg)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'foodmaxx-v5-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ]
  };
})
