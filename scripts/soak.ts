/**
 * `pnpm tsx scripts/soak.ts [runs] [--years N]`
 *
 * `--years 2` plays each campaign on into the year that follows it
 * (src/game/engine/next-year.ts), checking the invariants at the end of every
 * year, and reports each year's incidents separately.
 *
 * The definition-of-done check: a large number of automated seeded campaigns
 * with no uncaught runtime error and no invariant violation (plan §53).
 */
import { rationaleFor } from './play-helpers'
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, runDays, applyAction, beginNextYear } from '../src/game/engine/orchestrator'
import { finishYear } from '../src/game/debrief/review'
import { checkInvariants } from '../src/game/engine/invariants'
import { loadPack, packArgument } from './content/pack.ts'
import { validatedCampaign } from '../src/lib/content/validate-content'
import type { Difficulty, GameState } from '../src/game/types'

const DIFFICULTIES: Difficulty[] = ['guided', 'ciso', 'high-pressure']

function main(): void {
  const args = process.argv.slice(2)
  const yearsAt = args.indexOf('--years')
  const years = yearsAt >= 0 ? Math.max(1, Number(args.splice(yearsAt, 2)[1] ?? 1)) : 1
  const runs = Number(packArgument(args).rest[0] ?? 1000)
  const index = buildContentIndex(validatedCampaign(loadPack(packArgument(process.argv.slice(2)).path).raw))
  const started = Date.now()

  let violations = 0
  let crashes = 0
  let incidents = 0
  let quietYears = 0
  let busyYears = 0
  let decisions = 0
  const incidentsByYear: number[] = Array.from({ length: years }, () => 0)

  for (let i = 0; i < runs; i += 1) {
    const difficulty = DIFFICULTIES[i % DIFFICULTIES.length]!
    try {
      let state: GameState = newGame(index, { seed: `soak-${i}`, difficulty, situation: 'surprise' })
      for (let year = 1; year <= years; year += 1) {
      if (year > 1) {
        finishYear(state, index)
        state = beginNextYear(index, state)
      }
      // A light policy: answer whatever is open, then keep the clock moving.
      for (let day = state.currentDay; day < 364; day += 1) {
        for (const decisionId of [...state.decisions.openIds]) {
          const runtime = state.decisions.decisions[decisionId]
          const def = runtime ? index.decision.get(runtime.defId) : undefined
          const option = def?.options[i % def.options.length]
          if (!option) continue
          applyAction(state, index, {
            type: 'resolveDecision',
            decisionId,
            optionId: option.id,
            rationaleTagIds: rationaleFor(index, state.decisions.decisions[decisionId]!.defId),
          })
          decisions += 1
        }
        runDays(state, index, 1)
      }

      const found = checkInvariants(state, index)
      if (found.length > 0) {
        violations += 1
        if (violations <= 5) console.error(`seed soak-${i}, year ${year}:`, found.slice(0, 3))
      }
      const count = Object.keys(state.incidents.incidents).length
      incidentsByYear[year - 1]! += count
      if (year === 1) {
        incidents += count
        if (count === 0) quietYears += 1
        if (count >= 4) busyYears += 1
      }
      }
    } catch (error) {
      crashes += 1
      if (crashes <= 5) console.error(`seed soak-${i} threw:`, error)
    }
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`\n${runs} campaigns in ${seconds}s`)
  console.log(`  crashes            ${crashes}`)
  console.log(`  invariant failures ${violations}`)
  console.log(`  incidents per run  ${(incidents / runs).toFixed(2)}`)
  console.log(`  years with none    ${((quietYears / runs) * 100).toFixed(0)}%`)
  console.log(`  years with 4+      ${((busyYears / runs) * 100).toFixed(0)}%`)
  console.log(`  decisions taken    ${decisions}`)
  if (years > 1) {
    console.log(`  incidents by year  ${incidentsByYear.map((n, y) => `year ${y + 1}: ${(n / runs).toFixed(2)}`).join(' · ')}`)
  }

  if (crashes > 0 || violations > 0) process.exit(1)
}

main()
