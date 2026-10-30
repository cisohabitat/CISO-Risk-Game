/**
 * Inbox (plan §28.2). A narrative surface: what the organisation is telling
 * you, in its own voice, not a dump of the event database.
 *
 * Mobile shows a list that pushes to a reader; tablet and desktop show both.
 */
import { isReferenceMail } from '@/game/inbox/messages'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, CardBody, EmptyState, SegmentedControl } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { PersonPortrait } from '@/components/game/Person'
import { CharacterVoice } from '@/components/game/CharacterVoice'
import { NexoraMark } from '@/components/game/NexoraMark'
import { Terms } from '@/components/game/Terms'
import { cn } from '@/lib/utils/cn'
import { formatGameDate } from '@/game/time'
import { shortDate, money } from '@/lib/formatting/labels'
import type { InboxMessage } from '@/game/types'
import { Icon, type IconName } from '@/components/ui/icons'
import { messageReturnKind } from '@/store/selectors'
import { MESSAGE_RETURN_LABEL } from '@/lib/formatting/message-return'

const MESSAGE_KIND: Record<InboxMessage['type'], { label: string; icon: IconName; style: string }> = {
  business: { label: 'Business update', icon: 'briefing', style: 'routine' },
  threat: { label: 'Threat update', icon: 'risk', style: 'alert' },
  programme: { label: 'Programme update', icon: 'programme', style: 'routine' },
  people: { label: 'People update', icon: 'team', style: 'personal' },
  supplier: { label: 'Supplier update', icon: 'organisation', style: 'routine' },
  executive: { label: 'Executive message', icon: 'inbox', style: 'personal' },
  board: { label: 'Board correspondence', icon: 'board', style: 'personal' },
  discovery: { label: 'Evidence update', icon: 'enquiry', style: 'evidence' },
  incident: { label: 'Incident update', icon: 'incident', style: 'alert' },
  assumption: { label: 'Assumption update', icon: 'assumption', style: 'evidence' },
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'updates', label: 'Updates' },
  { id: 'reference', label: 'Reference' },
  { id: 'decisions', label: 'Needs a decision' },
  { id: 'follow-ups', label: 'Follow-ups' },
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
  const reader = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const lastOpened = useRef<string | undefined>(undefined)
  const [readingRequest, setReadingRequest] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [messageLimit, setMessageLimit] = useState(60)
  // Freeze membership on entry: marking the open message read must not select
  // and mark the next one, recursively consuming the player's whole backlog.
  const [unreadIds, setUnreadIds] = useState<string[]>([])
  const changeFilter = (next: Filter) => {
    if (next === 'unread') setUnreadIds(state?.inbox.messages.filter((message) => !message.read).map((message) => message.id) ?? [])
    setFilter(next)
    setMessageLimit(60)
  }

  const messages = useMemo(() => {
    if (!state) return []
    const terms = query.trim().toLocaleLowerCase('en-GB').split(/\s+/).filter(Boolean)
    return state.inbox.messages.filter((message) => {
      const text = `${message.from}\n${message.subject}\n${message.body}`.toLocaleLowerCase('en-GB')
      if (!terms.every((term) => text.includes(term))) return false
      switch (filter) {
        case 'updates':
          return !isReferenceMail(state, index, message)
        case 'reference':
          return isReferenceMail(state, index, message)
        case 'unread':
          return unreadIds.includes(message.id)
        case 'decisions':
          return message.decisionId !== undefined && state.decisions.openIds.includes(message.decisionId)
        case 'follow-ups':
          return messageReturnKind(message, index) !== undefined
        case 'threat':
          return message.type === 'threat' || message.type === 'incident'
        case 'business':
          return message.type === 'business' || message.type === 'executive' || message.type === 'board'
        default:
          return true
      }
    })
  }, [state, filter, unreadIds, index, query])

  // Searching must not open and mark every transient first result read.
  const selected = messages.find((message) => message.id === selectedId) ?? (query.trim() ? undefined : messages[0])
  const returnKind = selected ? messageReturnKind(selected, index) : undefined
  // A selected older message must retain a reachable row after navigating away
  // and back, even though the local pagination starts again at sixty.
  const shownCount = Math.max(messageLimit, messages.findIndex((message) => message.id === selectedId) + 1)
  const sender = selected && [...index.content.stakeholders, ...index.content.leaders].find(
    (person) => selected.from === person.name || selected.from.startsWith(`${person.name},`),
  )

  const important = selected && (selected.priority === 'urgent' || selected.priority === 'critical' || selected.type === 'executive' || selected.type === 'board')

  useEffect(() => {
    if (selected && !selected.read) dispatch({ type: 'markRead', messageId: selected.id })
  }, [selected, dispatch])

  useEffect(() => {
    if ((!selectedId && readingRequest === 0) || !window.matchMedia?.('(max-width: 767px)')?.matches) return
    const frame = window.requestAnimationFrame(() => {
      reader.current?.scrollIntoView?.({ block: 'start' })
      heading.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedId, readingRequest])

  useEffect(() => {
    reader.current?.scrollTo?.(0, 0)
  }, [selected?.id])

  const backToMessages = () => {
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>('button[data-message-id]')
    const target = Array.from(buttons ?? []).find((button) => button.dataset.messageId === (lastOpened.current ?? selected?.id)) ?? buttons?.[0]
    target?.scrollIntoView?.({ block: 'center' })
    target?.focus({ preventScroll: true })
  }

  if (!state) return null

  return (
    <div className="split-shell correspondence-workspace space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div><p className="document-kicker">Nexora Group · Correspondence</p><h1 className="mt-1 font-display text-3xl leading-tight sm:mt-2">Inbox</h1></div>
        <SegmentedControl
          label="Filter messages"
          value={filter}
          options={FILTERS.map((item) => ({ id: item.id, label: item.label }))}
          onChange={changeFilter}
        />
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-sm font-medium">
          Search messages
          <input type="search" value={query} onChange={(event) => {
            setQuery(event.target.value)
            setMessageLimit(60)
          }} placeholder="Sender, subject or message text" className="mt-1 block w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2.5 text-base font-normal" aria-describedby="message-search-help" />
        </label>
        {query && messages.length > 0 && <Button variant="quiet" size="sm" onClick={() => {
          setQuery('')
          setMessageLimit(60)
        }}>Clear search</Button>}
        <p id="message-search-help" className="w-full text-xs text-ink-faint">Searches all mail in this filter, including older messages. The navigation badge counts unread updates, excluding reference mail. All and Unread retain every message, including reference correspondence.</p>
      </div>

      {filter === 'reference' && <div className="flex flex-wrap items-center gap-2 text-sm"><p>Background correspondence and resolved decision letters stay here for reference.</p><Button variant="secondary" size="sm" onClick={() => { for (const message of state.inbox.messages) if (!message.read && isReferenceMail(state, index, message)) dispatch({ type: 'markRead', messageId: message.id }) }}>Mark reference mail read</Button></div>}
      {selected?.signalCampaignId && <div className="rounded border border-line p-3 text-sm"><p>Follow this warning with a Targeted threat hunt under Risk → Investigate. It costs attention, budget and SOC capacity, and can return thin; commissioning a hunt does not guarantee eviction. Use the evidence to act on the exposed controls.</p><Button variant="secondary" size="sm" onClick={() => { useGameStore.getState().setScreen('risk'); setUi({ riskTab: 'investigate' }) }}>Review threat-hunt enquiry</Button></div>}
      {filter === 'unread' && messages.length > 0 && <p className="text-sm text-ink-muted">Messages stay in this view as you read them. Select Unread again to refresh.</p>}
      {filter === 'follow-ups' && <p className="text-sm text-ink-muted">Enquiry results, recorded follow-ups, acceptance updates, stopped work and incident reports, including messages you have read.</p>}
      {messages.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-faint" role="status">Showing {Math.min(shownCount, messages.length)} of {messages.length} messages · {state.inbox.messages.filter((message) => !message.read).length} unread across all mail</p>
        {shownCount < messages.length && <Button variant="quiet" size="sm" onClick={() => {
          const next = messages[shownCount]
          setMessageLimit(shownCount + 60)
          requestAnimationFrame(() => {
            const target = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('button[data-message-id]') ?? []).find((button) => button.dataset.messageId === next?.id)
            target?.scrollIntoView({ block: 'center' })
            target?.focus({ preventScroll: true })
          })
        }}>Show older messages</Button>}
      </div>}

      {messages.length === 0 ? (
        <EmptyState title="Nothing here" description={query.trim() ? 'No messages match this search in the selected filter.' : 'No messages match this filter yet.'} illustration="inbox"
          action={<Button variant="secondary" size="sm" onClick={() => query.trim() ? setQuery('') : filter === 'all' ? useGameStore.getState().setScreen('home') : changeFilter('all')}>{query.trim() ? 'Clear search' : filter === 'all' ? 'Back to the briefing' : 'Show all messages'}</Button>} />
      ) : (
        <div className="split-workspace grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <ul ref={list} tabIndex={0} className="split-pane divide-y divide-line border-y border-line" aria-label="Messages">
            {messages.slice(0, shownCount).map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  data-message-id={message.id}
                  aria-controls="message-reader"
                  onClick={() => {
                    lastOpened.current = message.id
                    setUi({ selectedMessageId: message.id })
                    setReadingRequest((request) => request + 1)
                  }}
                  aria-current={selected?.id === message.id ? 'true' : undefined}
                  className={cn(
                    'workspace-choice w-full border-l-2 border-transparent px-3 py-4 text-left transition-colors',
                  )}
                >
                    <p className={`message-kind message-kind-${MESSAGE_KIND[message.type].style} mb-2 flex items-center gap-2 text-xs font-medium`}>
                    <Icon name={MESSAGE_KIND[message.type].icon} size={14} />{MESSAGE_KIND[message.type].label}
                  </p>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cn('message-sender min-w-0 text-sm', message.read ? 'text-ink-muted' : 'font-semibold')}>
                      {message.from}
                    </span>
                    {/* A date, as the header gives one. "d0" beside a header
                        reading 2 January read as a mistake. */}
                    <span className="shrink-0 text-xs tabular-nums text-ink-faint">{shortDate(message.day)}</span>
                  </div>
                  <p className={cn('choice-title mt-2 line-clamp-2 leading-snug text-pretty text-ink', !message.read && 'font-semibold')}>
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
            <Card id="message-reader" ref={reader} tabIndex={0} role="region" aria-label="Message reader" className={`split-pane correspondence message-reader scroll-mt-36 message-reader-${MESSAGE_KIND[selected.type].style} md:sticky md:top-24 md:self-start`}>
              <CardBody>
                <div className="message-letterhead mb-2 flex items-center justify-between gap-2 border-b border-line pb-2 md:mb-4 md:pb-3">
                  <div className="md:hidden"><Button variant="secondary" size="sm" onClick={backToMessages}>Back to messages</Button></div>
                  <div className="flex items-center gap-2">
                    <NexoraMark className="h-5 w-5 md:h-7 md:w-7" />
                    <span className="hidden text-xs font-medium uppercase tracking-[0.16em] text-ink-faint min-[400px]:inline">Nexora Group</span>
                  </div>
                </div>
                <div className="message-metadata">
                  <p className={`message-kind message-kind-${MESSAGE_KIND[selected.type].style} mb-1 flex items-center gap-2 text-xs font-medium md:mb-3`}>
                    <Icon name={MESSAGE_KIND[selected.type].icon} size={16} />{MESSAGE_KIND[selected.type].label}
                  </p>
                  <p className="text-xs text-ink-faint md:text-sm">{formatGameDate(selected.day).label}</p>
                </div>
                <h2 ref={heading} tabIndex={-1} className="message-subject mt-3 font-display text-2xl leading-tight text-balance">{selected.subject}</h2>
                {returnKind && <p className="mt-2 text-sm font-medium text-accent">{MESSAGE_RETURN_LABEL[returnKind]}</p>}
                <div className="sender-signature mt-2 md:mt-4 flex items-center gap-3">
                  {sender && <PersonPortrait key={sender.id} id={sender.id} name={sender.name} size={important ? 'large' : 'small'} />}
                  <div className="min-w-0 text-sm">
                    {sender ? <><p className="font-semibold text-ink">{sender.name}</p><p className="mt-1 text-ink-muted">{sender.role}</p>{selected.from !== sender.name && selected.from !== `${sender.name}, ${sender.role}` && <p className="mt-1 text-xs text-ink-faint">{selected.from}</p>}</> : <p className="text-ink-muted">{selected.from}</p>}
                  </div>
                </div>
                {selected.body.includes('£') && selected.day < state.currentDay && <p className="mt-3 text-xs text-ink-muted">Correspondence dated {shortDate(selected.day)}. Available budget today: {money(state.resources.budgetRemaining)}; the message may refer to an earlier allocation. See Budget movements in Briefing for recorded changes.</p>}
                <CharacterVoice key={`${state.gameId}:${selected.id}`} message={selected} />
                <div className="correspondence-body mt-3 md:mt-6 space-y-4 text-pretty">
                  {selected.body.split('\n\n').map((paragraph, position) => (
                    <p key={position} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {returnKind === 'result' || selected.type === 'discovery' ? (
                  <Button variant="secondary" className="mt-4" onClick={() => { setUi({ riskTab: 'evidence' }); useGameStore.getState().setScreen('risk') }}>Review evidence</Button>
                ) : null}
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
                <div className="mt-5 border-t border-line pt-4 md:hidden"><Button variant="quiet" size="sm" onClick={backToMessages}>Back to messages</Button></div>
              </CardBody>
            </Card>
          )}
          {!selected && <Card id="message-reader" role="region" aria-label="Message reader" className="split-pane"><CardBody><p className="text-sm text-ink-muted">Choose a message to read the full correspondence.</p></CardBody></Card>}
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
      return null
  }
}
