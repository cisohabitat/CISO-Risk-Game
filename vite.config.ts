import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Static-first build: no SSR, no server runtime. Output in dist/ is deployable
// to any CDN (see docs/HOSTING.md for the Vercel Hobby constraints).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // The campaign is data, not code: it changes on a different cadence
          // from the app, it is fetched in parallel rather than after it, and
          // its size is the thing most likely to creep as content is authored.
          // Its own chunk makes all three true and visible (plan §48).
          if (id.includes('src/content/nexora')) return 'campaign'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
          return undefined
        },
      },
    },
  },
})
