import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Build-time precache (Workbox): the exact app shell — HTML, JS (lyrics
    // are bundled in), CSS, fonts, icons — is cached during the very first
    // visit, so the installed app works offline immediately, not after a
    // second visit. New deploys refresh the cache automatically.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // main.jsx registers /sw.js itself
      manifest: false, // public/manifest.webmanifest is hand-maintained
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // the main chunk carries the whole kirtan library (~2 MB)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // audio streamed from remote URLs: cache after first listen so
        // previously played kirtans keep working offline
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              rangeRequests: true,
              expiration: { maxEntries: 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
