import { Button, Disclosure } from '@/components/ui/primitives'
import { adoptedAppetite, appetiteExceptions, appetitePosition } from '@/game/risk/appetite'
import { RISK_BAND_LABEL } from '@/game/risk/bands'
import { shortDate } from '@/lib/formatting/labels'
import { useCampaignIndex, useGameStore } from '@/store/game-store'

export function RiskAppetite() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state) return null
  const adopted = adoptedAppetite(state, index)
  const exceptions = appetiteExceptions(state, index)
  return <Disclosure summary="Risk appetite and accepted exceptions">
    {!adopted ? <p className="text-sm">No line has been agreed. Each acceptance is your own judgement, and belongs in the board paper.</p> : <div className="space-y-3 text-sm">
      <p className="font-medium">{adopted.policy.statement}</p>
      <p className="text-ink-muted">Recorded in Year {adopted.year}{adopted.day === undefined ? '; the historical choice has no recorded day.' : ` on ${shortDate(adopted.day)}.`} Delegated residual ceiling: {RISK_BAND_LABEL[adopted.policy.delegatedResidualCeiling]}.</p>
      <p>Accepting a risk does not reduce it. Every accepted risk still goes in the board paper.</p>
      {exceptions.length === 0 ? <p>No accepted risk is above the agreed line.</p> : <ul className="space-y-2">{exceptions.map((risk) => <li key={risk.id}>
        <p>{risk.title} · {risk.position === 'unassessed' ? 'assessment needed before judging appetite' : 'outside delegated appetite'}</p>
        <Button variant="quiet" size="sm" onClick={() => {
          useGameStore.getState().setUi({ selectedScenarioId: risk.id, riskTab: 'risks' })
          useGameStore.getState().setScreen('risk')
        }}>Review: {risk.title}</Button>
      </li>)}</ul>}
    </div>}
  </Disclosure>
}

export function RiskAcceptanceAppetite({ scenarioId }: { scenarioId: string }) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state) return null
  const adopted = adoptedAppetite(state, index)
  const risk = state.risks.scenarios[scenarioId]
  if (!adopted || !risk) return null
  const position = appetitePosition(risk, adopted)
  return <div className="rounded border border-line bg-surface-2 p-3 text-sm" role="note" aria-label="Risk appetite check">
    <p className="font-medium">{position === 'outside' ? 'Outside delegated appetite' : position === 'unassessed' ? 'Appetite needs an assessment' : 'Within the delegated residual band'}</p>
    <p className="mt-1">{adopted.policy.statement}</p>
    <p className="mt-1">{position === 'within' ? 'Keep the owner and review date current.' : 'This is above the line: record an exception, with reasons and a review date, and put it in the board paper.'}</p>
  </div>
}
