import { describe, expect, it } from 'vitest'
import { LESSONS, lessonContext } from '@/components/game/lessons'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { testIndex } from './helpers'

describe('onboarding', () => {
  it('teaches every mechanic the plan names', () => {
    // Plan §45: teach these when first encountered.
    const required = [
      'evidence',
      'hypothesis',
      'risk scenario',
      'investigation',
      'programme',
      'stakeholder influence',
      'assumption',
      'incident',
    ]
    const taught = new Set(LESSONS.map((lesson) => lesson.teaches))
    const missing = required.filter((mechanic) => !taught.has(mechanic))
    expect(missing, `no lesson covers: ${missing.join(', ')}`).toEqual([])
  })

  it('gives every lesson a unique id and a body worth reading', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
    for (const lesson of LESSONS) {
      expect(lesson.title.length, lesson.id).toBeGreaterThan(8)
      expect(lesson.body.length, lesson.id).toBeGreaterThan(60)
    }
  })

  it('can actually trigger every lesson during a campaign', () => {
    // The failure this guards is a note whose moment never arrives: it teaches
    // nobody, and nothing else in the build would notice.
    const index = testIndex()
    const seen = new Set<string>()

    for (const seed of ['onb-1', 'onb-2', 'onb-3', 'onb-4']) {
      const state = newGame(index, { seed })
      const commissioned: Record<string, number> = {}
      for (let day = 0; day < 364; day += 1) {
        for (const lesson of LESSONS) {
          if (lesson.when(lessonContext(state))) seen.add(lesson.id)
        }

        for (const decisionId of [...state.decisions.openIds]) {
          const runtime = state.decisions.decisions[decisionId]
          const def = runtime ? index.decision.get(runtime.defId) : undefined
          if (!def) continue
          applyAction(state, index, {
            type: 'resolveDecision',
            decisionId,
            optionId: def.options[0]!.id,
            rationaleTagIds: ['rat-within-tolerance'],
          })
        }
        if (day % 12 === 0) {
          const order = [...index.content.investigations].sort(
            (a, b) => (commissioned[a.id] ?? 0) - (commissioned[b.id] ?? 0),
          )
          for (const investigation of order) {
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
            applyAction(state, index, { type: 'createHypothesis', templateId: template.id, evidenceIds: supporting.slice(0, 4) })
          }
        }
        if (day % 30 === 0) {
          const scenario = Object.values(state.risks.scenarios).find((s) => s.status === 'emerging')
          if (scenario) applyAction(state, index, { type: 'openRisk', scenarioId: scenario.id })
        }
        if (day % 45 === 0) {
          const open = Object.values(state.risks.scenarios).find((s) => s.status === 'open')
          if (open) {
            applyAction(state, index, {
              type: 'acceptRisk',
              scenarioId: open.id,
              rationaleTagIds: ['rat-within-tolerance'],
              assumptionDefIds: index.content.assumptions.slice(0, 1).map((a) => a.id),
              days: 90,
            })
          }
        }
        runDays(state, index, 1)
      }
    }

    const unreachable = LESSONS.filter((lesson) => !seen.has(lesson.id)).map((l) => l.id)
    expect(unreachable, `these lessons never became showable:\n${unreachable.join('\n')}`).toEqual([])
  })
})
