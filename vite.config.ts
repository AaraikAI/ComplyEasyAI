import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Same-origin dev: run with VITE_API_URL=/api to have the dev server
        // proxy API calls to the local backend, so httpOnly session cookies
        // (sameSite 'strict') flow exactly as in production.
        proxy: {
          '/api': {
            target: process.env.DEV_API_PROXY_TARGET || 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      // SAME-ORIGIN E2E: `vite preview` serves the built SPA and reverse-proxies
      // /api to the backend, mirroring production (CloudFront serves the SPA and
      // proxies /api). With the app built using VITE_API_URL=/api, its XHRs are
      // same-origin, so the backend's httpOnly session cookies (sameSite 'strict')
      // flow exactly as in prod — letting real auth + org-scoped create flows
      // persist in E2E instead of 401'ing under cross-origin mock auth.
      preview: {
        port: 4173,
        proxy: {
          '/api': {
            target: process.env.E2E_API_PROXY_TARGET || 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      // SECURITY: Gemini API key is NOT exposed to the frontend bundle.
      // All AI calls are routed through backend API endpoints (/api/ai/*).
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              // Split vendor chunks by package
              if (id.includes('node_modules')) {
                if (id.includes('react-dom') || id.includes('/react/')) {
                  return 'vendor-react';
                }
                if (id.includes('recharts') || id.includes('d3-')) {
                  return 'vendor-charts';
                }
                if (id.includes('lucide-react')) {
                  return 'vendor-icons';
                }
                if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('mdast') || id.includes('hast') || id.includes('micromark')) {
                  return 'vendor-markdown';
                }
                // Other node_modules go to vendor
                return 'vendor';
              }
            },
          },
        },
        chunkSizeWarningLimit: 1500,
      },
    };
});
