import { useState } from 'react'
import { Badge, Button, Card, CardBody, EmptyState } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { incidentCommand, openDecisions } from '@/store/selectors'

export function DecisionList({
  limit,
  quiet = false,
  elsewhere = false,
  emphasizeFirst = false,
}: {
  limit?: number
  quiet?: boolean
  /** Other things want the player further down the page. */
  elsewhere?: boolean
  /** The Briefing gives the earliest-due decision visual priority. */
  emphasizeFirst?: boolean
}) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const setUi = useGameStore((store) => store.setUi)
  const [expanded, setExpanded] = useState(false)
  if (!state) return null

  const decisions = openDecisions(state, index)
  const shown = limit && !expanded ? decisions.slice(0, limit) : decisions

  if (shown.length === 0) {
    // Beside a board paper that is due, "nothing needs an answer" is untrue.
    const activeIncident = !state.finished && incidentCommand(state, index)
    if (quiet && !activeIncident) return null
    return (
      <EmptyState
        title={activeIncident ? 'No response decision is open yet' : 'No decision is open'}
        description={
          // "Nothing needs an answer" sat under "5 things need your
          // attention", counting patterns and collisions further down.
          state.finished
            ? 'The year is over. Revisit your messages or read the annual review in Your year.'
            : activeIncident
              ? 'An incident is active. Review the response journal and latest update while the response continues.'
            : elsewhere
            ? 'Nothing needs an answer today. What else wants you is further down this page.'
            : 'Nothing needs an answer from you right now. Advance time, or go and find out something you do not yet know.'
        }
        action={state.finished ? <Button variant="secondary" size="sm" onClick={() => useGameStore.getState().setScreen('debrief')}>Open Your year</Button> : activeIncident ? <Button variant="secondary" size="sm" onClick={() => {
          const journal = document.getElementById('incident-command')
          journal?.focus({ preventScroll: true })
          journal?.scrollIntoView({ block: 'start' })
        }}>Review the active incident</Button> : undefined}
      />
    )
  }

  return (
    <div className="space-y-3"><ul className="space-y-3">
      {shown.map((decision, position) => (
        <li key={decision.id} className="animate-rise">
          <Card className={emphasizeFirst && position === 0 ? `decision-lead ${decision.urgent ? 'decision-lead-urgent' : ''}` : decision.urgent ? 'border-band-high/50' : undefined}>
            <CardBody className={emphasizeFirst && position === 0 ? 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between' : 'flex flex-wrap items-start justify-between gap-3'}>
              <div className="min-w-0 flex-1">
                {emphasizeFirst && position === 0 && <p className="document-kicker mb-2">Next decision</p>}
                {decision.responseContext && <p className="mb-2 text-sm text-ink-muted">{decision.responseContext}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={emphasizeFirst && position === 0 ? 'font-display text-2xl leading-tight text-balance' : 'font-medium text-balance'}>{decision.title}</h3>
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
                variant={emphasizeFirst && position > 0 ? 'secondary' : 'primary'}
                size="sm"
                className={emphasizeFirst && position === 0 ? 'w-full shrink-0 sm:w-auto' : undefined}
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
    {limit && !expanded && decisions.length > limit && <Button variant="secondary" size="sm" onClick={() => setExpanded(true)}>Show {decisions.length - limit} more {decisions.length - limit === 1 ? 'decision' : 'decisions'}</Button>}
    </div>
  )
}
