import { describe, expect, it } from 'vitest'
import { parseCampaignContent } from '@/lib/content/loader'
import { nexoraContentRaw } from '@/content/nexora'

/**
 * A decision must stay answerable.
 *
 * Priced options are refused when the year cannot pay for them, so a decision
 * whose every option carried a discretionary cost would become unanswerable for
 * a player who had spent the budget — and would then lapse into its default,
 * taking the choice away for the one reason the player could do least about.
 */
describe('decision affordability', () => {
  const content = parseCampaignContent(nexoraContentRaw)

  it('always leaves a broke player something they can choose', () => {
    for (const decision of content.decisions) {
      const answerable = decision.options.filter((option) => {
        const treatment = option.budgetTreatment ?? 'discretionary'
        if (treatment !== 'discretionary') return true
        const cost = option.immediateEffects.reduce(
          (total, effect) =>
            effect.type === 'budget.change' && effect.amount < 0 ? total - effect.amount : total,
          0,
        )
        return cost === 0
      })
      expect(answerable.length, `${decision.id} has no option a player with no budget could take`).toBeGreaterThan(0)
    }
  })

  it('states a price once, as an effect, so the card cannot disagree with the spend', () => {
    for (const decision of content.decisions) {
      for (const option of decision.options) {
        const priced = option.immediateEffects.some((e) => e.type === 'budget.change' && e.amount < 0)
        if (priced) {
          expect(
            option.requirements?.budget,
            `${option.id} states its cost twice — as an effect and as a requirement`,
          ).toBeUndefined()
          // The dialog prints the price beside the option; "Costs £250k" in
          // the option's own words said it a second time.
          const words = [option.label, option.description, ...(option.visibleKnownEffects ?? [])].join(' ')
          expect(words, `${option.id} repeats its price in its text`).not.toMatch(/£\s?\d/)
        }
        if (option.requirements?.focus) {
          // The card prints the attention an option spends, as it prints money.
          const words = [option.label, option.description, ...(option.visibleKnownEffects ?? [])].join(' ')
          expect(words, `${option.id} repeats its attention cost in its text`).not.toMatch(/costs attention/i)
        }
      }
    }
  })

  it('does not promise that nothing changes when something does', () => {
    // "Defer until after the launch" read "Nothing changes" and cost Legal's
    // trust and a standing concern the player was never told about.
    const felt = new Set(['stakeholder.trust', 'stakeholder.concern', 'board.confidence', 'team.morale', 'leader.morale', 'budget.change'])
    for (const decision of content.decisions) {
      for (const option of decision.options) {
        const claim = (option.visibleKnownEffects ?? []).find((v) => /^(nothing (changes|happens)|no change|costs nothing|no cost)\b/i.test(v))
        if (!claim) continue
        const said = (option.visibleKnownEffects ?? []).join(' ')
        for (const effect of option.immediateEffects) {
          if (!felt.has(effect.type)) continue
          // A cost named in the same breath is not a hidden one.
          const named = /trust|remember|escalate|exhausted|morale|concern|notice/i.test(said)
          expect(named, `${option.id} says "${claim}" and applies ${effect.type}`).toBe(true)
        }
      }
    }
  })

  it('takes the capacity it warns about', () => {
    // "Engineering time in peak season" was printed on an option that took
    // none: the warning was true of the story and false of the game.
    for (const decision of content.decisions) {
      for (const option of decision.options) {
        const said = (option.visibleKnownEffects ?? []).join(' ')
        if (!/capacity|engineering time|team's attention|workload/i.test(said)) continue
        const effects = [...option.immediateEffects, ...(option.delayedEffects ?? []).flatMap((d) => d.effects)]
        const takes = effects.some((e) => e.type === 'capacity.change' || e.type === 'team.workload')
        expect(takes, `${option.id} warns "${said}" and takes no capacity`).toBe(true)
      }
    }
  })

  it('names only the timescale its delayed effects keep', () => {
    // "Takes three months to take effect" took 75 days and "Six months of
    // your team's attention" returned the analyst after 150. Where a card
    // names a length of time and the option has delayed effects, the last of
    // them lands within a tenth of it.
    const words: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }
    const units: Record<string, number> = { day: 1, week: 7, month: 30.4 }
    const span = /\b(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?: to (\d+|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve))? (day|week|month)s?\b/i
    let checked = 0
    for (const decision of content.decisions) {
      for (const option of decision.options) {
        const last = Math.max(0, ...(option.delayedEffects ?? []).map((delayed) => delayed.dayOffset))
        if (last === 0) continue
        for (const said of option.visibleKnownEffects) {
          const match = span.exec(said)
          if (!match) continue
          const count = (token: string) => words[token.toLowerCase()] ?? Number(token)
          const unit = units[match[3]!.toLowerCase()]!
          const low = count(match[1]!) * unit
          const high = (match[2] ? count(match[2]) : count(match[1]!)) * unit
          checked += 1
          expect(last >= low * 0.9 && last <= high * 1.1, `${option.id} says "${said}" but its last effect lands on day ${last}`).toBe(true)
        }
      }
    }
    expect(checked).toBeGreaterThan(3)
  })
})
