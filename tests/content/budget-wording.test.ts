import { expect, it } from 'vitest'
import { nexoraContent } from '@/content/nexora'

// 4653160 → 16fe0ee playtest (M-01): an option that charged £110k this year
// said "this year's budget is unchanged". An option that takes money now must
// not say this year is untouched.
it('never says this year is unchanged on an option that charges this year', () => {
  for (const decision of nexoraContent.decisions) {
    for (const option of decision.options) {
      const charges = option.immediateEffects.some((effect) => effect.type === 'budget.change' && effect.amount < 0)
      const saysUnchanged = (option.visibleKnownEffects ?? []).some((line) => /this year.s budget is unchanged/i.test(line))
      expect(charges && saysUnchanged, `${decision.id}/${option.id}`).toBe(false)
    }
  }
})
