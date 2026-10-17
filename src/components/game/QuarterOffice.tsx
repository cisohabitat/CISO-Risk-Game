import { OfficeScene } from './OfficeScene'

const QUARTERS = ['The year opens', 'The second quarter', 'The third quarter', 'The final quarter'] as const

export function QuarterOffice({ quarter, year }: { quarter: number; year: number }) {
  const at = Math.min(4, Math.max(1, quarter))
  return <aside className="quarter-office" aria-label="Your office through the year">
    <OfficeScene quarter={at} />
    <div className="min-w-0 px-4 py-3">
      <p className="document-kicker">Office of the CISO · Year {year} · Q{at}</p>
      <p className="mt-1 font-display text-xl">{QUARTERS[at - 1]}</p>
      <p className="mt-1 text-xs text-ink-muted">Your year at Nexora</p>
    </div>
  </aside>
}
