// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { CampaignFeedbackView } from '@/components/game/CampaignFeedbackView'
import { quarterFeedback } from '@/store/quarter-feedback'
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


describe('quarterly guidance', () => {
  it('names all struggling functions separately from available capacity and routes to the team', () => {
    const state = structuredClone(useGameStore.getState().state!)
    const index = useGameStore.getState().index!
    state.currentDay = 92
    state.decisions.openIds = []
    state.reviews.pendingQuarter = undefined
    state.reviews.quarters = [{ quarter: 1, day: 92, topicsChosen: [], recommendationIds: [], uncertaintyCommunicated: true, boardReaction: 'The board follows the argument.', completed: true }]
    for (const fn of Object.values(state.team.functions)) { fn.morale = 0.8; fn.committed = 0 }
    state.team.functions.soc!.morale = 0.2
    state.team.functions.engineering!.morale = 0.4
    const before = structuredClone(state)
    const feedback = quarterFeedback(state, index, 1)
    expect(feedback.concerns.join(' ')).toContain('SOC and detection — burning out')
    expect(feedback.concerns.join(' ')).toContain('Security engineering — strained')
    expect(feedback.concerns.join(' ')).not.toContain('Workload today:')
    expect(feedback.next.screen).toBe('team')
    expect(state).toEqual(before)
    useGameStore.setState((store) => ({ state, ui: { ...store.ui, quarterTransition: { gameId: state.gameId, year: 1, quarter: 2 } } }))
    render(<CampaignFeedbackView kind="quarter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Review commitments' }))
    expect(useGameStore.getState().ui.screen).toBe('team')
  })

  it('counts completion dates and lapse dates within the quarter, including in year two', () => {
    const state = structuredClone(useGameStore.getState().state!)
    const index = useGameStore.getState().index!
    state.year = 2; state.currentDay = 92
    const programme = Object.values(state.programmes.programmes)[0]!
    Object.assign(programme, { status: 'complete', startedDay: -50, completedDay: -1 })
    const decision = Object.values(state.decisions.decisions)[0]!
    Object.assign(decision, { resolvedByDefault: true, resolvedDay: 90 })
    expect(quarterFeedback(state, index, 1).completed).toHaveLength(0)
    expect(quarterFeedback(state, index, 1).concerns.join(' ')).toContain('1 decision lapsed')
    programme.completedDay = 0
    expect(quarterFeedback(state, index, 1).completed).toHaveLength(1)
    programme.completedDay = 91; decision.resolvedDay = 91
    expect(quarterFeedback(state, index, 1).completed).toHaveLength(0)
    expect(quarterFeedback(state, index, 1).concerns.join(' ')).not.toContain('decision lapsed')
  })

  it('keeps a pending board paper actionable and includes unresolved blockers on paused work', () => {
    const state = structuredClone(useGameStore.getState().state!)
    const index = useGameStore.getState().index!
    state.decisions.openIds = []
    state.reviews.pendingQuarter = 1
    expect(quarterFeedback(state, index, 1).next.screen).toBe('board')
    state.reviews.pendingQuarter = undefined
    for (const fn of Object.values(state.team.functions)) { fn.morale = 0.8; fn.committed = 0 }
    const def = index.content.programmes.find((programme) => programme.blockers.length > 0)!
    const programme = state.programmes.programmes[def.id]!
    programme.status = 'paused'
    programme.blockers = [{ id: def.blockers[0]!.id, startedDay: 50, resolved: false }]
    const feedback = quarterFeedback(state, index, 1)
    expect(feedback.concerns.join(' ')).toContain(def.blockers[0]!.name)
    expect(feedback.next.screen).toBe('programmes')
    programme.blockers[0]!.resolved = true
    expect(quarterFeedback(state, index, 1).blocked).toHaveLength(0)
  })

  it('does not infer feedback from hidden risk truth and opens the recorded next decision', () => {
    const state = structuredClone(useGameStore.getState().state!)
    const index = useGameStore.getState().index!
    const before = quarterFeedback(state, index, 1)
    for (const node of Object.values(state.organisation.nodes)) node.exposure = 1 - node.exposure
    state.risks.initialMateriality = Object.fromEntries(index.content.riskScenarios.map((risk) => [risk.id, 1]))
    const after = quarterFeedback(state, index, 1)
    expect(after.strengths).toEqual(before.strengths)
    expect(after.concerns).toEqual(before.concerns)
    expect(after.next).toEqual(before.next)
    expect(after.next.decisionId).toBeDefined()
    useGameStore.setState((store) => ({ state, ui: { ...store.ui, quarterTransition: { gameId: state.gameId, year: 1, quarter: 2 } } }))
    render(<CampaignFeedbackView kind="quarter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Review next decision' }))
    expect(useGameStore.getState().ui.openDecisionId).toBe(after.next.decisionId)
  })
})
