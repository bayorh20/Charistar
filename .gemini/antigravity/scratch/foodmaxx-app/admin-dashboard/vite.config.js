import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const htmlEnvPlugin = (env) => ({
  name: 'html-env-transform',
  transformIndexHtml(html) {
    return html.replace(/%(.*?)%/g, (match, p1) => env[p1] || match);
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    esbuild: {
      drop: ['console', 'debugger']
    },
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      htmlEnvPlugin(env)
    ],
    build: {
      chunkSizeWarningLimit: 1200,
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
  };
})
