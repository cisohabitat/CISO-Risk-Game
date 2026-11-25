import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { objectivePace } from '@/game/business/pace'
import { Badge, Card, CardBody } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { GATE_HOLD, objectiveStatusLabel } from '@/game/business/objectives'
import { shortDate } from '@/lib/formatting/labels'

/** Public business commitments, not a running annual grade or hidden prognosis. */
export function ObjectiveTracker() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state) return null
  return <section id="objective-tracker" tabIndex={-1} aria-label="Business objectives" className="scroll-mt-36"><h2 className="mb-2 font-display text-xl">Business objectives</h2>
    <p className="mb-3 text-sm text-ink-muted">What the business has promised this year. Delays you cause eat into their margin, and the results count in your annual review.</p>
    <ul className="grid gap-3 sm:grid-cols-2">{index.content.objectives.flatMap((def) => {
      const runtime = state.business.objectives[def.id]
      if (!runtime) return []
      const pace = objectivePace(state, index, def.id)
      const owner = index.stakeholder.get(def.ownerStakeholderId)
      return <li key={def.id}><Card><CardBody><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-medium">{def.name}</h3><Badge tone={runtime.status === 'failed' ? 'high' : runtime.status === 'at-risk' || pace?.atRisk ? 'elevated' : 'neutral'}>{pace?.atRisk ? 'Date at risk' : objectiveStatusLabel(runtime.status)}</Badge></div>
        <p className="mt-1 text-sm">Committed for {shortDate(runtime.targetDay)} · {owner?.name ?? 'Business owner'}</p>
        {/* 100% only once achieved: a check that cleared tops delivery up on
            its day and the status follows the next, so the card read "In
            delivery" at 100% (baf4cf9 playtest, CS-15). */}
        <p className="mt-1 text-sm">{runtime.status === 'achieved' ? 100 : Math.min(99, Math.floor(runtime.progress * 100))}% delivered{runtime.delayDays > 0 ? ` · ${runtime.delayDays} days of imposed delay recorded` : ''}.</p>
        {/* Where the delay came from (owner, 25 November: design issue I).
            Older saves recorded only the total. */}
        {runtime.delayDays > 0 && (runtime.delayLog?.length ?? 0) > 0 && <ul className="mt-1 space-y-0.5 text-xs text-ink-muted" aria-label="Where the delay came from">
          {runtime.delayLog!.map((entry) => <li key={entry.cause}>{entry.days} {entry.days === 1 ? 'day' : 'days'}: {entry.cause}, from {shortDate(entry.day)}</li>)}
        </ul>}
        {pace?.atRisk && <p className="mt-1 text-sm text-band-elevated">The date looks at risk at the average pace observed so far. Review competing work and the delay already recorded; the pace can improve.</p>}
        {runtime.status === 'failed' && <p className="mt-1 text-sm">Delivery was incomplete when the original commitment passed. Recorded delay, concurrent security work and service disruption can all consume the margin.</p>}
        {/* A security check is shown before it happens, so its cost can be
            seen coming rather than met in a letter (19 November). */}
        {def.gate && (runtime.gate !== undefined
          ? <p className="mt-1 text-sm">Security check, {shortDate(def.gate.checkDay)}: {runtime.gate === 'met' ? 'cleared.' : `held; ${def.gate.delayDays} days lost.`}</p>
          : runtime.status !== 'achieved' && runtime.status !== 'failed' && <p className="mt-1 text-sm">Security check on {shortDate(def.gate.checkDay)}: {DIFFICULTY_PROFILES[state.difficulty].gatePreview === 'full' ? def.gate.preview : `by ${def.gate.by}.`}{runtime.progress >= GATE_HOLD ? ' Delivery is ready and waits for it.' : ''}</p>)}
        {/* Set by any decision that moved delivery on, including connecting
            Kestrel on schedule: "security support" sat beside a held check
            on a year with no security work (baf4cf9 playtest, MN-27). */}
        {runtime.securitySupported && <p className="mt-1 text-xs text-ink-muted">A decision of yours moved this objective on.</p>}
      </CardBody></Card></li>
    })}</ul>
  </section>
}
