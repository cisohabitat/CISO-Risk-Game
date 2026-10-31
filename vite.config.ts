import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { guidePage } from './scripts/guide/plugin.ts'

// Static-first build: no SSR, no server runtime. Output in dist/ is deployable
// to any CDN (see docs/HOSTING.md for the Vercel Hobby constraints). The
// player's guide is built beside the game as dist/guide.html, served at /guide.
function buildRevision(): string {
  try {
    const revision = (process.env.VERCEL_GIT_COMMIT_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).trim()
    return /^[a-f0-9]{40}$/i.test(revision) ? revision.slice(0, 7) : 'local'
  } catch { return 'local' }
}

export default defineConfig({
  define: { __APP_REVISION__: JSON.stringify(buildRevision()) },
  plugins: [react(), tailwindcss(), guidePage()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    // WebKit can retain a failed modulepreload across reloads. Let the save
    // validator and annual review use native imports so a retry can recover.
    // Keep preloading for the larger campaign and screen chunks.
    modulePreload: {
      resolveDependencies: (filename, dependencies) => /(?:^|\/)(?:migrations|review)-[^/]+\.js$/.test(filename) ? [] : dependencies,
    },
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Named groups, highest priority first. The campaign is data, not
        // code: it changes on a different cadence from the app and its size is
        // the thing most likely to creep as content is authored, so it is its
        // own chunk (plan §48), and it is loaded on demand: the start screen
        // needs none of it but the starting situations, which have a small
        // chunk of their own so that the campaign's group does not take them.
        // Year Two's events and decisions are a chunk of their own too, fetched
        // only when a second year begins or a second-year save opens.
        codeSplitting: {
          groups: [
            { name: 'situations', test: /src[\\/]content[\\/]nexora[\\/]situations\.json/, priority: 30 },
            { name: 'year-two', test: /src[\\/]content[\\/]nexora[\\/](year-two\.ts|decisions-year-two\.json|events[\\/]year-two\.json)/, priority: 25 },
            { name: 'campaign', test: /src[\\/]content[\\/]nexora[\\/]/, priority: 20 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
