/**
 * "You may have found a pattern."
 *
 * The evidence the player is holding sometimes adds up to a proposition worth
 * testing, and the game can see that as well as they can. It says so, names
 * what made it think that, and stops there: forming the hypothesis costs
 * attention, dismissing it is a real answer, and neither is done for them.
 */
import { Button, Card, CardBody } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { patternSuggestions } from '@/store/selectors'

export function PatternNotice({ limit = 1 }: { limit?: number }) {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const dispatch = useGameStore((store) => store.dispatch)
  if (!state) return null

  const suggestions = patternSuggestions(state, index).slice(0, limit)
  if (suggestions.length === 0) return null

  return (
    <ul className="space-y-3">
      {suggestions.map((suggestion) => (
        <li key={suggestion.templateId}>
          <Card className="border-accent/40 bg-accent-soft/25">
            <CardBody className="space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  You may have found a pattern
                </p>
                <p className="mt-1.5 font-medium text-balance">{suggestion.title}</p>
                <p className="mt-1 text-sm text-ink-muted text-pretty">{suggestion.statement}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">What suggests it</p>
                <ul className="mt-1.5 space-y-1 text-sm text-ink-muted">
                  {suggestion.evidence.map((item) => (
                    <li key={item.id} className="text-pretty">{item.title}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
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
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  )
}
