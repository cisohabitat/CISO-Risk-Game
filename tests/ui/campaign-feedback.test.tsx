// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { CampaignFeedbackView } from '@/components/game/CampaignFeedbackView'
import { CampaignFeedback } from '@/components/game/CampaignFeedback'

beforeEach(async () => { await useGameStore.getState().startNewGame('ui-feedback', 'ciso') })

function atDay(day: number) {
  useGameStore.setState((store) => {
    const state = structuredClone(store.state!)
    state.currentDay = day
    return { state }
  })
}

describe('factual campaign feedback', () => {
  it('opens a recap only on a played quarter boundary, never a fifth quarter', () => {
    atDay(90)
    expect(useGameStore.getState().ui.quarterTransition).toBeUndefined()
    useGameStore.getState().advanceDays(1)
    expect(useGameStore.getState().ui.quarterTransition?.quarter).toBe(2)
    render(<CampaignFeedbackView kind="quarter" />)
    expect(screen.getByRole('heading', { name: 'Q1 in the record. Q2 ahead.' })).toBeVisible()
    expect(screen.getByText('Q1 board paper: awaiting your paper.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss quarter recap' }))
    expect(useGameStore.getState().ui.quarterTransition).toBeUndefined()
    atDay(363)
    useGameStore.getState().advanceDays(1)
    expect(useGameStore.getState().ui.quarterTransition).toBeUndefined()
  })

  it('does not reopen feedback when a save is imported or a new campaign starts', async () => {
    atDay(90)
    useGameStore.getState().advanceDays(1)
    const save = structuredClone(useGameStore.getState().state!)
    expect(useGameStore.getState().ui.quarterTransition).toBeDefined()
    expect(await useGameStore.getState().loadImported(save)).toBe(true)
    expect(useGameStore.getState().ui.quarterTransition).toBeUndefined()
    useGameStore.getState().setUi({ quarterTransition: { gameId: save.gameId, year: 1, quarter: 2 } })
    await useGameStore.getState().startNewGame('ui-next-feedback', 'ciso')
    expect(useGameStore.getState().ui.quarterTransition).toBeUndefined()
  })

  it('shows recorded changes without inventing delayed outcomes and preserves message navigation', () => {
    const state = useGameStore.getState().state!
    const message = state.inbox.messages[0]!
    useGameStore.getState().setUi({ decisionReceipt: {
      gameId: state.gameId, year: 1, day: state.currentDay,
      title: 'Recorded choice', choice: 'Investigate first', budgetChange: -25,
      attentionChange: -2, unfundedChange: 0, messageIds: [message.id, 'expired-message'], evidenceIds: [],
    } })
    render(<CampaignFeedbackView kind="decision" />)
    expect(screen.getByRole('heading', { name: 'Recorded choice' })).toBeVisible()
    expect(screen.getByText('Attention −2')).toBeVisible()
    expect(screen.queryByText(message.subject)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '1 new message' }))
    fireEvent.click(screen.getByRole('button', { name: message.subject }))
    expect(useGameStore.getState().ui).toMatchObject({ screen: 'inbox', selectedMessageId: message.id })
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss decision receipt' }))
    expect(useGameStore.getState().ui.decisionReceipt).toBeUndefined()
  })

  it('counts player choices separately from defaults and preserves completed board status', () => {
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.history.decisionsLog = [
        { day: 3, decisionId: 'manual', optionId: 'a', rationaleTagIds: [] },
        { day: 40, decisionId: 'automatic', optionId: 'b', rationaleTagIds: [] },
        { day: 91, decisionId: 'next-quarter', optionId: 'c', rationaleTagIds: [] },
      ]
      const template = Object.values(state.decisions.decisions)[0]!
      state.decisions.decisions.automatic = { ...template, resolvedByDefault: true }
      state.reviews.quarters = [{ quarter: 1, day: 92, topicsChosen: [], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: '', completed: true }]
      return { state, ui: { ...store.ui, quarterTransition: { gameId: state.gameId, year: 1, quarter: 2 } } }
    })
    render(<CampaignFeedbackView kind="quarter" />)
    expect(screen.getByText('1 choice recorded · 0 programmes completed')).toBeVisible()
    expect(screen.getByText('Q1 board paper: submitted.')).toBeVisible()
  })

  it('never shows a receipt belonging to a different campaign', () => {
    useGameStore.getState().setUi({ quarterTransition: { gameId: 'other', year: 1, quarter: 2 } })
    const { container } = render(<CampaignFeedback kind="quarter" />)
    expect(container).toBeEmptyDOMElement()
  })
})
