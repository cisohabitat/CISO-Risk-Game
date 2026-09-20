// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CameBack } from '@/components/game/CameBack'
import { useGameStore } from '@/store/game-store'
import { cameBack } from '@/store/selectors'
import type { InboxMessage } from '@/game/types'

/**
 * The briefing says what needs an answer; this block says what the answers
 * did. The first observed playtest missed a thin enquiry result, an unraised
 * hypothesis and a successful follow-up for weeks, all sitting in the inbox.
 */
function message(partial: Partial<InboxMessage> & Pick<InboxMessage, 'id' | 'subject'>): InboxMessage {
  return {
    day: 30, from: 'Callum Reid', body: 'Body.', type: 'discovery', priority: 'notable', read: false,
    pinned: false, relatedNodeIds: [], ...partial,
  }
}

describe('what came back to you', () => {
  it('lists the player\'s own results and follow-ups, unread, and not the rest', async () => {
    await useGameStore.getState().startNewGame('ui-came-back', 'ciso')
    const store = useGameStore.getState()
    const callbackId = store.index.content.events.find((e) => e.tags.includes('consequence'))!.id
    useGameStore.setState((s) => ({
      state: {
        ...s.state!,
        inbox: {
          ...s.state!.inbox,
          messages: [
            message({ id: 'm-result', subject: 'Completed: Critical business service review' }),
            message({ id: 'm-callback', subject: 'She remembered', from: 'Marianne Okafor', type: 'executive', eventId: callbackId }),
            message({ id: 'm-lapse', subject: 'Decided without you: The CEO wants your three risks', from: 'Nexora Group', type: 'executive' }),
            message({ id: 'm-read', subject: 'Completed: Privileged access review', read: true }),
            message({ id: 'm-routine', subject: 'Third sector ransomware case this quarter', from: 'Threat intelligence', type: 'threat' }),
            ...s.state!.inbox.messages,
          ],
        },
      },
    }))
    const items = cameBack(useGameStore.getState().state!, store.index)
    expect(items.map((i) => i.id)).toEqual(['m-result', 'm-callback', 'm-lapse'])

    render(<CameBack />)
    expect(screen.getByText('Came back to you')).toBeInTheDocument()
    expect(screen.getByText('Completed: Critical business service review')).toBeInTheDocument()
    expect(screen.queryByText('Completed: Privileged access review')).toBeNull()
    expect(screen.queryByText('Third sector ransomware case this quarter')).toBeNull()

    // Reading one takes the player to that message in the inbox.
    fireEvent.click(screen.getAllByRole('button', { name: 'Read' })[0]!)
    expect(useGameStore.getState().ui.screen).toBe('inbox')
    expect(useGameStore.getState().ui.selectedMessageId).toBe('m-result')
  })

  it('renders nothing when nothing has come back', async () => {
    await useGameStore.getState().startNewGame('ui-came-back-2', 'ciso')
    useGameStore.setState((s) => ({ state: { ...s.state!, inbox: { ...s.state!.inbox, messages: [] } } }))
    const { container } = render(<CameBack />)
    expect(container.innerHTML).toBe('')
  })
})
