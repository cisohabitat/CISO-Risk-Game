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
        // Named groups, highest priority first. The campaign is data, not
        // code: it changes on a different cadence from the app and its size is
        // the thing most likely to creep as content is authored, so it is its
        // own chunk (plan §48), and it is loaded on demand: the start screen
        // needs none of it but the starting situations, which have a small
        // chunk of their own so that the campaign's group does not take them.
        advancedChunks: {
          groups: [
            { name: 'situations', test: /src[\\/]content[\\/]nexora[\\/]situations\.json/, priority: 30 },
            { name: 'campaign', test: /src[\\/]content[\\/]nexora[\\/]/, priority: 20 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
