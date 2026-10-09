import { describe, expect, it } from 'vitest'
import { newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

/**
 * docs/educator/FACILITATOR.md tells a teacher which seed gives which year.
 * Those facts hold for a player who does nothing, the case the table can
 * promise; if a change to the game moves them, the table is wrong and this
 * fails, pointing at it. Re-run `pnpm cohort 30 ciso class` and update both.
 */
const index = testIndex()
const situation = index.content.situations?.[0]?.id

function idleYear(seed: string): { family: string; month: number }[] {
  const state = newGame(index, { seed, difficulty: 'ciso', situation })
  runDays(state, index, 364)
  return Object.values(state.incidents.incidents)
    .sort((a, b) => a.startedDay - b.startedDay)
    .map((incident) => ({ family: index.incidentFamily.get(incident.familyId)!.name, month: Math.floor(incident.startedDay / 30.4) + 1 }))
}

describe('the facilitator pack names seeds that still give the years it says', () => {
  it('class-6, class-4 and class-27 are quiet years', () => {
    for (const seed of ['class-6', 'class-4', 'class-27']) expect(idleYear(seed), seed).toEqual([])
  })

  it('class-25 is a summer ransomware', () => {
    expect(idleYear('class-25')[0]).toEqual({ family: 'Ransomware and service encryption', month: 7 })
  })

  it('class-9 is a July data exposure', () => {
    expect(idleYear('class-9')).toEqual([{ family: 'Customer data exposure', month: 7 }])
  })

  it('class-28 is the same data weakness three times', () => {
    const year = idleYear('class-28')
    expect(year).toHaveLength(3)
    expect(new Set(year.map((incident) => incident.family))).toEqual(new Set(['Customer data exposure']))
  })
})
