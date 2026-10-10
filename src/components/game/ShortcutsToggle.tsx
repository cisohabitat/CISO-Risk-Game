/** Single-key shortcuts, on by default and switchable off (WCAG 2.1.4). */
import { useId } from 'react'
import { Button } from '@/components/ui/primitives'
import { setShortcuts, useShortcuts } from '@/lib/settings/shortcuts'

export function ShortcutsToggle({ className }: { className?: string }) {
  const on = useShortcuts()
  const described = useId()
  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        block
        className={className}
        aria-pressed={on}
        aria-describedby={described}
        onClick={() => setShortcuts(!on)}
        data-testid="shortcuts-toggle"
      >
        {on ? 'Shortcut keys on' : 'Shortcut keys off'}
      </Button>
      <span id={described} className="sr-only">
        Space pauses or runs the clock, the right arrow skips ahead, H, I, R, O, P, T, B and Y change screen, and G opens the glossary.
      </span>
    </>
  )
}
