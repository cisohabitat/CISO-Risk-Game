/**
 * Taking a decision (plan §21, §22).
 *
 * Options show only what a CISO could reasonably foresee. Hidden consequences
 * stay hidden until they arrive. For material decisions the player records why,
 * using quick-select rationale tags rather than mandatory prose.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Dialog } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { openDecisions, type OpenDecisionView } from '@/store/selectors'
import { cn } from '@/lib/utils/cn'
import { money } from '@/lib/formatting/labels'

export function DecisionDialog({ decisionId, onClose }: { decisionId: string; onClose: () => void }) {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
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

  const submit = () => {
    if (!optionId) return
    const result = dispatch({
      type: 'resolveDecision',
      decisionId,
      optionId,
      rationaleTagIds: tags,
      note: note.trim() || undefined,
    })
    if (result.ok) onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={decision.title}
      description={decision.description}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Not yet
          </Button>
          <Button variant="primary" disabled={!optionId || !selected?.affordable || needsRationale} onClick={submit}>
            {needsRationale ? 'Record why first' : 'Commit to this'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="rounded-lg border border-line bg-surface-2 p-3 text-sm text-ink-muted text-pretty">
          {decision.context}
        </p>

        {decision.daysRemaining !== undefined && (
          <p className={cn('text-sm', decision.urgent ? 'text-band-high' : 'text-ink-muted')}>
            {decision.daysRemaining <= 0
              ? 'This is due today. If you do not decide, the organisation will decide for you.'
              : `Due in ${decision.daysRemaining} day${decision.daysRemaining === 1 ? '' : 's'}.`}
          </p>
        )}

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Your options
          </legend>
          {decision.options.map((option) => (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
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
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{option.label}</span>
                  {/* A price the organisation already knows is not part of the
                      uncertainty. "Expensive" told the player nothing they could
                      weigh against the budget bar on the same screen. */}
                  {option.budgetCost !== undefined && (
                    <span className="text-sm tabular-nums text-ink-faint">{money(option.budgetCost)}</span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted text-pretty">{option.description}</span>
                {option.visibleKnownEffects.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {option.visibleKnownEffects.map((effect) => (
                      <li key={effect} className="flex gap-2 text-sm text-ink-faint">
                        <span aria-hidden="true">·</span>
                        <span className="text-pretty">{effect}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {option.exceedsBudget && (
                  <span className="mt-2 block text-sm text-band-elevated">
                    This commits more than the year has left. The shortfall will be carried as unfunded.
                  </span>
                )}
                {option.blockedReason && (
                  <span className="mt-2 block text-sm text-band-high">{option.blockedReason}</span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Why? {decision.requiresRationale ? '' : '(optional)'}
          </p>
          <p className="mb-2 text-sm text-ink-muted">
            Your reasoning is recorded and will be read back to you in the annual review.
          </p>
          <div className="flex flex-wrap gap-2">
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
        </div>

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
