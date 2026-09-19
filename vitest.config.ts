import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    // Engine + content tests are pure Node. UI tests opt into jsdom with a
    // `// @vitest-environment jsdom` docblock at the top of the file.
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/engine/**/*.test.ts', 'tests/content/**/*.test.ts', 'tests/ui/**/*.test.tsx'],
    testTimeout: 120_000,
  },
})
