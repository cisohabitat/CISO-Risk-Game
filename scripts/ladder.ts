/**
 * The same CISO, three worlds.
 *
 * One philosophy, declared up front and applied identically on every
 * difficulty against the same seed, so the only variable is the mode. It logs
 * what it chose, and — more useful — every time the world refused it.
 *
 * Two appetites, because one was not enough to test the ladder. `measured`
 * builds one programme at a time and never runs out of money, which left 41%
 * of the budget unspent on guided and told us nothing about what the budget
 * multipliers do. `ambitious` starts everything it can afford as soon as it
 * can afford it, which is what finds the wall.
 *
 *   pnpm ladder <mode> [seed] [measured|ambitious]
 *   pnpm ladder sweep <runs> [measured|ambitious]
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, applyAction, runDays } from '../src/game/engine/orchestrator'
import { nexoraContent } from '../src/content/nexora'
import { buildAnnualReview, materialTopics } from '../src/game/debrief/review'
import { patternSuggestions, briefing, teamView } from '../src/store/selectors'
import { evaluateCondition } from '../src/game/events/conditions'
import { capacityBand, teamStrain } from '../src/game/team/capacity'
import type { Difficulty, GameState } from '../src/game/types'

const index = buildContentIndex(nexoraContent)
let SEED = process.argv[3] ?? 'ladder'

// Understand the business first; be candid about uncertainty; investigate
// selectively; do not start every programme; enable the business with
// conditions; keep something back for surprises; always go to the board.
const CHOICE: [RegExp, RegExp, string][] = [
  [/Where do you start/i, /business services/i, 'rat-more-evidence'],
  [/three risks/i, /how confident/i, 'rat-more-evidence'],
  [/vacancies/i, /Recruit properly/i, 'rat-resources'],
  [/platform launch/i, /with conditions/i, 'rat-material'],
  [/Out-of-hours vendor/i, /threat hunt/i, 'rat-more-evidence'],
  [/exploit for the checkout/i, /emergency patch/i, 'rat-regulatory'],
  [/repeat audit finding/i, /funded programme/i, 'rat-exec-ownership'],
  [/legacy warehouse/i, /Isolate it properly/i, 'rat-material'],
  [/Standing supplier access/i, /break-glass/i, 'rat-compensating'],
  [/board has not heard/i, /risk chair now/i, 'rat-exec-ownership'],
  [/Penetration test scope/i, /Include the legacy/i, 'rat-more-evidence'],
  [/HR provider/i, /Press them/i, 'rat-regulatory'],
  [/data held beyond policy/i, /Enforce the retention/i, 'rat-regulatory'],
  [/Card data outside/i, /tell the acquirer/i, 'rat-regulatory'],
  [/SOC contract/i, /rewritten scope/i, 'rat-more-evidence'],
  [/budget back/i, /smaller contribution/i, 'rat-resources'],
  [/Incident command/i, /Stand up incident command/i, 'rat-material'],
  [/Regulatory notification/i, /Notify early/i, 'rat-regulatory'],
  [/After the incident/i, /reconstruction honestly/i, 'rat-precedent'],
  [/Connecting the acquisition/i, /quarantined zone/i, 'rat-compensating'],
  // One programme at a time means stopping when told the team cannot carry
  // it, and resuming what was paused once there is room (below).
  [/past sustainable load/i, /Stop something/i, 'rat-resources'],
  // The fourth quarter, in the same voice: finish what you built and make it
  // mean something, look again before carrying anything, argue the quiet
  // year was capability, and pay for resilience when the platform outgrows it.
  [/identity controls mandatory/i, /Enforce now/i, 'rat-material'],
  [/restore test needs an outage window/i, /Take the window now/i, 'rat-more-evidence'],
  [/acceptance has run out/i, /Look at it again/i, 'rat-more-evidence'],
  [/outgrown its recovery design/i, /Fund a resilience redesign/i, 'rat-material'],
  [/budget after a quiet year/i, /Make the case/i, 'rat-material'],
]
// What this CISO wants to build, in order of conviction, and what to examine.
// Real ids. This list once held `prog-recovery`, which does not exist, so
// `index.programme.get` returned undefined, the loop stopped advancing and
// every mode silently built exactly one programme — which is why the budget
// multipliers never bound and looked untested.
const PROGRAMMES = ['prog-identity', 'prog-ransomware', 'prog-thirdparty', 'prog-detection']
const ENQUIRIES = ['inv-service-review', 'inv-access-review', 'inv-supplier-review', 'inv-architecture-review', 'inv-recovery-test']
const LEADERS: Record<string, string> = {
  'inv-service-review': 'lead-grc', 'inv-access-review': 'lead-eng', 'inv-supplier-review': 'lead-grc',
  'inv-architecture-review': 'lead-arch', 'inv-recovery-test': 'lead-soc',
}

type Appetite = 'measured' | 'ambitious'

function play(difficulty: Difficulty, appetite: Appetite) {
  const state: GameState = newGame(index, { seed: SEED, difficulty })
  const log: string[] = []
  const refused: string[] = []
  let wantedProgramme = 0
  let wantedEnquiry = 0
  let boards = 0, patternsFormed = 0, patternsUnaffordable = 0

  for (let day = 0; day < 364; day += 1) {
    runDays(state, index, 1)

    // Decisions, in the voice of the policy above.
    for (const id of [...state.decisions.openIds]) {
      const runtime = state.decisions.decisions[id]!
      const def = index.decision.get(runtime.defId)!
      const rule = CHOICE.find(([t]) => t.test(def.title))
      const preferred = rule ? def.options.find((o) => rule[1].test(o.label)) ?? def.options[0]! : def.options[0]!
      // Preference first, then whatever else this year can pay for. Retrying
      // only the preferred option leaves the decision open until it lapses into
      // its default, which is not what a player does: the dialog disables what
      // they cannot afford and they choose from what is left. Measured, the
      // difference was real — objectives missed read 1.13 on CISO against 1.65
      // — and all of it was the harness rather than the game.
      const ordered = [preferred, ...def.options.filter((o) => o.id !== preferred.id)]
      for (const option of ordered) {
        const r = applyAction(state, index, {
          type: 'resolveDecision', decisionId: id, optionId: option.id,
          rationaleTagIds: [rule?.[2] ?? 'rat-more-evidence'],
        })
        if (r.ok) {
          log.push(
            `d${state.currentDay} decide  ${def.title} → ${option.label}` +
            (option.id === preferred.id ? '' : ` (could not afford ${preferred.label})`),
          )
          break
        }
        refused.push(`d${state.currentDay} decide  ${def.title} → ${option.label}: ${r.message}`)
      }
    }

    // "Stop something" pauses the programme loading the pressed function. A
    // player who was told that resumes it when the team has room again; a
    // harness that never did paused half its programmes for good and the
    // objectives-missed row fell to 0.40 on high pressure for that reason.
    if (capacityBand(teamStrain(state)) === 'available' || capacityBand(teamStrain(state)) === 'committed') {
      for (const programme of Object.values(state.programmes.programmes)) {
        if (programme.status !== 'paused') continue
        const r = applyAction(state, index, { type: 'setProgrammeStatus', programmeId: programme.id, status: 'active' })
        if (r.ok) log.push(`d${state.currentDay} resume  ${index.programme.get(programme.id)?.name}`)
      }
    }

    // The board, every quarter, with everything material on it.
    if (state.reviews.pendingQuarter !== undefined) {
      const quarter = state.reviews.pendingQuarter
      const topics = materialTopics(state, index).filter((t) => t.material)
      const r = applyAction(state, index, {
        type: 'completeQuarterReview', quarter, topics: topics.map((t) => t.id),
        recommendations: [], communicateUncertainty: true,
      })
      if (r.ok) { boards += 1; log.push(`d${state.currentDay} board   Q${quarter} with ${topics.length} material item(s)`) }
      else refused.push(`d${state.currentDay} board   Q${quarter}: ${r.message}`)
    }

    // What the game noticed, taken while it is fresh.
    const top = patternSuggestions(state, index)[0]
    if (top) {
      const made = applyAction(state, index, {
        type: 'createHypothesis', templateId: top.templateId, evidenceIds: top.evidence.map((e) => e.id),
      })
      if (made.ok) {
        patternsFormed += 1
        const hid = Object.keys(state.risks.hypotheses).at(-1)!
        applyAction(state, index, { type: 'convertHypothesis', hypothesisId: hid })
      } else patternsUnaffordable += 1
    }

    // Selective enquiry: one line at a time, in order of conviction.
    if (wantedEnquiry < ENQUIRIES.length && state.team.assignments.filter((a) => a.status === 'running').length === 0) {
      const inv = ENQUIRIES[wantedEnquiry]!
      const def = index.investigation.get(inv)
      const eligible = !def?.requiresCondition || evaluateCondition(state, index, def.requiresCondition)
      if (eligible) {
        const r = applyAction(state, index, { type: 'startInvestigation', investigationId: inv, leaderId: LEADERS[inv]! })
        if (r.ok) { wantedEnquiry += 1; log.push(`d${state.currentDay} enquire ${def?.name}`) }
        else if (day % 30 === 0) refused.push(`d${state.currentDay} enquire ${def?.name}: ${r.message}`)
      }
    }

    // Build, but not everything: one programme at a time, next only once the
    // last is properly under way.
    if (wantedProgramme < PROGRAMMES.length && day > 20) {
      const live = Object.values(state.programmes.programmes).filter((p) => p.status === 'active')
      const ready = appetite === 'ambitious' ? true : live.length === 0 || (live.length === 1 && live[0]!.progress > 0.55)
      if (ready) {
        const pid = PROGRAMMES[wantedProgramme]!
        const def = index.programme.get(pid)
        if (!def) throw new Error(`no such programme: ${pid}`)
        {
          const r = applyAction(state, index, { type: 'startProgramme', programmeId: pid, budget: def.budgetCost })
          if (r.ok) { wantedProgramme += 1; log.push(`d${state.currentDay} build   ${def.name} (£${(def.budgetCost / 1000).toFixed(2)}m)`) }
          else refused.push(`d${state.currentDay} build   ${def.name}: ${r.message}`)
        }
      }
    }
  }

  const review = buildAnnualReview(state, index)
  const view = briefing(state, index)
  const team = teamView(state, index)
  return { state, log, refused, review, view, team, boards, patternsFormed, patternsUnaffordable, wantedProgramme, wantedEnquiry }
}

// `sweep N` runs the same philosophy over N seeds on all three modes and
// reports only what the ladder did, which is the part one seed cannot say.
if (process.argv[2] === 'sweep') {
  const n = Number(process.argv[3] ?? 12)
  const appetite = (process.argv[4] as Appetite) ?? 'measured'
  console.log(`${n} seeds per mode, appetite: ${appetite}`)
  for (const difficulty of ['guided', 'ciso', 'high-pressure'] as Difficulty[]) {
    let incidents = 0, missed = 0, budgetLeft = 0, worst = 0, boardSum = 0, programmesStarted = 0, brokeCount = 0
    const bands: Record<string, number> = {}
    for (let i = 0; i < n; i += 1) {
      SEED = `sweep-${i}`
      const out = play(difficulty, appetite)
      incidents += Object.keys(out.state.incidents.incidents).length
      missed += Object.values(out.state.business.objectives).filter((o) => o.status === 'failed').length
      budgetLeft += out.state.resources.budgetRemaining
      worst += Object.values(out.state.incidents.incidents).reduce((m, inc) => Math.max(m, inc.consequence), 0)
      boardSum += out.state.stakeholders.boardConfidence
      programmesStarted += out.wantedProgramme
      brokeCount += out.refused.filter((r) => /not enough budget/i.test(r)).length
      const band = out.review.dimensions.find((d) => d.id === 'resilience')!.band
      bands[band] = (bands[band] ?? 0) + 1
    }
    console.log(
      `${difficulty.padEnd(14)} incidents/yr ${(incidents / n).toFixed(2)} · objectives missed ${(missed / n).toFixed(2)}` +
      ` · worst consequence ${(worst / n).toFixed(2)} · board ${(boardSum / n).toFixed(2)}` +
      ` · budget left £${(budgetLeft / n / 1000).toFixed(2)}m · programmes started ${(programmesStarted / n).toFixed(1)}` +
      ` · refused for money ${(brokeCount / n).toFixed(1)}x · resilience ${Object.entries(bands).map(([b, c]) => `${b} ${c}`).join(', ')}`,
    )
  }
  process.exit(0)
}

const mode = process.argv[2] as Difficulty
const r = play(mode, (process.argv[4] as Appetite) ?? 'measured')
console.log(`\n================ ${mode.toUpperCase()} · seed ${SEED} ================`)
console.log(r.log.join('\n'))
console.log(`\n--- where the world said no (${r.refused.length}) ---`)
console.log(r.refused.slice(0, 14).join('\n') || '  nothing refused')
console.log(`\n--- the year in numbers ---`)
console.log(`  programmes started ${r.wantedProgramme}/3 · enquiries run ${r.wantedEnquiry}/5 · board papers ${r.boards}/3`)
console.log(`  patterns formed ${r.patternsFormed}, unaffordable on ${r.patternsUnaffordable} days`)
console.log(`  incidents ${Object.keys(r.state.incidents.incidents).length} · budget left £${(r.state.resources.budgetRemaining / 1000).toFixed(2)}m of £${(r.state.resources.budgetTotal / 1000).toFixed(2)}m`)
console.log(`  board ${r.view.boardConfidence} · team ${r.team.functions.map((f) => `${f.fn}:${f.moraleLabel}`).join(' ')}`)
console.log(`\n--- the close ---`)
console.log(`  ${r.review.headline}\n  ${r.review.performanceBand}`)
for (const d of r.review.dimensions) console.log(`  ${d.band.toUpperCase().padEnd(11)} ${d.label}: ${d.narrative}`)
