import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repoBase = '/basic-financial-calculator/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? repoBase : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.png', 'favicon.webp'],
      manifest: {
        name: 'Basic Financial Calculator',
        short_name: 'FinanceCalc',
        start_url: repoBase,
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#1976d2',
        icons: [
          {
            src: 'favicon.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'favicon.webp',
            sizes: '256x256',
            type: 'image/webp',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith(`${repoBase}assets/`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-static-assets',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-images',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
}));
