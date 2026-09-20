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
        }
      }
    }
  })
})
