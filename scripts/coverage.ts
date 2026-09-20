/**
 * Content and mechanic coverage across many seeded campaigns.
 *
 * Grading aid: tells us which authored content a player actually encounters and
 * which mechanics ever fire, rather than which ones exist.
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, runDays, applyAction } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { completeQuarterIfDue, leastCommissioned, rationaleFor } from './play-helpers'
import type { ContentIndex, Difficulty, GameState } from '../src/game/types'

const DIFFICULTIES: Difficulty[] = ['guided', 'ciso', 'high-pressure']

/**
 * Programme order matters to what a campaign can reach. Starting them in
 * content order, one every forty days, never has two of them live at once, so
 * content about programmes competing for the same team is unreachable however
 * many campaigns are run. Half the engaged campaigns therefore start the two
 * programmes that contend for the architecture team together.
 */
function programmeOrder(index: ContentIndex, concurrent: boolean): string[] {
  const all = index.content.programmes.map((def) => def.id)
  if (!concurrent) return all
  const contending = ['prog-identity', 'prog-segmentation'].filter((id) => all.includes(id))
  return [...contending, ...all.filter((id) => !contending.includes(id))]
}

function play(
  index: ContentIndex,
  seed: string,
  difficulty: Difficulty,
  engaged: boolean,
  concurrentProgrammes: boolean,
  optionOffset: number,
): GameState {
  const state = newGame(index, { seed, difficulty })
  const commissioned: Record<string, number> = {}
  const order = programmeOrder(index, concurrentProgrammes)
  let programmeIndex = 0
  for (let day = 0; day < 364; day += 1) {
    for (const decisionId of [...state.decisions.openIds]) {
      const runtime = state.decisions.decisions[decisionId]
      const def = runtime ? index.decision.get(runtime.defId) : undefined
      if (!def) continue
      // Offset per campaign as well as per day: a decision that opens on a
      // fixed day otherwise takes the same option in every campaign, so the
      // content behind its other options is never reached.
      const option = def.options[(day + optionOffset) % def.options.length]
      if (!option) continue
      applyAction(state, index, {
        type: 'resolveDecision',
        decisionId,
        optionId: option.id,
        rationaleTagIds: rationaleFor(index, state.decisions.decisions[decisionId]!.defId),
      })
    }

    completeQuarterIfDue(state, index)

    if (engaged) {
      // Commission whatever is affordable, form hypotheses, raise and accept risks.
      if (day % 7 === 0) {
        // Work down the list rather than pressing the first button that works:
        // the repeatable investigations sit near the top, so a naive loop
        // commissions the same threat hunt all year and never reaches the rest.
        for (const investigation of leastCommissioned(index, commissioned)) {
          const result = applyAction(state, index, {
            type: 'startInvestigation',
            investigationId: investigation.id,
            leaderId: index.content.leaders[day % index.content.leaders.length]!.id,
          })
          if (result.ok) {
            commissioned[investigation.id] = (commissioned[investigation.id] ?? 0) + 1
            break
          }
        }
      }
      if (day % 11 === 0) {
        const knownTags = new Set(state.evidence.order.flatMap((id) => index.evidence.get(id)?.tags ?? []))
        const template = index.content.hypothesisTemplates.find(
          (candidate) =>
            candidate.requiresTags.every((tag) => knownTags.has(tag)) &&
            !Object.values(state.risks.hypotheses).some((h) => h.templateId === candidate.id),
        )
        if (template) {
          const supporting = state.evidence.order.filter((id) =>
            (index.evidence.get(id)?.tags ?? []).some((tag) => template.supportingTags.includes(tag)),
          )
          const created = applyAction(state, index, {
            type: 'createHypothesis',
            templateId: template.id,
            evidenceIds: supporting.slice(0, 4),
          })
          if (created.ok) {
            const hypothesisId = Object.keys(state.risks.hypotheses).at(-1)!
            applyAction(state, index, { type: 'convertHypothesis', hypothesisId })
          }
        }
      }
      if (day % 23 === 0) {
        const open = Object.values(state.risks.scenarios).find((scenario) => scenario.status === 'open')
        if (open) {
          applyAction(state, index, {
            type: 'acceptRisk',
            scenarioId: open.id,
            rationaleTagIds: ['rat-compensating'],
            assumptionDefIds: index.content.assumptions.slice(0, 3).map((a) => a.id),
            days: 90,
          })
        }
      }
      // Concurrent runs start the contending pair back to back so they are
      // genuinely live together; the rest keep the spaced-out order.
      const interval = concurrentProgrammes && programmeIndex < 2 ? 10 : 40
      if (day % interval === 0 && programmeIndex < order.length) {
        const def = index.programme.get(order[programmeIndex]!)
        if (def && applyAction(state, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost }).ok) {
          programmeIndex += 1
        }
      }
    }
    runDays(state, index, 1)
  }
  return state
}

function main(): void {
  const runs = Number(process.argv[2] ?? 60)
  const index = buildContentIndex(nexoraContent)

  const firedEvents = new Set<string>()
  const openedDecisions = new Set<string>()
  const seenEvidence = new Set<string>()
  const usedPaths = new Set<string>()
  const usedActors = new Set<string>()
  const usedFamilies = new Set<string>()
  const openedScenarios = new Set<string>()
  let invalidatedAssumptions = 0
  let runsWithInvalidation = 0
  let hypotheses = 0
  let lateAssignments = 0
  let thinAssignments = 0
  let blockersHit = 0
  let programmesCompleted = 0
  let evidencePerRun = 0
  let noiseSeen = 0

  for (let i = 0; i < runs; i += 1) {
    const engaged = i % 2 === 0
    const state = play(index, `cov-${i}`, DIFFICULTIES[i % 3]!, engaged, i % 4 === 0, i)

    for (const id of state.events.firedEventIds) firedEvents.add(id)
    for (const runtime of Object.values(state.decisions.decisions)) openedDecisions.add(runtime.defId)
    for (const id of state.evidence.order) {
      seenEvidence.add(id)
      if (index.evidence.get(id)?.noise) noiseSeen += 1
    }
    evidencePerRun += state.evidence.order.length
    for (const campaign of state.threats.campaigns) {
      usedPaths.add(campaign.pathId)
      usedActors.add(campaign.actorId)
    }
    for (const incident of Object.values(state.incidents.incidents)) usedFamilies.add(incident.familyId)
    for (const scenario of Object.values(state.risks.scenarios)) {
      if (scenario.status !== 'emerging') openedScenarios.add(scenario.id)
    }
    const invalid = Object.values(state.assumptions.assumptions).filter((a) => a.status === 'invalidated').length
    invalidatedAssumptions += invalid
    if (invalid > 0) runsWithInvalidation += 1
    hypotheses += Object.keys(state.risks.hypotheses).length
    lateAssignments += Object.values(state.team.leaders).reduce((sum, l) => sum + l.assignmentsLate, 0)
    thinAssignments += state.team.assignments.filter((a) => a.status === 'complete' && a.quality < 0.4).length
    blockersHit += Object.values(state.programmes.programmes).reduce((sum, p) => sum + p.blockers.length, 0)
    programmesCompleted += Object.values(state.programmes.programmes).filter((p) => p.status === 'complete').length
  }

  const pct = (used: number, total: number) => `${used}/${total} (${Math.round((used / total) * 100)}%)`
  console.log(`\n${runs} campaigns (half engaged, half decision-only)\n`)
  console.log('CONTENT REACHED')
  console.log('  events fired        ', pct(firedEvents.size, index.content.events.length))
  console.log('  decisions opened    ', pct(openedDecisions.size, index.content.decisions.length))
  console.log('  evidence seen       ', pct(seenEvidence.size, index.content.evidence.length))
  console.log('  risk scenarios      ', pct(openedScenarios.size, index.content.riskScenarios.length))
  console.log('  attack paths walked ', pct(usedPaths.size, index.content.attackPaths.length))
  console.log('  actors active       ', pct(usedActors.size, index.content.actors.length))
  console.log('  incident families   ', pct(usedFamilies.size, index.content.incidentFamilies.length))
  console.log('\nMECHANICS FIRING')
  console.log('  evidence per run    ', (evidencePerRun / runs).toFixed(1))
  console.log('  noise items per run ', (noiseSeen / runs).toFixed(1))
  console.log('  hypotheses per run  ', (hypotheses / runs).toFixed(1))
  console.log('  assumptions broken  ', (invalidatedAssumptions / runs).toFixed(2), `(${Math.round((runsWithInvalidation / runs) * 100)}% of runs)`)
  console.log('  late delegated work ', (lateAssignments / runs).toFixed(2))
  console.log('  thin delegated work ', (thinAssignments / runs).toFixed(2))
  console.log('  programme blockers  ', (blockersHit / runs).toFixed(2))
  console.log('  programmes finished ', (programmesCompleted / runs).toFixed(2))

  const unfired = index.content.events.filter((event) => !firedEvents.has(event.id)).map((e) => e.id)
  const unopened = index.content.decisions.filter((d) => !openedDecisions.has(d.id)).map((d) => d.id)
  const unseen = index.content.evidence.filter((e) => !seenEvidence.has(e.id)).map((e) => e.id)
  if (unfired.length) console.log('\nNEVER FIRED (events):\n ', unfired.join('\n  '))
  if (unopened.length) console.log('\nNEVER OPENED (decisions):\n ', unopened.join('\n  '))
  if (unseen.length) console.log('\nNEVER SEEN (evidence):\n ', unseen.join('\n  '))
}

main()
