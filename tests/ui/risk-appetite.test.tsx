// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RiskAppetite, RiskAcceptanceAppetite } from '@/components/game/RiskAppetite'
import { useGameStore } from '@/store/game-store'
import { openDecision } from '@/game/decisions/open'
import { applyAction } from '@/game/engine/orchestrator'

afterEach(cleanup)
it('shows an unknown acceptance as requiring assessment and routes from Board to the exact risk', async () => {
  await useGameStore.getState().startNewGame('appetite-ui', 'guided')
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  const decision = openDecision(state, store.index!, 'dec-board-appetite')!
  applyAction(state, store.index!, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-appetite-moderate', rationaleTagIds: ['rat-material'] })
  const risk = Object.values(state.risks.scenarios)[0]!
  risk.status = 'accepted'
  risk.lastAssessed = null
  useGameStore.setState({ state })
  render(<><RiskAppetite /><RiskAcceptanceAppetite scenarioId={risk.id} /></>)
  expect(screen.getByRole('note')).toHaveTextContent('Appetite needs an assessment')
  fireEvent.click(screen.getByRole('button', { name: 'Risk appetite and accepted exceptions' }))
  expect(screen.getByText(/assessment needed before judging appetite/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: /^Review:/ }))
  expect(useGameStore.getState().ui).toMatchObject({ screen: 'risk', selectedScenarioId: risk.id, riskTab: 'risks' })
})
