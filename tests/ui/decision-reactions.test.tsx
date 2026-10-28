// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { decisionReactions } from '@/store/decision-reactions'
import { CampaignFeedbackView } from '@/components/game/CampaignFeedbackView'

// The receipt said only "Choice recorded in your decision log", so telling the
// CEO you would not guess read the same as an answer that cost nothing.
it('names the reactions a decision caused straight away, in words', async () => {
  await useGameStore.getState().startNewGame('decision-reactions', 'ciso')
  const store = useGameStore.getState()
  const index = store.index!
  let found: string | undefined
  for (let day = 0; day < 10 && !found; day += 1) {
    const state = useGameStore.getState().state!
    found = state.decisions.openIds.find((id) => state.decisions.decisions[id]?.defId === 'dec-ceo-three-risks')
    if (!found) useGameStore.getState().advanceDays(1)
  }
  expect(found).toBeDefined()
  const before = structuredClone(useGameStore.getState().state!)
  const result = useGameStore.getState().dispatch({ type: 'resolveDecision', decisionId: found!, optionId: 'opt-ceo-vague', rationaleTagIds: [] })
  expect(result.ok).toBe(true)
  const reactions = decisionReactions(before, useGameStore.getState().state!, index)
  const ceo = index.stakeholder.get('stk-ceo')!.name
  expect(reactions).toContainEqual({ text: `${ceo}: You gave her a conference talk instead of an answer.`, tone: 'negative' })
  for (const reaction of reactions) expect(reaction.text).not.toMatch(/\d/)

  const state = useGameStore.getState().state!
  useGameStore.getState().setUi({ decisionReceipt: {
    gameId: state.gameId, year: 1, day: state.currentDay, title: 'The CEO wants your three risks',
    choice: 'Talk in general terms', budgetChange: 0, attentionChange: 0, unfundedChange: 0,
    messageIds: [], evidenceIds: [], reactions,
  } })
  render(<CampaignFeedbackView kind="decision" />)
  expect(screen.getByText(`${ceo}: You gave her a conference talk instead of an answer.`)).toBeVisible()
})
