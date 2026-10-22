import { expect, test } from '@playwright/test'
import { beginCampaign, expectNoHorizontalScroll, goTo } from './helpers'

test('character speech is requested explicitly, decodes, stops on navigation and preserves text', async ({ page }) => {
  const audioRequests: string[] = []
  page.on('request', (request) => { if (/\.mp3(?:\?|$)/.test(request.url())) audioRequests.push(request.url()) })
  await page.goto('/')
  await beginCampaign(page, 'voice-pilot')
  await goTo(page, 'Inbox')
  await page.getByRole('button', { name: 'The CEO meeting starts in 23 minutes', exact: false }).click()
  await expect(page.getByRole('button', { name: 'Play message', exact: true })).toBeVisible()
  expect(audioRequests).toHaveLength(0)
  const audio = page.locator('audio')
  await expect(audio).not.toHaveAttribute('src')
  await page.getByRole('button', { name: 'Play message', exact: true }).click()
  // Exercise real media decoding in both Chromium and WebKit, without mocking play().
  await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.duration)).toBeGreaterThan(5)
  await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.currentTime)).toBeGreaterThan(0)
  await expect(page.locator('.correspondence-body')).toContainText('Welcome aboard.')
  await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: 'Stop voice', exact: true }).click()
  expect(await audio.evaluate((node: HTMLAudioElement) => node.paused)).toBe(true)
  await page.getByRole('button', { name: 'Replay message', exact: true }).click()
  await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.currentTime)).toBeGreaterThan(0)
  const playing = await audio.elementHandle()
  await goTo(page, 'Briefing')
  expect(await playing!.evaluate((node: HTMLAudioElement) => node.paused && !node.hasAttribute('src'))).toBe(true)
  expect(audioRequests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true)
})
