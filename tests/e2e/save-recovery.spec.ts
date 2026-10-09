import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { goTo, startCampaign } from './helpers'
import { SAVE_ROW } from './prepared'

/**
 * Phase 5 of docs/ROADMAP.md: one save per campaign was one copy. The save
 * before is now kept, and a campaign whose save will not open opens from it.
 */
type Record = { slot: string; state: { currentDay: number; gameId: string } }

async function records(page: Page): Promise<Record[]> {
  return page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const open = indexedDB.open('ciso-first-year')
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    const all: Record[] = await new Promise((resolve, reject) => {
      const request = db.transaction('saves').objectStore('saves').getAll()
      request.onsuccess = () => resolve(request.result as Record[])
      request.onerror = () => reject(request.error)
    })
    db.close()
    return all
  })
}

test('a campaign whose save is damaged opens from the save before it', async ({ page }) => {
  await startCampaign(page, 'e2e-recovery')
  const skip = page.getByRole('button', { name: 'Skip ahead' })
  await skip.click()
  await skip.click()

  // Two forward saves: the latest, and the one before it kept as the backup.
  await expect.poll(async () => (await records(page)).map((record) => record.slot.split(':')[0]).sort()).toEqual(['backup', 'campaign'])
  const saved = await records(page)
  const primary = saved.find((record) => record.slot.startsWith('campaign:'))!
  const backup = saved.find((record) => record.slot.startsWith('backup:'))!
  expect(backup.state.gameId).toBe(primary.state.gameId)
  expect(backup.state.currentDay).toBeLessThan(primary.state.currentDay)

  // Damage the save: it still parses, but it fails the engine's own checks.
  await page.evaluate(async (slot) => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const open = indexedDB.open('ciso-first-year')
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    await new Promise<void>((resolve, reject) => {
      const store = db.transaction('saves', 'readwrite').objectStore('saves')
      const get = store.get(slot)
      get.onsuccess = () => {
        const record = get.result as { state: { currentDay: number } }
        record.state.currentDay = 9999
        const put = store.put(record)
        put.onsuccess = () => resolve()
        put.onerror = () => reject(put.error)
      }
    })
    db.close()
  }, primary.slot)

  await page.reload()
  await page.getByRole('button', { name: SAVE_ROW }).first().click()
  await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('toasts')).toContainText('That save was damaged, so the campaign opened from the one before it')
  // And it is the backup that opened: the date it names is the one the header shows.
  const said = (await page.getByTestId('toasts').textContent()) ?? ''
  const date = /on (\d{1,2} [A-Z][a-z]+)\./.exec(said)?.[1]
  expect(date, said).toBeTruthy()
  await expect(page.locator('header[data-print="hide"]')).toContainText(date!)
})

test('a campaign can be exported mid-year and brought back', async ({ page }) => {
  await startCampaign(page, 'e2e-midyear-export')
  await page.getByRole('button', { name: 'Skip ahead' }).click()
  await goTo(page, 'Your year')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export this campaign' }).click()
  const path = (await (await download).path())!
  const exported = JSON.parse(await readFile(path, 'utf8')) as { state: { currentDay: number; seed: string } }
  expect(exported.state.seed).toBe('e2e-midyear-export')
  expect(exported.state.currentDay).toBeGreaterThan(1)

  // A fresh browser profile: nothing saved, then the file brought back.
  await page.evaluate(() => new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('ciso-first-year')
    request.onsuccess = () => resolve()
    request.onblocked = () => resolve()
  }))
  await page.reload()
  await page.getByRole('button', { name: 'Import a saved campaign' }).click()
  await page.locator('input[type="file"]').setInputFiles(path)
  await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible({ timeout: 20_000 })
  expect(await page.evaluate(() => document.querySelector('header')?.textContent ?? '')).not.toContain('2 January')
})
