// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DecisionDialog } from '@/components/decisions/DecisionDialog'
import { openDecision } from '@/game/decisions/open'
import { useGameStore } from '@/store/game-store'

describe('taking a decision', () => {
  beforeEach(async () => {
    await useGameStore.getState().startNewGame('ui-decision', 'ciso')
  })

  it('shows foreseeable consequences and no hidden numbers', () => {
    const state = useGameStore.getState().state!
    const decisionId = state.decisions.openIds[0]!
    render(<DecisionDialog decisionId={decisionId} onClose={() => {}} />)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('radio').length).toBeGreaterThan(1)
    expect(dialog.textContent ?? '').not.toMatch(/[+-]\d+\s*(security|risk|influence|trust)/i)
  })

  it('records the chosen option and its rationale', async () => {
    const user = userEvent.setup()
    const state = useGameStore.getState().state!
    const decisionId = state.decisions.openIds[0]!
    render(<DecisionDialog decisionId={decisionId} onClose={() => {}} />)

    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getAllByRole('radio')[0]!)
    await user.click(within(dialog).getByRole('button', { name: 'More evidence is required' }))
    await user.click(within(dialog).getByRole('button', { name: /Commit to this/ }))

    const after = useGameStore.getState().state!
    const resolved = after.decisions.decisions[decisionId]!
    expect(resolved.resolvedDay).toBeDefined()
    expect(resolved.rationaleTagIds).toContain('rat-more-evidence')
    expect(after.history.decisionsLog.some((entry) => entry.decisionId === decisionId)).toBe(true)
    const receipt = useGameStore.getState().ui.decisionReceipt!
    expect(receipt).toMatchObject({
      gameId: after.gameId, day: after.currentDay,
      budgetChange: after.resources.budgetRemaining - state.resources.budgetRemaining,
      attentionChange: after.resources.focusRemaining - state.resources.focusRemaining,
      unfundedChange: after.resources.unfundedCommitment - state.resources.unfundedCommitment,
    })
    expect(receipt.messageIds).toEqual(after.inbox.messages.filter((message) => !state.inbox.messages.some((before) => before.id === message.id)).map((message) => message.id))
    expect(receipt.evidenceIds).toEqual(after.evidence.order.filter((id) => !state.evidence.items[id]))
    expect(receipt.evidenceIds.length).toBeGreaterThan(0)
    expect(receipt.choice).toBeTruthy()
  })

  it('receipts report the actual budget and attention spent by a paid choice', async () => {
    let decisionId = ''
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      decisionId = openDecision(state, store.index!, 'dec-msp-access')!.id
      return { state }
    })
    const before = useGameStore.getState().state!
    const user = userEvent.setup()
    render(<DecisionDialog decisionId={decisionId} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    const def = useGameStore.getState().index!.decision.get('dec-msp-access')!
    const option = def.options.find((option) => option.id === 'opt-msp-breakglass')!
    await user.click(within(dialog).getByRole('radio', { name: new RegExp(option.label) }))
    await user.click(within(dialog).getByRole('button', { name: 'More evidence is required' }))
    await user.click(within(dialog).getByRole('button', { name: 'Commit to this' }))
    const after = useGameStore.getState().state!
    expect(before.resources.budgetRemaining - after.resources.budgetRemaining).toBe(80)
    expect(useGameStore.getState().ui.decisionReceipt).toMatchObject({
      choice: option.label, budgetChange: -80,
      attentionChange: after.resources.focusRemaining - before.resources.focusRemaining,
    })
  })

  it('will not let a decision that requires a rationale be taken without one', async () => {
    const user = userEvent.setup()
    const store = useGameStore.getState()
    // Open a decision the content marks as requiring a recorded rationale.
    store.dispatch({ type: 'advance', days: 30 })
    const state = useGameStore.getState().state!
    const requiring = state.decisions.openIds.find((id) => {
      const runtime = state.decisions.decisions[id]
      const def = runtime ? store.index.decision.get(runtime.defId) : undefined
      return def?.requiresRationale
    })
    if (!requiring) return

    render(<DecisionDialog decisionId={requiring} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getAllByRole('radio')[0]!)
    expect(within(dialog).getByRole('button', { name: /Record why first/ })).toHaveAttribute('aria-disabled', 'true')
    expect(useGameStore.getState().ui.decisionReceipt).toBeUndefined()
  })
})
