/**
 * Glossary, reachable from every screen (plan §45). Teaching happens in place;
 * this is the reference for anyone who wants it.
 */
import { useEffect, useRef } from 'react'
import { Dialog } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'

export function Glossary() {
  const open = useGameStore((store) => store.ui.glossaryOpen)
  const term = useGameStore((store) => store.ui.glossaryTerm)
  const setUi = useGameStore((store) => store.setUi)
  const index = useGameStore((store) => store.index)
  const guided = useGameStore((store) => store.state?.difficulty === 'guided')
  const target = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && term) target.current?.scrollIntoView({ block: 'center' })
  }, [open, term])

  return (
    <Dialog
      open={open}
      onClose={() => setUi({ glossaryOpen: false, glossaryTerm: undefined })}
      size="lg"
      title="Glossary"
      description="What this game means by the words it uses, and what the field means by the ones it borrows."
    >
      {(
        [
          ['game', 'How this game uses its words'],
          ['subject', "The subject's words"],
        ] as const
      ).map(([section, heading]) => {
        const entries = index.content.glossary.filter((entry) => (entry.section ?? 'game') === section)
        if (entries.length === 0) return null
        return (
          <section key={section} aria-labelledby={`glossary-${section}`} className="mb-6 last:mb-0">
            <h3 id={`glossary-${section}`} className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              {heading}
            </h3>
            <dl className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  ref={entry.id === term ? target : undefined}
                  className={entry.id === term ? 'rounded-lg border border-accent bg-accent-soft/30 p-3' : undefined}
                >
                  <dt className="font-medium">{entry.term}</dt>
                  <dd className="mt-0.5 text-sm text-ink-muted text-pretty">{entry.definition}</dd>
                  {guided && entry.guidedNote && (
                    <dd className="mt-1 text-sm text-accent-ink text-pretty">{entry.guidedNote}</dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </Dialog>
  )
}
