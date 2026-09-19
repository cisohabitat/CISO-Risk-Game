import { describe, expect, it } from 'vitest'
import { campaignContentSchema } from '@/lib/schemas/content'
import { validateCampaignContent } from '@/lib/content/validate'
import { nexoraContentRaw } from '@/content/nexora'
import type { CampaignContent } from '@/game/types'

const parsed = campaignContentSchema.safeParse(nexoraContentRaw)

describe('campaign content', () => {
  it('matches the authoring schema', () => {
    if (!parsed.success) {
      const detail = parsed.error.issues
        .slice(0, 10)
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')
      throw new Error(`Schema validation failed:\n${detail}`)
    }
    expect(parsed.success).toBe(true)
  })

  it('has no referential errors', () => {
    const content = parsed.success ? (parsed.data as unknown as CampaignContent) : undefined
    expect(content).toBeDefined()
    const issues = validateCampaignContent(content!)
    const errors = issues.filter((issue) => issue.severity === 'error')
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([])
  })

  it('meets the MVP content budget', () => {
    const content = parsed.data as unknown as CampaignContent
    expect(content.services.length).toBeGreaterThanOrEqual(5)
    expect(content.nodes.length).toBeGreaterThanOrEqual(15)
    expect(content.edges.length).toBeGreaterThanOrEqual(30)
    expect(content.stakeholders.length).toBeGreaterThanOrEqual(6)
    expect(content.leaders.length).toBeGreaterThanOrEqual(4)
    expect(content.programmes.length).toBeGreaterThanOrEqual(6)
    expect(content.actors.length).toBeGreaterThanOrEqual(3)
    expect(content.incidentFamilies.length).toBeGreaterThanOrEqual(4)
    expect(content.events.length).toBeGreaterThanOrEqual(80)
    expect(content.riskScenarios.length + content.hypothesisTemplates.length).toBeGreaterThanOrEqual(25)
  })

  it('includes deliberate risk noise as well as material findings', () => {
    const content = parsed.data as unknown as CampaignContent
    const noise = content.evidence.filter((e) => e.noise)
    expect(noise.length).toBeGreaterThanOrEqual(3)
    // A severe-looking finding on something that does not matter.
    expect(noise.some((e) => e.sourceType === 'vulnerability')).toBe(true)
    // And a moderate weakness that does.
    expect(content.evidence.some((e) => !e.noise && e.tags.includes('identity'))).toBe(true)
  })

  it('offers at least ten hidden starting variables', () => {
    const content = parsed.data as unknown as CampaignContent
    const variantEdges = content.edges.filter((e) => e.variantWeight < 1).length
    const variedControls = content.controls.filter((c) => c.variance > 0).length
    const variedPeople = content.stakeholders.filter((s) => s.variance > 0).length
    expect(variantEdges + variedControls + variedPeople).toBeGreaterThanOrEqual(10)
    expect(variantEdges).toBeGreaterThanOrEqual(5)
  })

  it('never hard-codes a fixed day for a threat outcome', () => {
    const content = parsed.data as unknown as CampaignContent
    // Threat and incident events must be conditional rather than calendar-driven.
    for (const event of content.events.filter((e) => e.type === 'threat' || e.type === 'incident')) {
      const onlyDateGated = event.pinned && event.conditions.length === 0
      expect(onlyDateGated, `${event.id} fires on a fixed day with no conditions`).toBe(false)
    }
  })

  it('writes decision options without exposing hidden numbers', () => {
    const content = parsed.data as unknown as CampaignContent
    for (const decision of content.decisions) {
      for (const option of decision.options) {
        const text = `${option.label} ${option.description} ${option.visibleKnownEffects.join(' ')}`
        expect(text, `${decision.id}/${option.id}`).not.toMatch(/[+-]\d+\s*(security|risk|influence|trust|points)/i)
      }
    }
  })

  it('gives every incident family an executive-level response decision', () => {
    const content = parsed.data as unknown as CampaignContent
    for (const family of content.incidentFamilies) {
      expect(family.responseDecisionIds.length, family.id).toBeGreaterThan(0)
    }
  })

  it('makes the programme portfolio unaffordable in a single year', () => {
    const content = parsed.data as unknown as CampaignContent
    const total = content.programmes.reduce((sum, p) => sum + p.budgetCost, 0)
    expect(total).toBeGreaterThan(content.meta.startingBudget)
  })
})

describe('the organisation remembers what the player chose', () => {
  const content = parsed.success ? (parsed.data as unknown as CampaignContent) : undefined

  /** Every flag any condition anywhere consults. */
  function flagsRead(): Set<string> {
    const out = new Set<string>()
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) {
        for (const item of value) walk(item)
        return
      }
      if (!value || typeof value !== 'object') return
      const record = value as Record<string, unknown>
      const kind = record['kind']
      if (typeof kind === 'string' && kind.startsWith('flag.') && typeof record['flag'] === 'string') {
        out.add(record['flag'])
      }
      for (const nested of Object.values(record)) walk(nested)
    }
    walk(content!.events)
    walk(content!.decisions)
    return out
  }

  it('consults every flag a decision option sets', () => {
    expect(content).toBeDefined()
    const read = flagsRead()
    const unread: string[] = []
    for (const decision of content!.decisions) {
      for (const option of decision.options) {
        for (const effect of option.immediateEffects ?? []) {
          if (effect.type !== 'flag.set') continue
          if (!read.has(effect.flag)) unread.push(`${decision.id}/${option.id} sets ${effect.flag}`)
        }
      }
    }
    // A flag set and never read is a choice the organisation immediately
    // forgets, which is the opposite of what the flag is for.
    expect(unread, `these choices are recorded and never referred to again:\n${unread.join('\n')}`).toEqual([])
  })
})

describe('delayed consequences', () => {
  const content = parsed.success ? (parsed.data as unknown as CampaignContent) : undefined

  it('schedules every consequence rather than leaving it to the draw', () => {
    expect(content).toBeDefined()
    const scheduled = new Set<string>()
    for (const decision of content!.decisions) {
      for (const option of decision.options) {
        for (const effect of [...(option.immediateEffects ?? []), ...(option.delayedEffects ?? []).flatMap((d) => d.effects)]) {
          if (effect.type === 'event.schedule') scheduled.add(effect.eventId)
        }
      }
    }
    for (const event of content!.events) {
      for (const effect of event.effectsOnReveal ?? []) {
        if (effect.type === 'event.schedule') scheduled.add(effect.eventId)
      }
    }
    // A scheduled-only event that nothing schedules can never fire at all.
    const orphans = content!.events.filter((event) => event.scheduledOnly && !scheduled.has(event.id)).map((e) => e.id)
    expect(orphans, `nothing ever schedules these:\n${orphans.join('\n')}`).toEqual([])
  })
})
