import { expect, test } from '@playwright/test'
import type { GameState } from '../../src/game/types'
import { expectNoHorizontalScroll, goTo } from './helpers'
import { openPreparedCampaign, prepareCampaign } from './prepared'

test('an appetite decision follows through to Board and the accepted risk', async ({ page }) => {
  const save = prepareCampaign('appetite-browser', 'board') as { state: GameState }
  const state = save.state
  const decisionId = `dec-${++state.decisions.counter}`
  state.decisions.decisions[decisionId] = {
    id: decisionId, defId: 'dec-board-appetite', createdDay: state.currentDay,
    deadlineDay: state.currentDay + 14, resolvedByDefault: false,
    rationaleTagIds: [], assumptionIds: [],
  }
  state.decisions.openIds.unshift(decisionId)
  const risk = Object.values(state.risks.scenarios)[0]!
  risk.status = 'accepted'
  risk.acceptedUntilDay = state.currentDay + 60
  risk.lastAssessed = { day: state.currentDay, residual: 0.3, exposure: 0.3, consequence: 0.4 }
  await openPreparedCampaign(page, save)
  await page.getByRole('button', { name: 'Decide: A risk appetite the committee can use', exact: true }).click()
  const paper = page.getByRole('dialog')
  await paper.getByRole('radio', { name: /Delegate through Moderate/ }).check()
  await paper.getByRole('button', { name: 'The consequence is material' }).click()
  await paper.getByRole('button', { name: 'Commit to this', exact: true }).click()
  await expect(paper).toBeHidden()
  await goTo(page, 'Board')
  await page.getByRole('button', { name: 'Risk appetite and accepted exceptions', exact: true }).click()
  await expect(page.getByText(/outside delegated appetite/)).toBeVisible()
  await expect(page.getByText(/Delegated residual ceiling: Moderate/)).toBeVisible()
  await expectNoHorizontalScroll(page)
  await page.getByRole('button', { name: /^Review:/ }).last().click()
  const detail = page.getByRole('note', { name: 'Risk appetite check' })
  await expect(detail).toContainText('Outside delegated appetite')
  await expect(detail).toContainText('does not establish board approval')
  await expectNoHorizontalScroll(page)
})
