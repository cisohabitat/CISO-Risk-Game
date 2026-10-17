import { SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { shortDate } from '@/lib/formatting/labels'

/** A chronological sample of recorded choices, with no claim about causation. */
export function ReviewMoments() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state?.reviews.annual) return null

  const choices = state.history.decisionsLog.flatMap((entry) => {
    const runtime = state.decisions.decisions[entry.decisionId]
    const decision = runtime && index.decision.get(runtime.defId)
    const option = decision?.options.find((candidate) => candidate.id === entry.optionId)
    if (entry.day < 0 || runtime?.resolvedByDefault || !decision || !option) return []
    return [{ entry, title: decision.title, choice: option.label }]
  }).sort((a, b) => a.entry.day - b.entry.day)
  if (choices.length === 0) return null

  const positions = [...new Set([0, Math.floor((choices.length - 1) / 2), choices.length - 1])]
  return (
    <section aria-labelledby="review-moments">
      <SectionHeading><span id="review-moments">Choices from your year</span></SectionHeading>
      <p className="mb-5 max-w-[65ch] text-sm text-ink-muted text-pretty">
        {choices.length >= 3 ? 'A selection from the beginning, middle, and end of the decisions you recorded.' : 'Your recorded decisions.'}
      </p>
      <ol className="review-moments grid gap-6 md:grid-cols-3">
        {positions.map((position) => {
          const { entry, title, choice } = choices[position]!
          const reasons = entry.rationaleTagIds.flatMap((id) => index.rationaleTag.get(id)?.label ?? [])
          return (
            <li key={`${entry.decisionId}-${position}`} className="print-keep border-t-2 border-brass pt-4">
              <p className="document-kicker">{shortDate(entry.day)}</p>
              <h3 className="mt-2 font-display text-xl leading-tight text-balance">{title}</h3>
              <p className="mt-3 text-sm text-pretty"><span className="font-medium">You chose: </span>{choice}</p>
              {reasons.length > 0 && <p className="mt-2 text-sm text-ink-muted text-pretty">Because: {reasons.join('; ')}</p>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
