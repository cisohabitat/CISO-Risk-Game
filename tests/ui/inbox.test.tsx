// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { InboxScreen } from '@/screens/inbox/InboxScreen'
import { useGameStore } from '@/store/game-store'

afterEach(cleanup)

describe('reading an unread backlog', () => {
  for (const finished of [false, true]) {
    for (const previous of ['All', 'Threat']) {
      it(`keeps other messages unread after ${previous} → Unread, finished=${finished}`, async () => {
        await useGameStore.getState().startNewGame('ui-unread', 'ciso')
        useGameStore.setState((store) => {
          const state = structuredClone(store.state!)
          state.finished = finished
          state.inbox.messages = Array.from({ length: 120 }, (_, i) => ({
            id: `mail-${i}`, day: i, from: 'Sentinel SOC', subject: `Signal ${i}`,
            body: `Message ${i}`, type: 'threat' as const, priority: 'routine' as const,
            read: false, pinned: false, relatedNodeIds: [],
          }))
          return { state, ui: { ...store.ui, selectedMessageId: undefined } }
        })
        render(<InboxScreen />)
        fireEvent.click(screen.getByRole('button', { name: previous, exact: true }))
        fireEvent.click(screen.getByRole('button', { name: 'Unread', exact: true }))
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Signal 1')
        expect(useGameStore.getState().state!.inbox.messages.filter((m) => !m.read)).toHaveLength(118)
        fireEvent.click(within(screen.getByRole('list', { name: 'Messages' })).getByRole('button', { name: /Signal 2 / }))
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Signal 2')
        expect(useGameStore.getState().state!.inbox.messages.filter((m) => !m.read)).toHaveLength(117)
      })
    }
  }

  it('shows an empty state when there are no unread messages', async () => {
    await useGameStore.getState().startNewGame('ui-unread-empty', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      for (const message of state.inbox.messages) message.read = true
      return { state }
    })
    render(<InboxScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Unread', exact: true }))
    expect(screen.getByText('Nothing here')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Show all messages' }))
    expect(screen.getByRole('list', { name: 'Messages' })).toBeVisible()
  })
})
