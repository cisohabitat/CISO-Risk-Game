// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { ProgrammesScreen } from '@/screens/programmes/ProgrammesScreen'

it('separates paused, actually blocked and completed work without treating at-risk as a blocker', async () => {
  await useGameStore.getState().startNewGame('ui-programme-groups', 'ciso')
  useGameStore.setState((store) => {
    const state = structuredClone(store.state!)
    const defs = store.index!.content.programmes
    const running = defs[0]!
    const paused = defs[1]!
    const blocked = defs.find((def) => def.id !== running.id && def.id !== paused.id && def.blockers.length > 0)!
    const completed = defs.find((def) => ![running.id, paused.id, blocked.id].includes(def.id))!
    state.programmes.programmes[running.id]!.status = 'at-risk'
    state.programmes.programmes[paused.id]!.status = 'paused'
    state.programmes.programmes[blocked.id]!.status = 'active'
    state.programmes.programmes[blocked.id]!.blockers = [{ id: blocked.blockers[0]!.id, startedDay: state.currentDay, resolved: false }]
    state.programmes.programmes[completed.id]!.status = 'complete'
    state.programmes.programmes[completed.id]!.completedDay = state.currentDay
    return { state }
  })
  render(<ProgrammesScreen />)
  for (const label of ['Running', 'Paused', 'Blocked', 'Completed']) expect(screen.getByRole('heading', { name: `${label} 1 programme` })).toBeVisible()
  expect(screen.getByText('Delivery blocked')).toBeVisible()
  expect(screen.getByText('Delivery paused')).toBeVisible()
})
