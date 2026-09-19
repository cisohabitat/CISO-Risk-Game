/**
 * Balance harness: runs seeded campaigns under simple policies and reports the
 * distribution of outcomes. Used to keep the simulation inside the bounds set
 * out in the plan's soak-test section (plan §42.3).
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, applyAction, runDays } from '../src/game/engine/orchestrator'
import { checkInvariants } from '../src/game/engine/invariants'
import { nexoraContent } from '../src/content/nexora'
import type { GameState, ContentIndex, Difficulty } from '../src/game/types'

type Policy = 'passive' | 'defensive' | 'business' | 'balanced'

function play(index: ContentIndex, seed: string, policy: Policy, difficulty: Difficulty): GameState {
  const state = newGame(index, { seed, difficulty })
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
          ? def.options[def.options.length - 1]
          : policy === 'business'
            ? def.options[0]
            : def.options[Math.floor(def.options.length / 2)]
      const option = preferred ?? def.options[0]
      if (!option) continue
      applyAction(state, index, {
        type: 'resolveDecision',
        decisionId,
        optionId: option.id,
        rationaleTagIds: ['rat-within-tolerance'],
      })
    }
    // Start programmes when affordable.
    const wanted = programmesByPolicy[policy]
    if (started < wanted.length && day % 20 === 0) {
      const programmeId = wanted[started]
      if (programmeId) {
        const def = index.programme.get(programmeId)
        if (def && state.resources.budgetRemaining > def.budgetCost) {
          const result = applyAction(state, index, { type: 'startProgramme', programmeId, budget: def.budgetCost })
          if (result.ok) started += 1
        }
      }
    }
    // Commission work when there is attention and capacity.
    if (policy !== 'passive' && state.resources.focusRemaining >= 2 && day % 9 === 0) {
      for (const investigation of index.content.investigations) {
        const result = applyAction(state, index, {
          type: 'startInvestigation',
          investigationId: investigation.id,
          leaderId: index.content.leaders[day % index.content.leaders.length]?.id ?? 'lead-grc',
        })
        if (result.ok) break
      }
    }
    runDays(state, index, 1)
  }
  return state
}

function main(): void {
  const index = buildContentIndex(nexoraContent)
  const policies: Policy[] = ['passive', 'defensive', 'business', 'balanced']
  const runs = Number(process.argv[2] ?? 25)
  const difficulty = (process.argv[3] as Difficulty) ?? 'ciso'
  for (const policy of policies) {
    let incidents = 0
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
      if (incidentList.length === 0) noIncidentRuns += 1
      worstConsequence += incidentList.reduce((max, inc) => Math.max(max, inc.consequence), 0)
      violations += checkInvariants(state, index).length
      objectivesAchieved += Object.values(state.business.objectives).filter((o) => o.status === 'achieved').length
      boardConfidence += state.stakeholders.boardConfidence
      evidence += state.evidence.order.length
      programmesComplete += Object.values(state.programmes.programmes).filter((p) => p.status === 'complete').length
    }
    console.log(
      `${policy.padEnd(10)} incidents/run ${(incidents / runs).toFixed(2)}  clean-years ${((noIncidentRuns / runs) * 100).toFixed(0)}%  worst-consequence ${(worstConsequence / runs).toFixed(2)}  objectives ${(objectivesAchieved / runs).toFixed(1)}/5  board ${(boardConfidence / runs).toFixed(2)}  evidence ${(evidence / runs).toFixed(0)}  programmes-done ${(programmesComplete / runs).toFixed(1)}  violations ${violations}`,
    )
  }
}

main()
