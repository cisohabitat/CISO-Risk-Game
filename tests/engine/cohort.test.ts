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
  it('class-15, class-7 and class-20 are quiet years for a player who does nothing', () => {
    for (const seed of ['class-15', 'class-7', 'class-20']) expect(idleYear(seed), seed).toEqual([])
  })

  it('class-5 opens with a ransomware in May', () => {
    expect(idleYear('class-5')[0]).toEqual({ family: 'Ransomware and service encryption', month: 5 })
  })

  it('class-12 is an August ransomware', () => {
    expect(idleYear('class-12')).toEqual([{ family: 'Ransomware and service encryption', month: 8 }])
  })

  it('class-21 is the same payment diversion twice', () => {
    const year = idleYear('class-21')
    expect(year).toHaveLength(2)
    expect(new Set(year.map((incident) => incident.family))).toEqual(new Set(['Payment diversion']))
  })
})
