/**
 * `pnpm tsx scripts/soak.ts [runs]`
 *
 * The definition-of-done check: a large number of automated seeded campaigns
 * with no uncaught runtime error and no invariant violation (plan §53).
 */
import { buildContentIndex } from '../src/game/engine/content-index'
import { newGame, runDays, applyAction } from '../src/game/engine/orchestrator'
import { checkInvariants } from '../src/game/engine/invariants'
import { nexoraContent } from '../src/content/nexora'
import type { Difficulty } from '../src/game/types'

const DIFFICULTIES: Difficulty[] = ['guided', 'ciso', 'high-pressure']

function main(): void {
  const runs = Number(process.argv[2] ?? 1000)
  const index = buildContentIndex(nexoraContent)
  const started = Date.now()

  let violations = 0
  let crashes = 0
  let incidents = 0
  let quietYears = 0
  let busyYears = 0
  let decisions = 0

  for (let i = 0; i < runs; i += 1) {
    const difficulty = DIFFICULTIES[i % DIFFICULTIES.length]!
    try {
      const state = newGame(index, { seed: `soak-${i}`, difficulty })
      // A light policy: answer whatever is open, then keep the clock moving.
      for (let day = 0; day < 364; day += 1) {
        for (const decisionId of [...state.decisions.openIds]) {
          const runtime = state.decisions.decisions[decisionId]
          const def = runtime ? index.decision.get(runtime.defId) : undefined
          const option = def?.options[i % def.options.length]
          if (!option) continue
          applyAction(state, index, {
            type: 'resolveDecision',
            decisionId,
            optionId: option.id,
            rationaleTagIds: ['rat-within-tolerance'],
          })
          decisions += 1
        }
        runDays(state, index, 1)
      }

      const found = checkInvariants(state, index)
      if (found.length > 0) {
        violations += 1
        if (violations <= 5) console.error(`seed soak-${i}:`, found.slice(0, 3))
      }
      const count = Object.keys(state.incidents.incidents).length
      incidents += count
      if (count === 0) quietYears += 1
      if (count >= 4) busyYears += 1
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

  if (crashes > 0 || violations > 0) process.exit(1)
}

main()
