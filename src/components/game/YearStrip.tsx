/**
 * The year at a glance, under the navigation on a desktop. The rail had a
 * tall empty middle, and nothing on any screen showed how far through the
 * year the player was or how close the next board paper stood: "Week 18 ·
 * Q2" says where you are, not how much is left. Four quarters, filled to
 * today, and the days until this one closes.
 */
import { CAMPAIGN_DAYS, DAYS_PER_QUARTER } from '@/game/types'
import { plural } from '@/lib/formatting/labels'

const QUARTERS = [1, 2, 3, 4] as const

export function YearStrip({ day }: { day: number }) {
  const today = Math.min(Math.max(0, day), CAMPAIGN_DAYS)
  const quarter = Math.min(4, Math.floor(today / DAYS_PER_QUARTER) + 1)
  const closesIn = Math.max(0, quarter * DAYS_PER_QUARTER - today)
  const over = today >= CAMPAIGN_DAYS

  return (
    <section aria-label="The year" className="px-5 py-4" data-testid="year-strip">
      <p className="text-xs text-ink-faint">The year</p>
      <div aria-hidden="true" className="mt-2 grid grid-cols-4 gap-1">
        {QUARTERS.map((q) => {
          const start = (q - 1) * DAYS_PER_QUARTER
          const filled = Math.min(1, Math.max(0, (today - start) / DAYS_PER_QUARTER))
          return (
            <div key={q}>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={`h-full transition-[width] duration-700 ease-out ${q === quarter && !over ? 'bg-accent' : 'bg-line-strong'}`}
                  style={{ width: `${filled * 100}%` }}
                />
              </div>
              <p className={q === quarter && !over ? 'mt-1 text-[0.7rem] font-medium text-ink' : 'mt-1 text-[0.7rem] text-ink-faint'}>
                Q{q}
              </p>
            </div>
          )
        })}
      </div>
      <p className="mt-1 text-xs text-ink-muted" data-testid="year-strip-text">
        {over
          ? 'The year is over.'
          : closesIn === 0
            ? `Q${quarter} closes today.`
            : `Q${quarter} closes in ${plural(closesIn, 'day')}.`}
      </p>
    </section>
  )
}
