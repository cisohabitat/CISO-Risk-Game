/** Only matching, delivered correspondence can expose a prerecorded voice. */
import { lazy, Suspense } from 'react'
import type { InboxMessage } from '@/game/types'

const PILOT_EVENTS = new Set([
  'evt-day-one', 'evt-con-ceo-honest-returns',
  'evt-audit-report', 'evt-con-next-year-plan',
  'evt-legacy-question', 'evt-con-legacy-fallback-used',
])

const Player = lazy(() => import('./CharacterVoicePlayer').catch(() => ({ default: () => null })))

export function CharacterVoice({ message }: { message: InboxMessage }) {
  if (!message.eventId || !PILOT_EVENTS.has(message.eventId)) return null
  return <Suspense fallback={null}><Player key={message.id} message={message} /></Suspense>
}
