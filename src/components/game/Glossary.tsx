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
      description="What this game means by the words it uses."
    >
      <dl className="space-y-4">
        {index.content.glossary.map((entry) => (
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
    </Dialog>
  )
}
