import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use the seeded RNG service (src/game/engine/rng.ts). Math.random() breaks determinism.',
        },
      ],
    },
  },
  {
    // The pure simulation engine must never reach for the DOM, React, storage
    // or any cloud SDK. See docs/ARCHITECTURE.md.
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*', 'zustand', 'zustand/*', 'idb', '@xyflow/*'], message: 'The simulation engine must stay free of UI/storage dependencies.' },
            { group: ['@/store/*', '@/components/*', '@/screens/*', '@/app/*'], message: 'The simulation engine must not import application layers.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Engine code must not touch browser globals.' },
        { name: 'document', message: 'Engine code must not touch browser globals.' },
        { name: 'localStorage', message: 'Engine code must not touch browser globals.' },
        { name: 'indexedDB', message: 'Engine code must not touch browser globals.' },
      ],
    },
  },
)
