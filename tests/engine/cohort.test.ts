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
  it('class-15, class-3 and class-20 are quiet years for a player who does nothing', () => {
    for (const seed of ['class-15', 'class-3', 'class-20']) expect(idleYear(seed), seed).toEqual([])
  })

  it('class-5 opens with a ransomware in May', () => {
    expect(idleYear('class-5')[0]).toEqual({ family: 'Ransomware and service encryption', month: 5 })
  })

  it('class-2 is an October ransomware that comes back in December', () => {
    expect(idleYear('class-2')).toEqual([
      { family: 'Ransomware and service encryption', month: 10 },
      { family: 'Ransomware and service encryption', month: 12 },
    ])
  })

  it('class-21 follows payment diversion with a legacy-platform incident', () => {
    const year = idleYear('class-21')
    expect(year).toHaveLength(2)
    expect(year).toEqual([{ family: 'Payment diversion', month: 4 }, { family: 'Legacy platform compromise and outage', month: 9 }])
  })
})
