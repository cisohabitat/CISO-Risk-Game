// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RiskDetail } from '@/components/risk/RiskDetail'
import { useGameStore } from '@/store/game-store'
import { visibleRisks } from '@/store/selectors'

/**
 * A playtest pressed "Link to treatment" on a risk whose only treatment had
 * not started and was refused after the click; on another it linked to a
 * programme the button never named. And "Review due" never said what a
 * review asked for.
 */
describe('treating a risk from its detail', () => {
  it('names the programme it links to, and says so when none has started', async () => {
    await useGameStore.getState().startNewGame('ui-risk-treatment', 'ciso')
    const store = useGameStore.getState()
    const index = store.index!
    // A risk treated only by a programme nobody has started yet.
    const risk = visibleRisks(store.state!, index).find((r) => {
      const ids = index.riskScenario.get(r.id)?.treatmentProgrammeIds ?? []
      return ids.length === 1
    })!
    expect(risk).toBeDefined()
    const programme = index.programme.get(index.riskScenario.get(risk.id)!.treatmentProgrammeIds[0]!)!

    const { unmount } = render(<RiskDetail risk={risk} onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /^Link to/ })).toBeNull()
    expect(screen.getByText(new RegExp(`Treated by ${programme.name}, which has not`))).toBeTruthy()
    unmount()

    expect(store.dispatch({ type: 'startProgramme', programmeId: programme.id, budget: programme.budgetCost }).ok).toBe(true)
    render(<RiskDetail risk={risk} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: `Link to ${programme.name}` })).toBeTruthy()
  })

  it('says what a review asks for when one is due', async () => {
    await useGameStore.getState().startNewGame('ui-risk-review', 'ciso')
    const { state, index } = useGameStore.getState()
    const risk = { ...visibleRisks(state!, index!)[0]!, reviewDue: true }
    render(<RiskDetail risk={risk} onClose={() => {}} />)
    expect(screen.getByText(/A review is a decision about this risk/)).toBeTruthy()
  })
})
