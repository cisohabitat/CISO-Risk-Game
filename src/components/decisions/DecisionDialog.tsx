/**
 * Taking a decision (plan §21, §22).
 *
 * Options show only what a CISO could reasonably foresee. Hidden consequences
 * stay hidden until they arrive. For material decisions the player records why,
 * using quick-select rationale tags rather than mandatory prose.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Dialog } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { Terms } from '@/components/game/Terms'
import { openDecisions, type OpenDecisionView } from '@/store/selectors'
import { cn } from '@/lib/utils/cn'
import { money } from '@/lib/formatting/labels'
import { decisionReactions } from '@/store/decision-reactions'

export function DecisionDialog({ decisionId, onClose }: { decisionId: string; onClose: () => void }) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const [optionId, setOptionId] = useState<string | undefined>()
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')

  const decision: OpenDecisionView | undefined = useMemo(() => {
    if (!state) return undefined
    return openDecisions(state, index).find((item) => item.id === decisionId)
  }, [state, index, decisionId])

  if (!state || !decision) return null

  // Only the reasons this decision can be taken for. Offering the whole
  // vocabulary put "residual risk is within tolerance" under "stand up
  // incident command now", and the annual review read it back.
  const rationaleTags = index.content.rationaleTags.filter(
    (tag) => !decision.rationaleTagIds || decision.rationaleTagIds.includes(tag.id),
  )
  const selected = decision.options.find((option) => option.id === optionId)
  const needsRationale = decision.requiresRationale && tags.length === 0
  const moveTo = (id: string) => {
    const target = document.getElementById(id)
    target?.scrollIntoView({ block: 'start' })
    target?.focus({ preventScroll: true })
  }

  const submit = () => {
    if (!optionId) return
    const result = dispatch({
      type: 'resolveDecision',
      decisionId,
      optionId,
      rationaleTagIds: tags,
      note: note.trim() || undefined,
    })
    if (result.ok) {
      const after = useGameStore.getState().state
      if (after && selected) useGameStore.getState().setUi({ decisionReceipt: {
        gameId: after.gameId, year: after.year ?? 1, day: after.currentDay,
        title: decision.title, choice: selected.label,
        budgetChange: after.resources.budgetRemaining - state.resources.budgetRemaining,
        attentionChange: after.resources.focusRemaining - state.resources.focusRemaining,
        unfundedChange: after.resources.unfundedCommitment - state.resources.unfundedCommitment,
        evidenceIds: after.evidence.order.filter((id) => !state.evidence.items[id]),
        messageIds: after.inbox.messages.filter((message) => !state.inbox.messages.some((before) => before.id === message.id)).map((message) => message.id),
        reactions: decisionReactions(state, after, index),
      } })
      onClose()
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={decision.title}
      titleClassName="text-2xl"
      description={decision.description}
      descriptionInBody
      footer={
        <>
          <span className="mr-auto w-full text-sm text-ink-muted sm:w-auto" aria-live="polite">{selected ? `Selected: ${selected.label}` : 'Choose an option to continue'}</span>
          <Button variant="quiet" onClick={onClose}>
            Not yet
          </Button>
          {/* Waiting for a reason, the button stays reachable and says what
              it waits for: disabled, Tab skipped it, and a keyboard player
              never heard why the decision would not commit. Pressed, it
              takes them to the reasons. */}
          <Button
            variant="primary"
            disabled={!optionId || !selected?.affordable}
            aria-disabled={needsRationale || undefined}
            aria-describedby={needsRationale ? 'decision-why' : undefined}
            onClick={needsRationale ? () => document.querySelector<HTMLElement>('#decision-why-reasons button')?.focus() : submit}
          >
            {needsRationale ? 'Record why first' : 'Commit to this'}
          </Button>
        </>
      }
    >
      <div className="decision-paper space-y-6">
        {decision.daysRemaining !== undefined && (
          <p className={cn('decision-deadline rounded-lg border border-line p-3 text-sm font-medium', decision.urgent ? 'text-band-high' : 'text-ink-muted')}>
            {decision.daysRemaining <= 0
              ? 'This is due today. If you do not decide, the organisation will decide for you.'
              : `Due in ${decision.daysRemaining} day${decision.daysRemaining === 1 ? '' : 's'}.`}
          </p>
        )}
        <nav aria-label="Decision paper" className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
          <span className="mr-auto text-sm text-ink-muted">{decision.options.length} options · {state.resources.focusRemaining} attention available</span>
          <Button variant="quiet" size="sm" onClick={() => moveTo('decision-options')}>Compare options</Button>
          <Button variant="quiet" size="sm" onClick={() => moveTo('decision-why')}>Your reasons</Button>
        </nav>
        <section aria-labelledby="decision-context" className="decision-context">
          <h3 id="decision-context" className="document-kicker mb-2"><span aria-hidden="true" className="paper-number">01</span>The situation</h3>
          <p className="text-sm leading-relaxed text-ink-muted text-pretty">
            {decision.context}
          </p>
        </section>
        <Terms
          text={`${decision.title} ${decision.description} ${decision.context} ${decision.options.map((o) => `${o.label} ${o.description}`).join(' ')}`}
        />



        <fieldset className="space-y-3">
          <legend id="decision-options" tabIndex={-1} className="mb-2 scroll-mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
            <span aria-hidden="true" className="paper-number">02</span>
            Your options
          </legend>
          {decision.options.map((option) => (
            <label
              key={option.id}
              data-selected={optionId === option.id}
              className={cn(
                'decision-option flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors sm:p-4',
                optionId === option.id ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface-2 hover:border-line-strong',
                !option.affordable && 'opacity-60',
              )}
            >
              <input
                type="radio"
                name="decision-option"
                value={option.id}
                checked={optionId === option.id}
                disabled={!option.affordable}
                onChange={() => setOptionId(option.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                style={{ minHeight: 0 }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-start justify-between gap-2"><span className="font-display text-xl leading-tight text-balance">{option.label}</span>{optionId === option.id && <span className="rounded border border-accent px-2 py-1 text-xs font-semibold text-accent-ink" aria-hidden="true">✓ Selected</span>}</span>
                <span className="mt-2 block text-sm leading-relaxed text-ink-muted text-pretty">{option.description}</span>
                {(option.budgetCost !== undefined || option.focusCost !== undefined) && <span className="decision-costs mt-3 grid grid-cols-2 gap-3 border-y border-line py-2">
                  {/* A price the organisation already knows is not part of the
                      uncertainty. "Expensive" told the player nothing they could
                      weigh against the budget bar on the same screen. */}
                  {option.budgetCost !== undefined && (
                    <span className="text-sm tabular-nums"><span className="mb-1 block text-xs text-ink-faint">Budget cost</span>{money(option.budgetCost)}</span>
                  )}
                  {/* Attention is spent when the option is taken; two options
                      spent it without their text saying so. */}
                  {option.focusCost !== undefined && (
                    <span className="text-sm tabular-nums"><span className="mb-1 block text-xs text-ink-faint">Attention cost</span>{option.focusCost} attention</span>
                  )}
                </span>}
                {option.visibleKnownEffects.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-ink-faint">Known effects</p>
                    <ul className="mt-2 space-y-1">
                      {option.visibleKnownEffects.map((effect) => (
                        <li key={effect} className="flex gap-2 text-sm text-ink-faint">
                          <span aria-hidden="true">·</span>
                          <span className="text-pretty">{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {option.exceedsBudget && (
                  <span className="mt-2 block text-sm text-band-elevated">
                    This commits more than the year has left. The shortfall will be carried as unfunded.
                  </span>
                )}
                {option.takesOnly !== undefined && (
                  <span className="mt-2 block text-sm text-band-elevated">
                    {option.takesOnly > 0
                      ? `Only ${money(option.takesOnly)} is left uncommitted, so that is all this gives, and it earns thanks in proportion.`
                      : 'Nothing is left uncommitted, so this gives nothing and earns nothing.'}
                  </span>
                )}
                {option.blockedReason && (
                  <span className="mt-2 block text-sm text-band-high">{option.blockedReason}</span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        <section aria-labelledby="decision-why" className="border-t-2 border-line-strong pt-5">
          <p id="decision-why" tabIndex={-1} className="mb-2 scroll-mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
            <span aria-hidden="true" className="paper-number">03</span>
            Why? {decision.requiresRationale ? '(at least one reason)' : '(optional)'}
          </p>
          <p className="mb-2 text-sm text-ink-muted">
            Pick the reasons that actually apply. They are the governance basis of the decision, not a score, and the
            annual review reads them back against what happened.
          </p>
          <div id="decision-why-reasons" className="flex flex-wrap gap-2">
            {rationaleTags.map((tag) => {
              const active = tags.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={active}
                  title={tag.description}
                  onClick={() => setTags((current) => (active ? current.filter((id) => id !== tag.id) : [...current, tag.id]))}
                  className={cn(
                    'compact min-h-10 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface-2 text-ink-muted hover:text-ink',
                  )}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Optional note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="Add a note for your future self (optional)"
              className="w-full resize-y rounded-lg border border-line bg-surface-2 p-3 text-base placeholder:text-ink-faint"
            />
          </label>
        </section>

        {decision.teaches && (
          <p className="rounded-lg border border-brass/40 bg-brass-soft/60 p-3 text-sm">
            <Badge tone="warning" glyph={false} className="mr-2 align-middle">Note</Badge>
            <span className="align-middle text-pretty">{decision.teaches}</span>
          </p>
        )}
      </div>
    </Dialog>
  )
}
