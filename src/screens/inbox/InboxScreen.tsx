/**
 * Inbox (plan §28.2). A narrative surface: what the organisation is telling
 * you, in its own voice, not a dump of the event database.
 *
 * Mobile shows a list that pushes to a reader; tablet and desktop show both.
 */
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, EmptyState, SegmentedControl } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { Terms } from '@/components/game/Terms'
import { cn } from '@/lib/utils/cn'
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
        <EmptyState title="Nothing here" description="No messages match this filter yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <ul className="space-y-2" aria-label="Messages">
            {messages.slice(0, 60).map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => setUi({ selectedMessageId: message.id })}
                  aria-current={selected?.id === message.id ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    selected?.id === message.id
                      ? 'border-accent bg-accent-soft/30'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('truncate text-sm', message.read ? 'text-ink-muted' : 'font-semibold')}>
                      {message.from}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-faint">d{message.day}</span>
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
            <Card className="md:sticky md:top-24 md:self-start">
              <CardBody>
                <p className="text-sm text-ink-faint">Day {selected.day}</p>
                <h2 className="mt-1 text-lg font-semibold text-balance">{selected.subject}</h2>
                <p className="mt-0.5 text-sm text-ink-muted">{selected.from}</p>
                <div className="mt-4 space-y-3 text-pretty">
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
