import { Badge, Button, Card, CardBody, EmptyState } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { openDecisions } from '@/store/selectors'

export function DecisionList({ limit }: { limit?: number }) {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const setUi = useGameStore((store) => store.setUi)
  if (!state) return null

  const decisions = openDecisions(state, index)
  const shown = limit ? decisions.slice(0, limit) : decisions

  if (shown.length === 0) {
    return (
      <EmptyState
        title="No decision is open"
        description="Nothing needs an answer from you right now. Advance time, or go and find out something you do not yet know."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {shown.map((decision) => (
        <li key={decision.id}>
          <Card className={decision.urgent ? 'border-band-high/50' : undefined}>
            <CardBody className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-balance">{decision.title}</h3>
                  {decision.daysRemaining !== undefined && (
                    <Badge tone={decision.urgent ? 'high' : 'neutral'} glyph={false}>
                      {decision.daysRemaining <= 0 ? 'Due today' : `${decision.daysRemaining}d`}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-muted text-pretty">{decision.description}</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setUi({ openDecisionId: decision.id })}>
                Decide
              </Button>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  )
}
