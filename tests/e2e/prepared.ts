import { execFileSync } from 'node:child_process'
import { expect, type Page } from '@playwright/test'

/**
 * A campaign played by the engine and loaded into the browser as the player's
 * own save, for screens that only exist months into a year. The playing is
 * done by `scripts/prepare-campaign.ts`; see there for why it is not done here.
 */
export type Stop = 'pattern' | 'board' | 'incident' | 'year-end' | `day:${number}`

export function prepareCampaign(seed: string, stop: Stop, difficulty = 'ciso'): unknown {
  const out = execFileSync('node_modules/.bin/tsx', ['scripts/prepare-campaign.ts', seed, stop, difficulty], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return JSON.parse(out)
}

/** Put a prepared campaign in the browser's save store and open it from the start screen. */
export async function openPreparedCampaign(page: Page, save: unknown): Promise<void> {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'CISO: First Year' })).toBeVisible()
  await page.evaluate(async (record) => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const open = indexedDB.open('ciso-first-year')
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite')
      tx.objectStore('saves').put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  }, save)
  await page.reload()
  await page.getByRole('button', { name: /Day \d+/ }).first().click()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
}
