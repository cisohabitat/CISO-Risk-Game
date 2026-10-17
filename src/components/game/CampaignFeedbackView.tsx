import { useEffect, useRef } from 'react'
import { DAYS_PER_QUARTER } from '@/game/types'
import { Button, Disclosure } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { money, plural, shortDate } from '@/lib/formatting/labels'
import { openDecisions, programmeViews } from '@/store/selectors'

export function CampaignFeedbackView({ kind }: { kind: 'decision' | 'quarter' }) {
  const state = useGameStore((store) => store.state)
  const receipt = useGameStore((store) => store.ui.decisionReceipt)
  const transition = useGameStore((store) => store.ui.quarterTransition)
  const setUi = useGameStore((store) => store.setUi)
  const setScreen = useGameStore((store) => store.setScreen)
  const index = useCampaignIndex()
  const receiptHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (kind !== 'decision' || !receipt) return
    // The option list can leave the page scrolled below a newly inserted
    // receipt. Move to its heading once, after the dialog has closed.
    receiptHeading.current?.closest('section')?.scrollIntoView?.({ block: 'start' })
    receiptHeading.current?.focus({ preventScroll: true })
  }, [kind, receipt])
  if (!state) return null

  if (kind === 'decision') {
    if (!receipt) return null
    const evidence = receipt.evidenceIds.flatMap((id) => state.evidence.items[id] && index.evidence.get(id) ? [index.evidence.get(id)!] : [])
    const messages = receipt.messageIds.flatMap((id) => state.inbox.messages.find((message) => message.id === id) ?? [])
    return <section className="feedback-paper scroll-mt-32 mb-5" aria-labelledby="decision-receipt-heading">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="document-kicker">Decision recorded · {shortDate(receipt.day)}</p>
          <h2 ref={receiptHeading} tabIndex={-1} id="decision-receipt-heading" className="mt-2 font-display text-xl leading-tight">{receipt.title}</h2>
          <p className="mt-2 text-sm text-ink-muted">You chose: <span className="font-medium text-ink">{receipt.choice}</span></p>
        </div>
        <Button variant="quiet" size="sm" className="shrink-0 whitespace-nowrap" aria-label="Dismiss decision receipt" onClick={() => setUi({ decisionReceipt: undefined })}>Dismiss</Button>
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">What changed now</h3>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {receipt.budgetChange !== 0 && <li>Budget {receipt.budgetChange > 0 ? '+' : '−'}{money(Math.abs(receipt.budgetChange))}</li>}
          {receipt.attentionChange !== 0 && <li>Attention {receipt.attentionChange > 0 ? '+' : '−'}{Math.abs(receipt.attentionChange)}</li>}
          {receipt.unfundedChange !== 0 && <li>Unfunded commitment {receipt.unfundedChange > 0 ? '+' : '−'}{money(Math.abs(receipt.unfundedChange))}</li>}
          <li>Choice recorded in your decision log.</li>
        </ul>
        {evidence.length > 0 && <div className="mt-3"><Disclosure summary={`${plural(evidence.length, 'evidence record')} added`}>
          <ul className="list-inside list-disc space-y-1">{evidence.map((item) => <li key={item.id}>{item.title}</li>)}</ul>
          <p className="mt-2 text-xs">Read the evidence in the Risk workspace.</p>
        </Disclosure></div>}
        {messages.length > 0 && <div className="mt-3"><Disclosure summary={plural(messages.length, 'new message')}>
          <ul className="space-y-2">{messages.map((message) => <li key={message.id}><button type="button" className="text-left underline decoration-line-strong underline-offset-4 hover:text-accent-ink" onClick={() => { setUi({ selectedMessageId: message.id }); setScreen('inbox') }}>{message.subject}</button></li>)}</ul>
        </Disclosure></div>}
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">Later effects will appear as the organisation responds. This confirms the recorded choice and immediate resource changes.</p>
      </div>
    </section>
  }

  if (!transition) return null
  const quarter = transition.quarter - 1
  const start = (quarter - 1) * DAYS_PER_QUARTER
  const end = quarter * DAYS_PER_QUARTER
  const choices = state.history.decisionsLog.filter((entry) => entry.day >= start && entry.day < end && !state.decisions.decisions[entry.decisionId]?.resolvedByDefault)
  const completed = programmeViews(state, index).filter((programme) => {
    const day = state.programmes.programmes[programme.id]?.completedDay
    return day !== undefined && day >= start && day < end
  })
  const board = state.reviews.quarters.find((review) => review.quarter === quarter && review.completed)
  const pending = state.reviews.pendingQuarter === quarter
  const outstanding = openDecisions(state, index)
  const blocked = programmeViews(state, index).filter((programme) => programme.blockers.length > 0 && programme.status !== 'proposed' && programme.status !== 'complete')
  return <section className="feedback-paper quarter-paper" aria-labelledby="quarter-recap-heading">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="document-kicker">A new quarter · Year {transition.year}</p>
        <h2 id="quarter-recap-heading" className="mt-2 font-display text-2xl leading-tight">Q{quarter} in the record. Q{transition.quarter} ahead.</h2>
      </div>
      <Button variant="quiet" size="sm" className="shrink-0 whitespace-nowrap" aria-label="Dismiss quarter recap" onClick={() => setUi({ quarterTransition: undefined })}>Dismiss</Button>
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><h3 className="document-kicker">What you completed</h3>
        <p className="mt-2 text-sm">{plural(choices.length, 'choice')} recorded · {plural(completed.length, 'programme')} completed</p>
        {completed.length > 0 && <p className="mt-1 text-sm text-ink-muted">{completed.map((programme) => programme.shortName).join(', ')}</p>}
        <p className="mt-2 text-sm text-ink-muted">Q{quarter} board paper: {board ? 'submitted' : pending ? 'awaiting your paper' : 'no submission recorded'}.</p>
      </div>
      <div className="border-t border-line pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0"><h3 className="document-kicker">Carry into this quarter</h3>
        <p className="mt-2 text-sm text-ink-muted">{plural(outstanding.length, 'open decision')} · {plural(blocked.length, 'blocked programme')}</p>
        <p className="mt-2 text-sm text-ink-muted">Start with the work waiting on you above, then review your team’s commitments.</p>
        <div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => setScreen('team')}>Review commitments</Button>{pending && <Button variant="secondary" size="sm" onClick={() => setScreen('board')}>Prepare board paper</Button>}</div>
      </div>
    </div>
  </section>
}
