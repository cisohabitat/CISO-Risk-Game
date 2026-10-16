import atlas from '@/assets/art/nexora-incidents.webp'
import { cn } from '@/lib/utils/cn'

/** Decorative atmosphere selected only from the incident's already-visible name and phase. */
export function IncidentIllustration({ name, phase = '', className }: { name: string; phase?: string; className?: string }) {
  const current = phase.toLowerCase()
  const cell = /recover|debrief|closed/.test(current) ? 3 : /contain/.test(current) ? 2 : /data|information|exposure/i.test(name) ? 1 : 0
  return (
    <div aria-hidden="true" className={cn('incident-art', className)}>
      <img
        src={atlas}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute max-w-none"
        style={{ width: '200%', height: '200%', left: `${-(cell % 2) * 100}%`, top: `${-Math.floor(cell / 2) * 100}%` }}
        onError={(event) => { event.currentTarget.hidden = true }}
      />
    </div>
  )
}
