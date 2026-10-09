import { Badge, Button, Card, CardBody, EmptyState } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { openDecisions } from '@/store/selectors'

export function DecisionList({
  limit,
  quiet = false,
  elsewhere = false,
}: {
  limit?: number
  quiet?: boolean
  /** Other things want the player further down the page. */
  elsewhere?: boolean
}) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const setUi = useGameStore((store) => store.setUi)
  if (!state) return null

  const decisions = openDecisions(state, index)
  const shown = limit ? decisions.slice(0, limit) : decisions

  if (shown.length === 0) {
    // Beside a board paper that is due, "nothing needs an answer" is untrue.
    if (quiet) return null
    return (
      <EmptyState
        title="No decision is open"
        description={
          // "Nothing needs an answer" sat under "5 things need your
          // attention", counting patterns and collisions further down.
          elsewhere
            ? 'Nothing needs an answer today. What else wants you is further down this page.'
            : 'Nothing needs an answer from you right now. Advance time, or go and find out something you do not yet know.'
        }
      />
    )
  }

  return (
    <ul className="space-y-3">
      {shown.map((decision) => (
        <li key={decision.id} className="animate-rise">
          <Card className={decision.urgent ? 'border-band-high/50' : undefined}>
            <CardBody className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-balance">{decision.title}</h3>
                  {decision.daysRemaining !== undefined && (
                    <Badge tone={decision.urgent ? 'high' : 'neutral'} glyph={false}>
                      {decision.daysRemaining <= 0
                        ? 'Due today'
                        : `Due in ${decision.daysRemaining} day${decision.daysRemaining === 1 ? '' : 's'}`}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-muted text-pretty">{decision.description}</p>
              </div>
              {/* Named for its decision: a list read button by button was
                  "Decide, Decide, Decide". */}
              <Button
                variant="primary"
                size="sm"
                aria-label={`Decide: ${decision.title}`}
                onClick={() => setUi({ openDecisionId: decision.id })}
              >
                Decide
              </Button>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  )
}
