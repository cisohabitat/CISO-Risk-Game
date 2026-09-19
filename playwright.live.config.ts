import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

/** Same pre-installed-Chromium fallback as the main config. */
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium'
const chromiumLaunch = existsSync(LOCAL_CHROMIUM)
  ? { executablePath: LOCAL_CHROMIUM, args: ['--no-sandbox'] }
  : {}

/**
 * Runs the end-to-end and accessibility suites against an already-deployed
 * build instead of a local preview server.
 *
 *   BASE_URL=https://your-deployment.vercel.app pnpm test:e2e:live
 *
 * This is the last item on the release gate in docs/HOSTING.md: everything else
 * is verified against `dist/` locally, but only a run against the real
 * deployment proves the hosting configuration — rewrites, headers, caching and
 * asset paths — is actually right.
 */
const baseURL = process.env.BASE_URL

if (!baseURL) {
  throw new Error('Set BASE_URL to the deployment you want to test, e.g. https://ciso-risk-game.vercel.app')
}

export default defineConfig({
  ...base,
  // No webServer: the deployment under test is already running.
  webServer: undefined,
  use: { ...base.use, baseURL },
  projects: [
    {
      name: 'live-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: chromiumLaunch },
    },
    {
      name: 'live-phone',
      use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions: chromiumLaunch },
    },
  ],
})
