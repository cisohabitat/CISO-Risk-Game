// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from '@/store/game-store'
import { beginFresh, installSessionLog, sessionLogJson, type SessionLog } from '@/store/session-log'
import { isRecording, setRecording } from '@/store/session-recording'

/**
 * Phase 0 of docs/ROADMAP.md: a playtest needs a record of what the player did
 * and when, kept on the device and handed over as a file.
 */
const events = () => (JSON.parse(sessionLogJson()) as SessionLog).events

describe('the playtest session log', () => {
  beforeEach(async () => {
    localStorage.clear()
    localStorage.setItem('ciso-session-recording', 'on')
    await useGameStore.getState().startNewGame('session-log', 'ciso')
    installSessionLog()
    beginFresh()
  })

  it('opens on the campaign and the screen', () => {
    const [campaign, screen] = events()
    expect(campaign).toMatchObject({ kind: 'campaign', seed: 'session-log', difficulty: 'ciso', day: 1 })
    expect(screen).toMatchObject({ kind: 'screen', screen: 'home' })
  })

  it('records what the player does, with the day, but nothing they typed', () => {
    const { state, index } = useGameStore.getState()
    const decisionId = state!.decisions.openIds[0]!
    const def = index!.decision.get(state!.decisions.decisions[decisionId]!.defId)!
    useGameStore.getState().dispatch({
      type: 'resolveDecision',
      decisionId,
      optionId: def.options[0]!.id,
      rationaleTagIds: def.rationaleTagIds?.slice(0, 1) ?? ['rat-material'],
      note: 'my private reasoning',
    })
    useGameStore.getState().setScreen('risk')
    const action = events().find((event) => event.kind === 'action')!
    expect(action).toMatchObject({ type: 'resolveDecision', decisionId, optionId: def.options[0]!.id, day: 1 })
    expect(typeof action.ok).toBe('boolean')
    expect(sessionLogJson()).not.toContain('my private reasoning')
    expect(events().at(-1)).toMatchObject({ kind: 'screen', screen: 'risk' })
  })

  it('leaves out the clock ticking, but keeps a skip ahead', () => {
    useGameStore.getState().advanceDays(1)
    expect(events().filter((event) => event.kind === 'action')).toEqual([])
    useGameStore.getState().advanceDays(30)
    expect(events().filter((event) => event.kind === 'action').map((event) => event.type)).toEqual(['advance'])
  })

  it('notes where the clock stopped the player, and the glossary they opened', () => {
    useGameStore.setState((store) => ({ state: { ...store.state!, pauseReasons: [] } }))
    useGameStore.setState((store) => ({ state: { ...store.state!, pauseReasons: ['incident'] } }))
    useGameStore.getState().openGlossary('gls-residual')
    expect(events().find((event) => event.kind === 'paused')).toMatchObject({ reasons: ['incident'] })
    expect(events().find((event) => event.kind === 'glossary')).toMatchObject({ term: 'gls-residual' })
  })

  it('survives a reload, and starts a fresh log when switched on again', () => {
    useGameStore.getState().setScreen('team')
    const stored = JSON.parse(localStorage.getItem('ciso-session-log')!) as SessionLog
    expect(stored.events.at(-1)).toMatchObject({ kind: 'screen', screen: 'team' })
    beginFresh()
    expect(events().map((event) => event.kind)).toEqual(['campaign', 'screen'])
  })

  it('writes nothing once switched off', () => {
    expect(isRecording()).toBe(true)
    setRecording(false)
    expect(isRecording()).toBe(false)
    const before = events().length
    useGameStore.getState().setScreen('board')
    expect(events()).toHaveLength(before)
  })
})
