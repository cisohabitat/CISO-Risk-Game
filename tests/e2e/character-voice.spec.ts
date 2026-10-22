import { expect, test, type ElementHandle } from '@playwright/test'
import { beginCampaign, expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'
import recordings from '../../src/assets/voice/manifest.json' with { type: 'json' }
import type { GameState } from '../../src/game/types'

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

test('new CIO, operations and board voices decode without overlapping or preloading', async ({ page }) => {
  const ids = ['evt-biz-cio-pressure', 'evt-org-ir-plan', 'evt-biz-board-appetite']
  const clips = ids.map((id) => recordings.find((clip) => clip.eventId === id)!)
  const save = prepareCampaign('expanded-voice-ui', 'day:1') as { state: GameState }
  // Delivered-message fixtures isolate media/reader behaviour; this is not a
  // claim that each authored event's conditions occur on day one.
  save.state.inbox.messages = [...save.state.inbox.messages, ...clips.map((clip, index) => ({
    id: `voice-fixture-${index}`, day: save.state.currentDay, eventId: clip.eventId,
    from: clip.from, subject: clip.subject, body: clip.body, type: 'executive' as const,
    priority: 'notable' as const, read: false, pinned: false, relatedNodeIds: [],
  }))]
  await openPreparedCampaign(page, save)
  await goTo(page, 'Inbox')
  let previous: ElementHandle<HTMLElement | SVGElement> | null = null
  for (const clip of clips) {
    await page.getByRole('button', { name: clip.subject, exact: false }).click()
    const audio = page.locator('audio')
    await expect(page.getByRole('button', { name: 'Play message', exact: true })).toBeVisible()
    await expect(audio).not.toHaveAttribute('src')
    if (previous) expect(await previous.evaluate((node: HTMLAudioElement) => node.paused && !node.hasAttribute('src'))).toBe(true)
    await page.getByRole('button', { name: 'Play message', exact: true }).click()
    await expect.poll(() => audio.evaluate((node: HTMLAudioElement) => node.currentTime)).toBeGreaterThan(0)
    await expect(audio).toHaveAccessibleName(`Voice message from ${clip.from}`)
    await expect(page.locator('.correspondence-body')).toContainText(clip.body.split('\n\n')[0])
    await expectNoHorizontalScroll(page)
    previous = await audio.elementHandle()
  }
})
