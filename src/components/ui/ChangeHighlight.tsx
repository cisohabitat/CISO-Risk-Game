import type { ReactNode } from 'react'
import { useChangeHighlight } from './useChangeHighlight'

export function ChangeHighlight({ value, children }: { value: string | number; children: ReactNode }) {
  const ref = useChangeHighlight<HTMLSpanElement>(value)
  return <span ref={ref} className="change-highlight">{children}</span>
}
