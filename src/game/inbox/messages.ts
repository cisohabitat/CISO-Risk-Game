/**
 * The inbox is a narrative surface, not the event database (plan §28.2).
 * Only things a CISO would actually be told land here.
 */
import type { EventPriority, EventType, GameState, InboxMessage } from '../types'

export interface MessageDraft {
  from: string
  subject: string
  body: string
  type: EventType
  priority?: EventPriority
  decisionId?: string
  relatedNodeIds?: string[]
  eventId?: string
  pinned?: boolean
}

export function pushMessage(state: GameState, draft: MessageDraft): InboxMessage {
  state.inbox.counter += 1
  const message: InboxMessage = {
    id: `msg-${state.inbox.counter}`,
    day: state.currentDay,
    from: draft.from,
    subject: draft.subject,
    body: draft.body,
    type: draft.type,
    priority: draft.priority ?? 'routine',
    read: false,
    pinned: draft.pinned ?? false,
    decisionId: draft.decisionId,
    relatedNodeIds: draft.relatedNodeIds ?? [],
    eventId: draft.eventId,
  }
  state.inbox.messages.unshift(message)
  // Keep the inbox bounded: old routine traffic ages out, open decisions never do.
  if (state.inbox.messages.length > 220) {
    const keep: InboxMessage[] = []
    for (const item of state.inbox.messages) {
      if (keep.length < 180 || item.pinned || (item.decisionId && !item.read)) keep.push(item)
    }
    state.inbox.messages = keep
  }
  return message
}

export function unreadCount(state: GameState): number {
  return state.inbox.messages.filter((m) => !m.read).length
}
