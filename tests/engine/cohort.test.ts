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

function idleYear(seed: string, difficulty: 'guided' | 'ciso' = 'ciso'): { family: string; month: number }[] {
  const state = newGame(index, { seed, difficulty, situation })
  runDays(state, index, 364)
  return Object.values(state.incidents.incidents)
    .sort((a, b) => a.startedDay - b.startedDay)
    .map((incident) => ({ family: index.incidentFamily.get(incident.familyId)!.name, month: Math.floor(incident.startedDay / 30.4) + 1 }))
}

describe('the facilitator pack names seeds that still give the years it says', () => {
  // Guided: since 25 November CISO years always have an incident by mid-year.
  it('class-12 and class-1 are quiet Guided years for a player who does nothing', () => {
    for (const seed of ['class-12', 'class-1']) expect(idleYear(seed, 'guided'), seed).toEqual([])
  })

  it('class-5 opens with a ransomware in May', () => {
    expect(idleYear('class-5')[0]).toEqual({ family: 'Ransomware and service encryption', month: 5 })
  })

  // class-26 was ransomware three times until reflections came the day after
  // every incident (28 November) moved the draws; class-62 is twice.
  it('class-62 is ransomware twice', () => {
    expect(idleYear('class-62').map((incident) => incident.family)).toEqual([
      'Ransomware and service encryption', 'Ransomware and service encryption',
    ])
  })

  it('class-10 follows a data exposure with a destructive attack', () => {
    expect(idleYear('class-10')).toEqual([{ family: 'Customer data exposure', month: 5 }, { family: 'Destructive attack', month: 10 }])
  })
})
