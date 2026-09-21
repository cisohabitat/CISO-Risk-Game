/**
 * The subject's words in a piece of text, as chips that open the glossary
 * at the entry. The glossary was judged "comprehensive and unusually good,
 * long, passive and not surfaced at the point of confusion" by the opening
 * playtest's newcomer. This is the point of confusion.
 */
import { useGameStore } from '@/store/game-store'

export function Terms({ text, className }: { text: string; className?: string }) {
  const index = useGameStore((store) => store.index)
  const openGlossary = useGameStore((store) => store.openGlossary)
  const lower = text.toLowerCase()
  const hits = index.content.glossary.filter((entry) => {
    if (entry.section !== 'subject') return false
    return entry.term
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .some((t) => t.length > 2 && new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(lower))
  })
  if (hits.length === 0) return null
  return (
    <p className={className}>
      <span className="text-xs text-ink-faint">Words: </span>
      {hits.slice(0, 5).map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => openGlossary(entry.id)}
          className="compact mr-1 rounded-full border border-line px-2 py-0.5 text-xs text-ink-muted hover:text-ink"
        >
          {entry.term.split(',')[0]}
        </button>
      ))}
    </p>
  )
}
