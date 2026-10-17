import type { ProgrammeView } from '@/store/selectors'

/** A delivery sequence, not a forecast: completion comes from the public record. */
export function ProgrammeJourney({ programme }: { programme: ProgrammeView }) {
  const next = programme.status === 'complete' ? -1 : programme.milestones.findIndex((milestone) => !milestone.complete)
  return <section aria-label={`${programme.shortName} delivery journey`} className="programme-journey">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h4 className="document-kicker">Delivery path</h4>
      <p className="text-xs text-ink-muted">{programme.status === 'complete' ? 'Delivery complete' : programme.status === 'paused' ? 'Delivery paused' : programme.blockers.length > 0 ? 'Delivery blocked' : 'Delivery in progress'}</p>
    </div>
    <ol className="mt-3 space-y-0">
      {programme.milestones.map((milestone, position) => <li key={milestone.id} aria-current={position === next && programme.status !== 'complete' ? 'step' : undefined} className="journey-step" data-complete={milestone.complete}>
        <span className="journey-marker" aria-hidden="true">{milestone.complete ? '✓' : String(position + 1).padStart(2, '0')}</span>
        <div className="min-w-0 pb-4">
          <p className="text-sm font-medium leading-snug">{milestone.name}</p>
          <p className="mt-1 text-xs text-ink-muted">{milestone.complete ? 'Completed' : programme.status === 'complete' ? 'Not recorded' : position === next ? 'Next milestone' : 'Ahead'}</p>
        </div>
      </li>)}
    </ol>
  </section>
}
