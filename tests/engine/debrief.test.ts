import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview, buildQuarterReview, chooseHeadline, materialTopics } from '@/game/debrief/review'
import { unexaminedMaterial } from '@/game/knowledge/discovery'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import type { AnnualReviewDimension } from '@/game/types'
import { testIndex } from './helpers'

describe('reviews', () => {
  it('penalises a board pack that omits a material topic', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-1' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    runDays(state, index, 91)
    const scenario = state.risks.scenarios['risk-supplier-ransomware']!
    scenario.lastAssessed = { day: state.currentDay, exposure: 0.8, consequence: 0.8, residual: 0.8 }

    const topics = materialTopics(state, index)
    expect(topics.some((t) => t.material)).toBe(true)

    const omitted = buildQuarterReview(state, index, { quarter: 1, topics: [], recommendations: [], communicateUncertainty: false })
    expect(omitted.effects.some((e) => e.type === 'board.confidence' && e.delta < 0)).toBe(true)

    const covered = buildQuarterReview(state, index, {
      quarter: 1,
      topics: topics.filter((t) => t.material).map((t) => t.id),
      recommendations: [],
      communicateUncertainty: true,
    })
    expect(covered.effects.some((e) => e.type === 'board.confidence' && e.delta > 0)).toBe(true)
  })

  it('puts a risk the player raised on the board agenda, controlled or not', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-board' })
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    runDays(state, index, 91)

    // The player's own work has brought the likelihood down; the consequence
    // to the business is unchanged. Judging materiality on residual alone
    // dropped exactly these off the agenda — the better the player did, the
    // less the board heard, which is backwards.
    const scenario = state.risks.scenarios['risk-supplier-ransomware']!
    scenario.lastAssessed = { day: state.currentDay, exposure: 0.1, consequence: 0.6, residual: 0.2 }
    expect(materialTopics(state, index).some((t) => t.id.endsWith('risk-supplier-ransomware') && t.material)).toBe(true)

    // And a risk carried on the organisation's behalf is theirs to know about.
    scenario.lastAssessed = { day: state.currentDay, exposure: 0.05, consequence: 0.1, residual: 0.05 }
    expect(materialTopics(state, index).some((t) => t.id.endsWith('risk-supplier-ransomware') && t.material)).toBe(false)
    scenario.status = 'accepted'
    expect(materialTopics(state, index).some((t) => t.id.endsWith('risk-supplier-ransomware') && t.material)).toBe(true)
  })

  it('produces a multi-dimensional narrative review rather than a single score', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-2' })
    runDays(state, index, 364)
    const review = buildAnnualReview(state, index)
    expect(review.dimensions.length).toBeGreaterThanOrEqual(7)
    for (const dimension of review.dimensions) {
      expect(dimension.narrative.length).toBeGreaterThan(20)
      expect(['weak', 'developing', 'solid', 'strong']).toContain(dimension.band)
    }
    expect(review.narrative.length).toBeGreaterThan(1)
    expect(review.businessOutcome).toMatch(/objective/i)
  })

  it('references the decisions and rationale the player recorded', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-3' })
    for (let day = 0; day < 364; day += 1) {
      for (const decisionId of [...state.decisions.openIds]) {
        const decision = state.decisions.decisions[decisionId]
        const def = decision ? index.decision.get(decision.defId) : undefined
        if (!def) continue
        applyAction(state, index, {
          type: 'resolveDecision',
          decisionId,
          optionId: def.options[0]!.id,
          rationaleTagIds: ['rat-more-evidence'],
        })
      }
      runDays(state, index, 1)
    }
    const review = buildAnnualReview(state, index)
    const prioritisation = review.dimensions.find((d) => d.id === 'prioritisation')!
    expect(prioritisation.evidence.join(' ')).toMatch(/recorded rationale/)
    expect(state.history.decisionsLog.every((entry) => entry.rationaleTagIds.length > 0)).toBe(true)
  })

  it('closes with a line that reflects which dimensions diverged', () => {
    // The defect this guards: the headline used to key on incident count alone,
    // so three very different years closed on the same sentence.
    const profile = (
      bands: Partial<Record<string, AnnualReviewDimension['band']>>,
      fallback: AnnualReviewDimension['band'] = 'developing',
    ): AnnualReviewDimension[] =>
      (
        [
          'risk-understanding',
          'prioritisation',
          'resilience',
          'programme-execution',
          'business-enablement',
          'communication',
          'team-sustainability',
          'blind-spots',
        ] as const
      ).map((id) => ({
        id,
        label: id.replace(/-/g, ' '),
        band: bands[id] ?? fallback,
        narrative: 'x',
        evidence: [],
      }))

    const years = [
      // Delivered for the business, built nothing. A trade-off is something
      // the player made, so these all decide rather than lapse.
      chooseHeadline(profile({ 'business-enablement': 'strong', 'programme-execution': 'weak' }), false),
      // Let the year happen: not a trade-off, an absence.
      chooseHeadline(profile({ prioritisation: 'weak', 'business-enablement': 'strong', 'programme-execution': 'weak' }), false),
      // Built everything, the business missed its year.
      chooseHeadline(profile({ 'programme-execution': 'strong', 'business-enablement': 'weak' }), false),
      // Built everything, on people who are finished.
      chooseHeadline(
        profile({ 'programme-execution': 'strong', 'business-enablement': 'solid', 'team-sustainability': 'weak' }),
        false,
      ),
      // Understood the place, never changed it.
      chooseHeadline(profile({ 'risk-understanding': 'strong', 'programme-execution': 'weak' }), false),
      // Burned the team without building anything with it.
      chooseHeadline(profile({ 'team-sustainability': 'weak' }), false),
      // Tested and held.
      chooseHeadline(profile({ resilience: 'strong' }), true),
      // Tested and did not hold.
      chooseHeadline(profile({ resilience: 'weak' }), true),
      // Acted all year on a picture never verified.
      chooseHeadline(profile({ 'blind-spots': 'weak' }), false),
      // Solid across the board.
      chooseHeadline(profile({}, 'solid'), false),
      // Middling across the board.
      chooseHeadline(profile({}), false),
    ]

    expect(new Set(years).size).toBe(years.length)
    for (const line of years) expect(line.length).toBeGreaterThan(12)
  })

  it('credits no examination on the first morning, and credits the player\'s own', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'inherited-assurance' })
    // The inherited assurance picture is recorded at day -180 and counted as
    // knowing for its first twenty days, so the Briefing told a brand-new CISO
    // they had checked "a start" of Nexora — 13 of 32 — before looking at
    // anything, then took it away on day 21 with no explanation.
    expect(unexaminedMaterial(state, index).examined).toBe(0)
    runDays(state, index, 10)
    expect(unexaminedMaterial(state, index).examined).toBe(0)

    // Assurance the player commissions themselves does count.
    const controlId = index.content.controls[0]!.id
    applyEffects(state, [{ type: 'control.assess', controlId }], {
      index,
      rng: createRng('assess'),
      source: 'test',
    })
    expect(unexaminedMaterial(state, index).examined).toBe(1)
  })

  it('separates what the player examined from what they were handed', () => {
    // The defect this guards: blind spots were counted as things never
    // discovered, but the inherited register and passing mentions in events
    // discover nearly the whole estate within a year. The dimension read
    // "strong" for a player who looked at nothing.
    const index = testIndex()

    const idle = newGame(index, { seed: 'exam-idle' })
    runDays(idle, index, 364)
    const idleExamined = unexaminedMaterial(idle, index)
    expect(idleExamined.reachable).toBeGreaterThan(20)
    expect(idleExamined.examined).toBe(0)
    expect(buildAnnualReview(idle, index).dimensions.find((d) => d.id === 'blind-spots')!.band).toBe('weak')

    const working = newGame(index, { seed: 'exam-idle' })
    const commissioned: Record<string, number> = {}
    for (let day = 0; day < 364; day += 1) {
      if (day % 12 === 0) {
        // Work down the list rather than pressing the same button all year.
        const order = [...index.content.investigations].sort(
          (a, b) => (commissioned[a.id] ?? 0) - (commissioned[b.id] ?? 0),
        )
        for (const investigation of order) {
          const result = applyAction(working, index, {
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
      runDays(working, index, 1)
    }

    const workedExamined = unexaminedMaterial(working, index)
    expect(workedExamined.examined).toBeGreaterThan(idleExamined.examined)
    const band = buildAnnualReview(working, index).dimensions.find((d) => d.id === 'blind-spots')!.band
    expect(['developing', 'solid', 'strong']).toContain(band)
  })

  it('tells apart deciding late, deciding some, and deciding nothing', () => {
    // The defect this guards: prioritisation scored `weak` or `strong` and
    // nothing between, because only letting more than half a year's decisions
    // lapse could fail it, and the rationale half was constant.
    const index = testIndex()

    const playStyle = (style: 'ignore' | 'lastMinute' | 'someLapse' | 'prompt') => {
      const state = newGame(index, { seed: 'prio-1' })
      for (let day = 0; day < 364; day += 1) {
        for (const decisionId of [...state.decisions.openIds]) {
          const runtime = state.decisions.decisions[decisionId]
          const def = runtime ? index.decision.get(runtime.defId) : undefined
          if (!def || !runtime) continue
          if (style === 'ignore') continue
          // Ignores a third of the topics outright, so they genuinely lapse.
          if (style === 'someLapse' && def.id.length % 3 === 0) continue
          if (
            style === 'lastMinute' &&
            runtime.deadlineDay !== undefined &&
            state.currentDay < runtime.deadlineDay - 1
          ) {
            continue
          }
          applyAction(state, index, {
            type: 'resolveDecision',
            decisionId,
            optionId: def.options[0]!.id,
            rationaleTagIds: ['rat-within-tolerance'],
          })
        }
        runDays(state, index, 1)
      }
      return buildAnnualReview(state, index).dimensions.find((d) => d.id === 'prioritisation')!.band
    }

    expect(playStyle('ignore')).toBe('weak')
    expect(playStyle('someLapse')).toBe('developing')
    expect(playStyle('lastMinute')).toBe('solid')
    expect(playStyle('prompt')).toBe('strong')
  })

  it('reckons with the reasons the player gave, not just that they gave one', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'reason-1' })

    // Carry a risk explicitly, on a stated rationale, with assumptions under it.
    applyAction(state, index, { type: 'openRisk', scenarioId: 'risk-supplier-ransomware' })
    const accepted = applyAction(state, index, {
      type: 'acceptRisk',
      scenarioId: 'risk-supplier-ransomware',
      rationaleTagIds: ['rat-within-tolerance'],
      assumptionDefIds: index.content.assumptions.slice(0, 2).map((a) => a.id),
      days: 200,
    })
    expect(accepted.ok).toBe(true)
    runDays(state, index, 364)

    const review = buildAnnualReview(state, index)
    // Always produced by the builder; optional only on the stored review.
    const reasoning = review.reasoning ?? []
    const line = reasoning.find((entry) => entry.tagId === 'rat-within-tolerance')
    expect(line, 'the rationale the player actually used should appear').toBeDefined()
    expect(line!.uses).toBeGreaterThan(0)
    // Counted as occasions, so a contradiction can never outnumber the uses.
    expect(line!.materialised).toBeLessThanOrEqual(line!.uses)
    expect(line!.assumptionsFailed).toBeLessThanOrEqual(line!.uses)
    expect(line!.verdict).toMatch(/leaned on this/)

    // A rationale the player never used is not editorialised about.
    expect(reasoning.some((entry) => entry.tagId === 'rat-retirement')).toBe(false)
  })

  it('names material blind spots left at the end of the year', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'rev-4' })
    runDays(state, index, 364)
    const review = buildAnnualReview(state, index)
    expect(Array.isArray(review.blindSpots)).toBe(true)
    const understanding = state.organisation.understanding['overall'] ?? 0
    if (understanding < 0.6) expect(review.blindSpots.length).toBeGreaterThan(0)
  })
})
