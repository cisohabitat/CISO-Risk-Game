/**
 * Balance harness: runs seeded campaigns under simple policies and reports the
 * distribution of outcomes. Used to keep the simulation inside the bounds set
 * out in the plan's soak-test section (plan §42.3).
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, applyAction, runDays } from '../src/game/engine/orchestrator'
import { checkInvariants } from '../src/game/engine/invariants'
import { nexoraContent } from '../src/content/nexora'
import { completeQuarterIfDue, leastCommissioned, rationaleFor } from './play-helpers'
import type { GameState, ContentIndex, DecisionOptionDef, Difficulty } from '../src/game/types'

type Policy = 'passive' | 'defensive' | 'business' | 'balanced'

/**
 * How much an option does for security, read from its effects. The defensive
 * style used to take each decision's last option, which is as often "leave it
 * for now" or "note it and keep watching" as anything protective, and so read
 * as a defensive player doing nothing.
 */
function securityValue(option: DecisionOptionDef): number {
  let score = 0
  const effects = [...option.immediateEffects, ...(option.delayedEffects ?? []).flatMap((d) => d.effects)]
  for (const e of effects) {
    switch (e.type) {
      case 'control.coverage':
      case 'control.configuration':
      case 'control.operational':
      case 'control.monitoring':
        score += e.delta * 10
        break
      case 'control.exceptions':
        score -= e.delta * 10
        break
      case 'control.assess':
        score += 0.5
        break
      case 'node.exposure':
      case 'node.weakness':
        score -= e.delta * 10
        break
      case 'threat.setback':
        score += 1
        break
      case 'threat.interest':
        score -= e.delta * 5
        break
      case 'incident.containment':
        score += e.delta * 10
        break
      case 'evidence.reveal':
        score += 0.2
        break
      default:
        break
    }
  }
  return score
}

function play(index: ContentIndex, seed: string, policy: Policy, difficulty: Difficulty): GameState {
  const state = newGame(index, { seed, difficulty })
  const commissioned: Record<string, number> = {}
  const programmesByPolicy: Record<Policy, string[]> = {
    passive: [],
    defensive: ['prog-identity', 'prog-ransomware', 'prog-detection', 'prog-segmentation', 'prog-thirdparty', 'prog-cloud'],
    business: ['prog-cloud'],
    balanced: ['prog-identity', 'prog-ransomware'],
  }
  let started = 0
  for (let day = 0; day < 364; day += 1) {
    // Answer anything open, taking the first available option.
    for (const decisionId of [...state.decisions.openIds]) {
      const decision = state.decisions.decisions[decisionId]
      if (!decision) continue
      const def = index.decision.get(decision.defId)
      if (!def) continue
      const preferred =
        policy === 'defensive'
          ? [...def.options].sort((a, b) => securityValue(b) - securityValue(a))[0]
          : policy === 'business'
            ? def.options[0]
            : def.options[Math.floor(def.options.length / 2)]
      const option = preferred ?? def.options[0]
      if (!option) continue
      applyAction(state, index, {
        type: 'resolveDecision',
        decisionId,
        optionId: option.id,
        rationaleTagIds: rationaleFor(index, state.decisions.decisions[decisionId]!.defId),
      })
    }
    // Start programmes when affordable, one at a time: the next once the last
    // is past halfway. Starting all six on consecutive twenty-day marks
    // overloaded the team and finished 1.7 of them.
    const wanted = programmesByPolicy[policy]
    const live = Object.values(state.programmes.programmes).filter((p) => p.status === 'active' || p.status === 'at-risk')
    if (started < wanted.length && day % 20 === 0 && live.every((p) => p.progress > 0.5)) {
      const programmeId = wanted[started]
      if (programmeId) {
        const def = index.programme.get(programmeId)
        if (def && state.resources.budgetRemaining > def.budgetCost) {
          const result = applyAction(state, index, { type: 'startProgramme', programmeId, budget: def.budgetCost })
          if (result.ok) started += 1
        }
      }
    }
    if (policy !== 'passive') completeQuarterIfDue(state, index)
    // Commission work when there is attention and capacity.
    if (policy !== 'passive' && state.resources.focusRemaining >= 2 && day % 9 === 0) {
      // Least-commissioned first: a naive first-that-works loop reruns the same
      // repeatable investigation all year and never reaches the rest.
      for (const investigation of leastCommissioned(index, commissioned)) {
        const result = applyAction(state, index, {
          type: 'startInvestigation',
          investigationId: investigation.id,
          leaderId: index.content.leaders[day % index.content.leaders.length]?.id ?? 'lead-grc',
        })
        if (result.ok) {
          commissioned[investigation.id] = (commissioned[investigation.id] ?? 0) + 1
          break
        }
      }
    }
    runDays(state, index, 1)
  }
  return state
}

function main(): void {
  const index = buildContentIndex(nexoraContent)
  console.log('± is one standard error; differences smaller than about two of them are noise.\n')
  const policies: Policy[] = ['passive', 'defensive', 'business', 'balanced']
  const runs = Number(process.argv[2] ?? 25)
  const difficulty = (process.argv[3] as Difficulty) ?? 'ciso'
  for (const policy of policies) {
    let incidents = 0
    // Per-campaign counts, so the spread can be printed beside the mean. At 25
    // campaigns a style, one standard error on incidents is about 0.2 against a
    // mean near 1.2, and this table once showed the passive player with the
    // fewest incidents of the four. At 150 a style the ordering dissolved.
    const perRun: number[] = []
    let worstConsequence = 0
    let violations = 0
    let objectivesAchieved = 0
    let boardConfidence = 0
    let evidence = 0
    let noIncidentRuns = 0
    let programmesComplete = 0
    for (let i = 0; i < runs; i += 1) {
      const state = play(index, `tune-${i}`, policy, difficulty)
      const incidentList = Object.values(state.incidents.incidents)
      incidents += incidentList.length
      perRun.push(incidentList.length)
      if (incidentList.length === 0) noIncidentRuns += 1
      worstConsequence += incidentList.reduce((max, inc) => Math.max(max, inc.consequence), 0)
      violations += checkInvariants(state, index).length
      objectivesAchieved += Object.values(state.business.objectives).filter((o) => o.status === 'achieved').length
      boardConfidence += state.stakeholders.boardConfidence
      evidence += state.evidence.order.length
      programmesComplete += Object.values(state.programmes.programmes).filter((p) => p.status === 'complete').length
    }
    const m = incidents / runs
    const se = Math.sqrt(perRun.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, runs - 1) / runs)
    console.log(
      `${policy.padEnd(10)} incidents/run ${m.toFixed(2)} ±${se.toFixed(2)}  clean-years ${((noIncidentRuns / runs) * 100).toFixed(0)}%  worst-consequence ${(worstConsequence / runs).toFixed(2)}  objectives ${(objectivesAchieved / runs).toFixed(1)}/5  board ${(boardConfidence / runs).toFixed(2)}  evidence ${(evidence / runs).toFixed(0)}  programmes-done ${(programmesComplete / runs).toFixed(1)}  violations ${violations}`,
    )
  }
}

main()
