// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DecisionDialog } from '@/components/decisions/DecisionDialog'
import { openDecision } from '@/game/decisions/open'
import { useGameStore } from '@/store/game-store'

/**
 * The dialog offers only the reasons a decision can be taken for. With the
 * whole vocabulary on every card, "residual risk is within tolerance" was
 * recorded under "stand up incident command now".
 */
describe('the decision dialog', () => {
  it('offers only the reasons the decision names', async () => {
    await useGameStore.getState().startNewGame('ui-rationale', 'ciso')
    const store = useGameStore.getState()
    const state = structuredClone(store.state!)
    const runtime = openDecision(state, store.index, 'dec-inc-command')!
    useGameStore.setState({ state })

    render(<DecisionDialog decisionId={runtime.id} onClose={() => undefined} />)
    expect(screen.getByRole('button', { name: 'The consequence is material' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Residual risk is within tolerance' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'The system retires imminently' })).toBeNull()
  })
})
