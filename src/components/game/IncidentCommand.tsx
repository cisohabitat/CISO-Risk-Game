/**
 * Command view for a live incident.
 *
 * The simulation always modelled incidents well; the interface treated one as a
 * status line on the Home screen, so the organisation could be in crisis while
 * the game still looked like ordinary management. This sits above every screen
 * while an incident runs and shows the three things a CISO actually needs: what
 * is known so far, what has already been decided, and what is waiting on them.
 *
 * Everything shown comes from what the player has been told. The attack path is
 * hidden truth and does not appear here.
 */
import { Badge, Button, Card, CardBody } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { incidentCommand } from '@/store/selectors'
import { plural } from '@/lib/formatting/labels'

export function IncidentCommand() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const setUi = useGameStore((store) => store.setUi)
  const setScreen = useGameStore((store) => store.setScreen)
  if (!state) return null

  const incident = incidentCommand(state, index)
  if (!incident) return null

  return (
    <Card
      className="mb-4 border-band-severe/60 bg-band-severe-soft/30"
      // Announced once when it appears, then left alone: a live region that
      // re-reads on every tick would talk over the player all day.
      role="region"
      aria-labelledby="incident-command"
    >
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge tone="severe">Incident active</Badge>
            <h2 id="incident-command" className="mt-2 text-lg font-semibold text-balance">
              {incident.name}
            </h2>
            <p className="mt-1 text-sm text-ink-muted text-pretty">
              {incident.phaseLabel} · day {incident.daysRunning} of the response
              {incident.detectedDay === undefined && ' · not yet confirmed detected'}
              {incident.servicesAffected.length > 0 && ` · ${incident.servicesAffected.join(', ')}`}
            </p>
          </div>
          {incident.awaiting.length === 0 && (
            <Button variant="secondary" size="sm" onClick={() => setScreen('inbox')}>
              Open the response log
            </Button>
          )}
        </div>

        {incident.timeline.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">What you have been told</p>
            <ol className="mt-1.5 space-y-1 text-sm">
              {incident.timeline.slice(-5).map((entry, position) => (
                <li key={`${entry.day}-${position}`} className="flex gap-2 text-pretty">
                  <span className="shrink-0 tabular-nums text-ink-faint">Day {entry.day}</span>
                  <span className="text-ink-muted">{entry.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {incident.taken.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              What you have already decided
            </p>
            <ul className="mt-1.5 space-y-1 text-sm">
              {incident.taken.map((entry, position) => (
                <li key={`${entry.day}-${position}`} className="flex gap-2 text-pretty">
                  <span className="shrink-0 tabular-nums text-ink-faint">Day {entry.day}</span>
                  <span className="text-ink-muted">
                    {entry.title}: <span className="text-ink">{entry.option}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {incident.awaiting.length > 0 && (
          <div className="rounded-lg border border-band-severe/50 bg-surface p-3">
            <p className="text-sm font-medium">
              {plural(incident.awaiting.length, 'decision', 'decisions')} waiting on you
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {incident.awaiting.map((item) => (
                <li key={item.decisionId}>
                  <Button variant="primary" size="sm" onClick={() => setUi({ openDecisionId: item.decisionId })}>
                    {item.title}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
