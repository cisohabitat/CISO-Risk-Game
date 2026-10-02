/**
 * "You may have found a pattern."
 *
 * The evidence the player is holding sometimes adds up to a proposition worth
 * testing, and the game can see that as well as they can. It says so, names
 * what made it think that, and stops there: forming the hypothesis costs
 * attention, dismissing it is a real answer, and neither is done for them.
 */
import { Button } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { patternSuggestions } from '@/store/selectors'

export function PatternNotice({ limit = 1 }: { limit?: number }) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  if (!state) return null

  const suggestions = patternSuggestions(state, index).slice(0, limit)
  if (suggestions.length === 0) return null

  // Forming one costs a unit of attention. The Investigations panel disables an
  // action the player cannot afford and says why in place; this card, the most
  // prominent action on the Briefing, left the button live and only refused
  // after the click, with the toast as the first hint that "0 of 5 left" in
  // the panel beside it had anything to do with it.
  const noAttention = state.resources.focusRemaining < 1

  return (
    <ul className="space-y-3">
      {suggestions.map((suggestion) => (
        <li key={suggestion.templateId}>
          {/* Not another card.
              This is the most interesting moment the game has — the one where
              something clicks — and it was arriving in the same bordered box as
              everything else on the screen. It reads as an analyst's inference
              now: ruled off top and bottom, the proposition set in the display
              face, and the evidence listed underneath as what led there. */}
          <div className="border-y-2 border-accent/60 bg-accent-soft/20 px-4 py-4 sm:px-5">
            <div className="space-y-3">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent-ink">
                  Pattern emerging
                </p>
                <p className="mt-2 font-display text-lg leading-snug text-balance">{suggestion.title}</p>
                <p className="mt-1.5 text-sm text-ink-muted text-pretty">{suggestion.statement}</p>
              </div>

              <div className="border-t border-accent/25 pt-3">
                <p className="text-xs font-medium text-ink-faint">What led here</p>
                <ul className="mt-1.5 space-y-1 text-sm text-ink-muted">
                  {suggestion.evidence.map((item) => (
                    <li key={item.id} className="flex gap-2 text-pretty">
                      <span aria-hidden="true" className="text-ink-faint">—</span>
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {noAttention && (
                <p className="text-xs text-band-elevated">No attention left this week.</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={noAttention}
                  onClick={() =>
                    dispatch({
                      type: 'createHypothesis',
                      templateId: suggestion.templateId,
                      evidenceIds: suggestion.evidence.map((item) => item.id),
                    })
                  }
                >
                  Form the hypothesis
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() => dispatch({ type: 'dismissPattern', templateId: suggestion.templateId })}
                >
                  Not this
                </Button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
