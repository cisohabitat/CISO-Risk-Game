/**
 * The subject's words in a piece of text, as chips that open the glossary
 * at the entry. The glossary was judged "comprehensive and unusually good,
 * long, passive and not surfaced at the point of confusion" by the opening
 * playtest's newcomer. This is the point of confusion.
 */
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { cn } from '@/lib/utils/cn'

export function Terms({ text, className }: { text: string; className?: string }) {
  const index = useCampaignIndex()
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
  // Quiet links rather than bordered pills: on a list of risk cards every card
  // carried a row of outlined chips, and they read as more badges competing
  // with the residual and confidence badges above them.
  return (
    <p className={cn('text-xs text-ink-faint', className)}>
      <span>Words: </span>
      {hits.slice(0, 5).map((entry, position) => (
        <span key={entry.id}>
          {position > 0 && <span aria-hidden="true"> · </span>}
          <button
            type="button"
            onClick={() => openGlossary(entry.id)}
            className="compact text-ink-muted underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            {entry.term.split(',')[0]}
          </button>
        </span>
      ))}
    </p>
  )
}
