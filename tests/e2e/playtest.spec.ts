import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { goTo } from './helpers'

/**
 * Phase 0 of docs/ROADMAP.md, as a facilitator runs it: a link that turns
 * recording on, a player who can see that it is on, and a file at the end.
 */
test('a facilitator link records the session and hands it over as a file', async ({ page }) => {
  await page.goto('/?playtest')
  await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()

  // The player is told, before they begin, and can switch it off.
  const consent = page.getByRole('checkbox', { name: 'Record this session for a playtest' })
  await expect(consent).toBeVisible()
  await expect(consent).toBeChecked()

  await page.getByLabel('Campaign seed').fill('e2e-playtest')
  await page.getByRole('button', { name: 'Begin your first day' }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible({ timeout: 20_000 })
  await goTo(page, 'Risk')

  // Shown wherever the player is, on the rail or under More.
  const width = page.viewportSize()?.width ?? 1280
  if (width < 1024) await page.getByRole('button', { name: 'More' }).click()
  const control = page.getByTestId('recording-control').filter({ visible: true })
  await expect(control).toContainText('Recording this session')

  const download = page.waitForEvent('download')
  await control.getByRole('button', { name: 'Stop and export' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^ciso-session-\d{4}-\d{2}-\d{2}\.json$/)
  const log = JSON.parse(await readFile((await file.path())!, 'utf8')) as { events: { kind: string; seed?: string; screen?: string }[] }
  expect(log.events.find((event) => event.kind === 'campaign')?.seed).toBe('e2e-playtest')
  expect(log.events.some((event) => event.kind === 'screen' && event.screen === 'risk')).toBe(true)

  // Stopped means stopped: the control goes, and so does the log.
  await expect(page.getByTestId('recording-control').filter({ visible: true })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('ciso-session-log'))).toBeNull()
})

test('a player who is not in a playtest is not recorded', async ({ page }) => {
  await page.goto('/')
  await page.locator('summary', { hasText: 'Replay settings' }).click()
  await expect(page.getByRole('checkbox', { name: 'Record this session for a playtest' })).not.toBeChecked()
  expect(await page.evaluate(() => localStorage.getItem('ciso-session-recording'))).toBeNull()
})
