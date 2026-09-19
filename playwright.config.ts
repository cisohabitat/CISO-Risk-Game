import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/**
 * Some sandboxes ship a pre-installed Chromium at a fixed path rather than the
 * revision Playwright would download. Use it when it is there.
 */
const LOCAL_CHROMIUM = '/opt/pw-browsers/chromium'
const chromiumLaunch = existsSync(LOCAL_CHROMIUM)
  ? { executablePath: LOCAL_CHROMIUM, args: ['--no-sandbox'] }
  : {}

/**
 * Responsive and end-to-end coverage (plan §32.10, §42.5).
 *
 * Tests run against the production build so what is verified is what ships.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    video: 'off',
  },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, launchOptions: chromiumLaunch },
    },
    {
      // WebKit coverage per plan §32.10. Requires `pnpm exec playwright install webkit`.
      name: 'desktop-webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'tablet-portrait',
      use: { ...devices['Galaxy Tab S4'], viewport: { width: 834, height: 1112 }, browserName: 'chromium', launchOptions: chromiumLaunch },
    },
    {
      name: 'tablet-landscape',
      use: { ...devices['Galaxy Tab S4 landscape'], viewport: { width: 1112, height: 834 }, browserName: 'chromium', launchOptions: chromiumLaunch },
    },
    {
      name: 'phone',
      use: { ...devices['Pixel 7'], viewport: { width: 393, height: 852 }, browserName: 'chromium', launchOptions: chromiumLaunch },
    },
    {
      // The 320px floor the plan treats as a release gate (plan §42.5).
      name: 'phone-320',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 640 },
        hasTouch: true,
        launchOptions: chromiumLaunch,
      },
    },
  ],
})
