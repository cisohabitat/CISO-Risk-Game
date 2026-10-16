/**
 * Inbox (plan §28.2). A narrative surface: what the organisation is telling
 * you, in its own voice, not a dump of the event database.
 *
 * Mobile shows a list that pushes to a reader; tablet and desktop show both.
 */
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, EmptyState, SegmentedControl } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { PersonPortrait } from '@/components/game/Person'
import { NexoraMark } from '@/components/game/NexoraMark'
import { Terms } from '@/components/game/Terms'
import { cn } from '@/lib/utils/cn'
import { formatGameDate } from '@/game/time'
import { shortDate } from '@/lib/formatting/labels'
import type { InboxMessage } from '@/game/types'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'decisions', label: 'Needs a decision' },
  { id: 'threat', label: 'Threat' },
  { id: 'business', label: 'Business' },
] as const

type Filter = (typeof FILTERS)[number]['id']

export function InboxScreen() {
  const index = useCampaignIndex()
  const state = useGameStore((store) => store.state)
  const dispatch = useGameStore((store) => store.dispatch)
  const setUi = useGameStore((store) => store.setUi)
  const selectedId = useGameStore((store) => store.ui.selectedMessageId)
  const [filter, setFilter] = useState<Filter>('all')

  const messages = useMemo(() => {
    if (!state) return []
    return state.inbox.messages.filter((message) => {
      switch (filter) {
        case 'unread':
          return !message.read
        case 'decisions':
          return message.decisionId !== undefined && state.decisions.openIds.includes(message.decisionId)
        case 'threat':
          return message.type === 'threat' || message.type === 'incident'
        case 'business':
          return message.type === 'business' || message.type === 'executive' || message.type === 'board'
        default:
          return true
      }
    })
  }, [state, filter])

  const selected = messages.find((message) => message.id === selectedId) ?? messages[0]
  const sender = selected && [...index.content.stakeholders, ...index.content.leaders].find(
    (person) => selected.from === person.name || selected.from.startsWith(`${person.name},`),
  )

  useEffect(() => {
    if (selected && !selected.read) dispatch({ type: 'markRead', messageId: selected.id })
  }, [selected, dispatch])

  if (!state) return null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl leading-tight">Inbox</h1>
        <SegmentedControl
          label="Filter messages"
          value={filter}
          options={FILTERS.map((item) => ({ id: item.id, label: item.label }))}
          onChange={setFilter}
        />
      </div>

      {messages.length === 0 ? (
        <EmptyState title="Nothing here" description="No messages match this filter yet." illustration="inbox"
          action={<Button variant="secondary" size="sm" onClick={() => filter === 'all' ? useGameStore.getState().setScreen('home') : setFilter('all')}>{filter === 'all' ? 'Back to the briefing' : 'Show all messages'}</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <ul className="divide-y divide-line border-y border-line" aria-label="Messages">
            {messages.slice(0, 60).map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => setUi({ selectedMessageId: message.id })}
                  aria-current={selected?.id === message.id ? 'true' : undefined}
                  className={cn(
                    'w-full border-l-2 px-3 py-4 text-left transition-colors',
                    selected?.id === message.id
                      ? 'border-accent bg-accent-soft/30'
                      : 'border-transparent hover:bg-surface-2',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('truncate text-sm', message.read ? 'text-ink-muted' : 'font-semibold')}>
                      {message.from}
                    </span>
                    {/* A date, as the header gives one. "d0" beside a header
                        reading 2 January read as a mistake. */}
                    <span className="shrink-0 text-xs tabular-nums text-ink-faint">{shortDate(message.day)}</span>
                  </div>
                  <p className={cn('mt-0.5 truncate', message.read ? 'text-ink-muted' : 'font-medium')}>
                    {message.subject}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <PriorityBadge message={message} />
                    {message.decisionId && state.decisions.openIds.includes(message.decisionId) && (
                      <Badge tone="warning" glyph={false}>Needs a decision</Badge>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <Card className="correspondence md:sticky md:top-24 md:self-start">
              <CardBody>
                <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
                  <NexoraMark className="h-7 w-7" />
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint">Nexora Group</span>
                </div>
                <p className="text-sm text-ink-faint">{formatGameDate(selected.day).label}</p>
                <h2 className="mt-1 font-display text-xl leading-tight text-balance">{selected.subject}</h2>
                <div className="mt-3 flex items-center gap-3">
                  {sender && <PersonPortrait key={sender.id} id={sender.id} name={sender.name} />}
                  <p className="text-sm text-ink-muted">{selected.from}</p>
                </div>
                <div className="correspondence-body mt-6 space-y-4 text-pretty">
                  {selected.body.split('\n\n').map((paragraph, position) => (
                    <p key={position} className="whitespace-pre-line leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {/* The words live in the messages at least as much as in the
                    risks: break-glass, jump servers, credential stuffing. */}
                <Terms text={`${selected.subject} ${selected.body}`} className="mt-3" />
                {selected.decisionId && state.decisions.openIds.includes(selected.decisionId) && (
                  <Button
                    variant="primary"
                    className="mt-5"
                    onClick={() => setUi({ openDecisionId: selected.decisionId })}
                  >
                    Take the decision
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function PriorityBadge({ message }: { message: InboxMessage }) {
  switch (message.priority) {
    case 'critical':
      return <Badge tone="severe" glyph={false}>Critical</Badge>
    case 'urgent':
      return <Badge tone="high" glyph={false}>Urgent</Badge>
    case 'notable':
      return <Badge tone="moderate" glyph={false}>Notable</Badge>
    default:
      return <Badge tone="neutral" glyph={false}>{message.type}</Badge>
  }
}
