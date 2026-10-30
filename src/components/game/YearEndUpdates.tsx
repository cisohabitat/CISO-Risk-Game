import { Button, Card, CardBody, Disclosure } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { shortDate } from '@/lib/formatting/labels'
import { CAMPAIGN_DAYS } from '@/game/types'
import { DECEMBER_START_DAY } from '@/game/time'

export function YearEndUpdates() {
  const state = useGameStore((store) => store.state)
  const handover = useGameStore((store) => store.ui.yearEndUpdates)
  const screen = useGameStore((store) => store.ui.screen)
  if (state && !state.finished && state.currentDay >= CAMPAIGN_DAYS) return <Card className="mb-4 border-brass/50"><CardBody><h2 className="font-display text-xl">Finish your final day</h2><p className="mt-2 text-sm">Time is held on 31 December. Read the final correspondence and make any remaining decisions before choosing Close year. The annual review has not been written yet.</p><Button variant="secondary" onClick={() => useGameStore.getState().setScreen('inbox')}>Read final correspondence</Button></CardBody></Card>
  if (!state?.finished || !state.reviews.annual || screen === 'debrief') return null
  const current = handover?.gameId === state.gameId && handover.year === (state.year ?? 1)
  const messages = current ? handover.messageIds.flatMap((id) => state.inbox.messages.find((message) => message.id === id) ?? []) : []
  const budget = state.history.entries.filter((entry) => entry.kind === 'budget' && entry.day >= DECEMBER_START_DAY)
  return <Card className="mb-4 border-brass/50 bg-brass-soft/40"><CardBody>
    <h2 className="font-display text-xl">The year has closed</h2>
    <p className="mt-2 text-sm">The review is written. {current ? 'Final updates stay available here before you open it. Reading them does not advance time or change the finished year.' : 'You can revisit the correspondence or read the annual review.'}</p>
    {current && <Disclosure summary={`December correspondence (${messages.length})`} defaultOpen>
      {messages.length === 0 ? <p className="text-sm">No December messages are retained in this campaign.</p> : <ul className="space-y-2">{messages.map((message) => <li key={message.id} className="text-sm"><Button variant="quiet" size="sm" onClick={() => { useGameStore.getState().setUi({ selectedMessageId: message.id }); useGameStore.getState().setScreen('inbox') }}>{shortDate(message.day)} · {message.subject}{message.read ? ' · opened' : ' · unread'}</Button></li>)}</ul>}
    </Disclosure>}
    {current && budget.length > 0 && <p className="mt-2 text-sm">December budget activity: {budget.map((entry) => `${shortDate(entry.day)}: ${entry.summary}`).join(' ')}</p>}
    <div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => useGameStore.getState().setScreen('inbox')}>Read final updates</Button><Button variant="primary" onClick={() => useGameStore.getState().setScreen('debrief')}>Read the annual review</Button></div>
  </CardBody></Card>
}
