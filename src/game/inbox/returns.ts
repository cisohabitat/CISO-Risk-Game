import type { ContentIndex, InboxMessage } from '../types'

export type MessageReturnKind = 'result' | 'consequence' | 'lapse' | 'acceptance' | 'stopped' | 'incident' | 'delivery'

/** Recorded return messages, shared by the Briefing and Inbox; read state is separate. */
export function messageReturnKind(message: InboxMessage, index: ContentIndex): MessageReturnKind | undefined {
  const event = message.eventId ? index.event.get(message.eventId) : undefined
  const tags = event?.tags ?? []
  let kind: MessageReturnKind | undefined
  if (message.subject.startsWith('Completed: ')) kind = 'result'
  else if (message.subject.startsWith('Decided without you: ')) kind = 'lapse'
  else if (message.subject.startsWith('Followed up: ')) kind = 'consequence'
  else if (message.subject.startsWith('Your acceptance of ')) kind = 'acceptance'
  else if (message.subject.startsWith('Pulled back: ') || message.subject.startsWith('Paused: ')) kind = 'stopped'
  else if (message.type === 'programme' && (message.subject.startsWith('Delivered: ') || message.subject.startsWith('Milestone: '))) kind = 'delivery'
  else if (event?.followUp || tags.includes('consequence')) kind = 'consequence'
  // Skip ahead can carry a player from containment to closure in one
  // click, leaving the consequence, recovery and debrief in the inbox.
  else if (message.type === 'incident') kind = 'incident'
  return kind
}

