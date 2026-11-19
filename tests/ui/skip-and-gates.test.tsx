// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { ObjectiveTracker } from '@/components/game/ObjectiveTracker'
import { SkippedMail } from '@/components/game/BriefingNotes'
import { pushMessage } from '@/game/inbox/messages'

beforeEach(async () => { await useGameStore.getState().startNewGame('skip-and-gates', 'ciso') })
afterEach(cleanup)

// 19 November: a security check is shown before its day, and its answer after.
it('shows each security check before it happens, and how it went after', () => {
  const state = structuredClone(useGameStore.getState().state!)
  state.business.objectives['obj-platform-launch']!.status = 'active'
  state.business.objectives['obj-acquisition']!.status = 'active'
  state.business.objectives['obj-acquisition']!.gate = 'unmet'
  useGameStore.setState({ state })
  render(<ObjectiveTracker />)
  const region = screen.getByRole('region', { name: 'Business objectives' })
  expect(region).toHaveTextContent('Security check on')
  expect(region).toHaveTextContent('Go-live review. It will ask who can administer checkout and how they sign in.')
  expect(region).toHaveTextContent('held; 45 days lost.')
})

// 19 November: Skip runs past the mail, so the Briefing says what arrived.
it('lists the unread letters one Skip ahead carried past', () => {
  const store = useGameStore.getState()
  const state = structuredClone(store.state!)
  state.decisions.openIds = []; state.pendingEffects = []
  state.threats.actors = {}; state.threats.campaigns = []
  state.events.suppressedEventIds = store.index!.content.events.map((event) => event.id)
  for (const objective of Object.values(state.business.objectives)) objective.status = 'achieved'
  state.currentDay = 100
  pushMessage(state, { from: 'Sentinel SOC', subject: 'Already here', body: 'Before the skip.', type: 'threat' })
  useGameStore.setState({ state })
  // A letter that will arrive during the skip.
  useGameStore.setState({ state: { ...useGameStore.getState().state!, pendingEffects: [{ id: 'mid-skip', day: 120, source: 'decision:dec-pentest-scope', note: 'Mid-skip.', effects: [] }] } })
  useGameStore.getState().advanceDays(364, true)
  const summary = useGameStore.getState().ui.skipSummary
  expect(summary?.messageIds.length).toBeGreaterThan(0)
  expect(useGameStore.getState().ui.toasts.some((toast) => /arrived on the way/.test(toast.message))).toBe(true)
  render(<SkippedMail />)
  expect(screen.getByLabelText('While you skipped')).toHaveTextContent('While you skipped')
  fireEvent.click(screen.getByRole('button', { name: 'Read the earliest' }))
  expect(useGameStore.getState().ui.screen).toBe('inbox')
})

it('shows only who checks and when on High pressure', async () => {
  await useGameStore.getState().startNewGame('gates-high', 'high-pressure')
  const state = structuredClone(useGameStore.getState().state!)
  state.business.objectives['obj-platform-launch']!.status = 'active'
  useGameStore.setState({ state })
  render(<ObjectiveTracker />)
  const region = screen.getByRole('region', { name: 'Business objectives' })
  expect(region).toHaveTextContent('by the go-live review.')
  expect(region).not.toHaveTextContent('It will ask who can administer checkout')
})
