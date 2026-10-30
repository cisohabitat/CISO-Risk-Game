import { Badge, Card, CardBody } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { objectiveStatusLabel } from '@/game/business/objectives'
import { shortDate } from '@/lib/formatting/labels'

/** Public business commitments, not a running annual grade or hidden prognosis. */
export function ObjectiveTracker() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state) return null
  return <section aria-label="Business objectives"><h2 className="mb-2 font-display text-xl">Business objectives</h2>
    <p className="mb-3 text-sm text-ink-muted">Original commitments stay fixed. An imposed delay reduces progress; available schedule margin can absorb it, so it is not necessarily an actual late delivery. These results count in your annual assessment.</p>
    <ul className="grid gap-3 sm:grid-cols-2">{index.content.objectives.flatMap((def) => {
      const runtime = state.business.objectives[def.id]
      if (!runtime) return []
      const owner = index.stakeholder.get(def.ownerStakeholderId)
      return <li key={def.id}><Card><CardBody><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-medium">{def.name}</h3><Badge tone={runtime.status === 'failed' ? 'high' : runtime.status === 'at-risk' ? 'elevated' : 'neutral'}>{objectiveStatusLabel(runtime.status)}</Badge></div>
        <p className="mt-1 text-sm">Committed for {shortDate(runtime.targetDay)} · {owner?.name ?? 'Business owner'}</p>
        <p className="mt-1 text-sm">{Math.floor(runtime.progress * 100)}% delivered{runtime.delayDays > 0 ? ` · ${runtime.delayDays} days of imposed delay recorded` : ''}.</p>
        {runtime.status === 'failed' && <p className="mt-1 text-sm">Delivery was incomplete when the original commitment passed. Recorded delay, concurrent security work and service disruption can all consume the margin.</p>}
        {runtime.securitySupported && <p className="mt-1 text-xs text-ink-muted">Security support is recorded for this objective.</p>}
      </CardBody></Card></li>
    })}</ul>
  </section>
}
