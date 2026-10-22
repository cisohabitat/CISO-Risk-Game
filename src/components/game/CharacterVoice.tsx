/** Only matching, delivered correspondence can expose a prerecorded voice. */
import { lazy, Suspense } from 'react'
import type { InboxMessage } from '@/game/types'
import recordedEvents from '@/assets/voice/event-ids.json'

const RECORDED_EVENTS = new Set(recordedEvents)

const Player = lazy(() => import('./CharacterVoicePlayer').catch(() => ({ default: () => null })))

export function CharacterVoice({ message }: { message: InboxMessage }) {
  if (!message.eventId || !RECORDED_EVENTS.has(message.eventId)) return null
  return <Suspense fallback={null}><Player key={message.id} message={message} /></Suspense>
}
