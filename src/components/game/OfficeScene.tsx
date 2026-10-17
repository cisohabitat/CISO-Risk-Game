import officeAtlas from '@/assets/art/nexora-office.webp'
import { cn } from '@/lib/utils/cn'

/** Atmosphere follows only the public calendar, never risk or performance. */
export function OfficeScene({ quarter = 1, closing = false, className }: { quarter?: number; closing?: boolean; className?: string }) {
  return <div aria-hidden="true" className={cn('office-scene', closing && 'office-closing', className)} data-quarter={Math.min(4, Math.max(1, quarter))}>
    <img src={officeAtlas} alt="" loading="lazy" decoding="async" className="office-atlas" style={{ left: closing ? '-100%' : 0 }} onError={(event) => { event.currentTarget.hidden = true }} />
  </div>
}
