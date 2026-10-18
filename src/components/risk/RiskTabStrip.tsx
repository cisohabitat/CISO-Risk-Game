import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TabList } from '@/components/ui/primitives'

/** Describe only the tabs actually hidden beyond either edge. */
export function RiskTabStrip({ children }: { children: ReactNode }) {
  const strip = useRef<HTMLDivElement>(null)
  const [cue, setCue] = useState('')
  useEffect(() => {
    const element = strip.current
    if (!element) return
    const measure = () => {
      const before = element.scrollLeft > 1
      const after = element.scrollWidth - element.clientWidth - element.scrollLeft > 1
      setCue(before && after ? '← More tabs →' : before ? '← More tabs' : after ? 'More tabs →' : '')
    }
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    observer?.observe(element)
    element.querySelectorAll('[role="tab"]').forEach((tab) => observer?.observe(tab))
    element.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    measure()
    return () => { observer?.disconnect(); element.removeEventListener('scroll', measure); window.removeEventListener('resize', measure) }
  }, [])
  return <>
    <TabList ref={strip} label="Risk workspace" className="risk-tabs">{children}</TabList>
    <p className="risk-tab-cue mt-1 min-h-4 text-right text-xs text-ink-faint md:hidden" aria-hidden="true">{cue}</p>
  </>
}
