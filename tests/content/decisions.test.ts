import { describe, expect, it } from 'vitest'
import { parseCampaignContent } from '@/lib/content/validate-content'
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

  it('does not say a setback interrupted an attack it cannot see', () => {
    // A note on an option's setback is shown whenever the option is taken,
    // whether or not a campaign is running. "Suspended mid-operation" and
    // "disrupted activity that had been running" were said in years with
    // nothing running: 158 of 174 for the anomaly. What the attacker was
    // doing belongs in a letter gated on threat.campaignActive.
    const claims = /mid-operation|was working|had been running|disrupted|interrupted/i
    for (const decision of content.decisions) {
      for (const option of decision.options) {
        const effects = [...option.immediateEffects, ...(option.delayedEffects ?? []).flatMap((delayed) => delayed.effects)]
        for (const effect of effects) {
          if (effect.type !== 'threat.setback' || !effect.note) continue
          expect(claims.test(effect.note), `${option.id}: "${effect.note}"`).toBe(false)
        }
      }
    }
  })
})

/**
 * A figure the player has to find out must not be in the question.
 *
 * The retention decision offered to "cut the 190 standing readers" to every
 * player, and 190 is what the data holdings review finds. A number that
 * appears in a piece of evidence may only be quoted by a decision whose own
 * opening message reveals that evidence.
 */
describe('decisions do not quote what the player has not found', () => {
  // The inherited register is handed over on the first morning; its size is
  // on the page, not waiting to be found.
  const KNOWN_FROM_THE_START: Record<string, string[]> = { 'dec-first-week-focus': ['23'] }

  it('quotes an evidence figure only when the message that opens it reveals it', () => {
    const content = parseCampaignContent(nexoraContentRaw)
    const figures = (text: string) => text.match(/\b\d{2,}\b/g) ?? []
    const foundIn = new Map<string, string[]>()
    for (const evidence of content.evidence) {
      for (const figure of figures(`${evidence.title} ${evidence.description}`)) {
        foundIn.set(figure, [...(foundIn.get(figure) ?? []), evidence.id])
      }
    }
    const leaks: string[] = []
    for (const decision of content.decisions) {
      const revealed = new Set(
        content.events
          .filter((event) => event.decisionId === decision.id)
          .flatMap((event) => event.effectsOnReveal ?? [])
          .flatMap((effect) => (effect.type === 'evidence.reveal' ? [effect.evidenceId] : [])),
      )
      const texts = [decision.description, decision.context ?? '', ...decision.options.flatMap((o) => [o.label, o.description, ...o.visibleKnownEffects])]
      for (const figure of texts.flatMap(figures)) {
        const sources = foundIn.get(figure)
        if (!sources || sources.some((id) => revealed.has(id))) continue
        if (KNOWN_FROM_THE_START[decision.id]?.includes(figure)) continue
        leaks.push(`${decision.id} quotes ${figure}, found by ${sources.join(', ')}`)
      }
    }
    expect(leaks).toEqual([])
  })
})

/**
 * A programme's blocker must not be a decision the year asks anyway. The
 * identity programme's blocker was "three executives have asked to be
 * exempted", cleared by holding the line with the CIO; on day 90 the spine
 * asked the same question as if it had never been answered, in 43 of 100
 * years that started identity early, and offered to grant the exemptions.
 */
describe('blockers do not retell a decision', () => {
  it('leaves executive exemptions to the decision about them', () => {
    const content = parseCampaignContent(nexoraContentRaw)
    expect(content.decisions.some((decision) => decision.id === 'dec-exception-request')).toBe(true)
    for (const programme of content.programmes) {
      for (const blocker of programme.blockers) {
        expect(`${blocker.name} ${blocker.description}`, blocker.id).not.toMatch(/exempt|exception/i)
      }
    }
  })
})
