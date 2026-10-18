import { useEffect, useRef } from 'react'
import { Button, Disclosure } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { money, plural, shortDate } from '@/lib/formatting/labels'
import { quarterFeedback } from '@/store/quarter-feedback'

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
  const { choices, completed, board, pending, outstanding, blocked, strengths, concerns, next } = quarterFeedback(state, index, quarter)
  return <section className="feedback-paper quarter-paper" aria-labelledby="quarter-recap-heading">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="document-kicker">A new quarter · Year {transition.year}</p>
        <h2 id="quarter-recap-heading" className="mt-2 font-display text-2xl leading-tight">Q{quarter} in the record. Q{transition.quarter} ahead.</h2>
      </div>
      <Button variant="quiet" size="sm" className="shrink-0 whitespace-nowrap" aria-label="Dismiss quarter recap" onClick={() => setUi({ quarterTransition: undefined })}>Dismiss</Button>
    </div>
    <p className="mt-3 text-sm text-ink-muted">{plural(choices.length, 'choice')} recorded · {plural(completed.length, 'programme')} completed</p>
    <p className="mt-1 text-sm text-ink-muted">Q{quarter} board paper: {board ? 'submitted' : pending ? 'awaiting your paper' : 'no submission recorded'}.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><h3 className="document-kicker">What went well</h3>
        {strengths.length > 0 ? <ul className="mt-2 space-y-2 text-sm">{strengths.map((line) => <li key={line}>{line}</li>)}</ul>
          : <p className="mt-2 text-sm text-ink-muted">No player choices, programme completions or board submission are recorded for this quarter. Other work may be under way.</p>}
      </div>
      <div className="border-t border-line pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0"><h3 className="document-kicker">What needs attention</h3>
        <p className="mt-2 text-xs text-ink-faint">Current position · {shortDate(state.currentDay)}</p>
        {concerns.length > 0 ? <ul className="mt-2 space-y-2 text-sm">{concerns.map((line) => <li key={line}>{line}</li>)}</ul>
          : <p className="mt-2 text-sm text-ink-muted">No concerns in these records. This does not establish that all risks are controlled.</p>}
        <p className="mt-2 text-sm text-ink-muted">{plural(outstanding.length, 'open decision')} · {plural(blocked.length, 'blocked programme')}</p>
      </div>
    </div>
    <div className="mt-4 border-t border-line pt-3">
      <h3 className="document-kicker">A practical next step</h3>
      <p className="mt-2 text-sm">{next.text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => { setScreen(next.screen); if (next.decisionId) setUi({ openDecisionId: next.decisionId }) }}>{next.label}</Button>
        {next.screen !== 'team' && <Button variant="quiet" size="sm" onClick={() => setScreen('team')}>Review commitments</Button>}
        {pending && next.screen !== 'board' && <Button variant="quiet" size="sm" onClick={() => setScreen('board')}>Prepare board paper</Button>}
      </div>
      <p className="mt-3 text-xs text-ink-faint">Based on recorded activity and the current public picture. The annual assessment comes at year-end.</p>
    </div>
  </section>
}
