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
import { Button, Card, CardBody } from '@/components/ui/primitives'
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
      // Sticky while the incident runs. It sat at the top of a scrolling page,
      // so a player who had scrolled down had nothing but a pill in the header
      // telling them the organisation was in crisis — which is the opposite of
      // what "normal management has stopped" should feel like.
      // Loud on purpose. At a third opacity it read quieter than the teaching
      // note sitting under it, which is the wrong way round when the
      // organisation is in crisis: a full-strength band, a heavier border and a
      // rule down the left so it is the first thing the eye lands on.
      // A solid bar rather than a tint. The severe "soft" token is nearly white
      // in light mode, so a tinted card read quieter than the teaching note
      // under it — the wrong way round when the organisation is in crisis.
      className="mb-4 overflow-hidden border-band-severe/60 shadow-[var(--shadow-lift)]"
      // Announced once when it appears, then left alone: a live region that
      // re-reads on every tick would talk over the player all day.
      role="region"
      aria-labelledby="incident-command"
    >
      {/* The band stays pinned while the panel scrolls with the page. The
          whole panel was sticky, and twice a player mid-incident found it
          covering the Decide control they were trying to reach. */}
      <p className="sticky top-0 z-10 bg-[var(--band-severe)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--surface)]">
        Incident active · {incident.name} · {incident.phaseLabel}
      </p>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="incident-command" className="text-lg font-semibold text-balance">
              {incident.name}
            </h2>
            <p className="mt-1 text-sm text-ink-muted text-pretty">
              {incident.phaseLabel} ·{' '}
              {incident.daysRunning === 0 ? 'today' : `day ${incident.daysRunning + 1} of the response`}
              {incident.detectedDay === undefined && ' · not yet confirmed detected'}
            </p>
          </div>
          {incident.awaiting.length === 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // Land on the incident, not on whatever was selected last time.
                const latest = state.inbox.messages.find((m) => m.type === 'incident')
                setUi({ selectedMessageId: latest?.id })
                setScreen('inbox')
              }}
            >
              Open the response log
            </Button>
          )}
        </div>

        {/*
          The operational state, in words. Containment is a 0..1 number
          internally and never appears as one: the player is told where the
          response has got to, not given a percentage to optimise.
        */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-ink-muted">
            <span className="text-ink-faint">Containment:</span> {incident.containmentLabel}
          </span>
          <span className="text-ink-muted">
            <span className="text-ink-faint">Recovery:</span> {incident.recoveryLabel}
          </span>
          {incident.servicesAffected.length > 0 && (
            <span className="text-ink-muted">
              <span className="text-ink-faint">Services:</span> {incident.servicesAffected.join(', ')}
            </span>
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
