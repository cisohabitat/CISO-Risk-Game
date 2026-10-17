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
import { Button, Card, CardBody, Disclosure } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { incidentCommand } from '@/store/selectors'
import { plural, shortDate } from '@/lib/formatting/labels'
import { IncidentIllustration } from './IncidentIllustration'

export function IncidentCommand() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const setUi = useGameStore((store) => store.setUi)
  const setScreen = useGameStore((store) => store.setScreen)
  // Once the year is over nothing can be decided, and the panel sat above the
  // annual review offering a response log. The review says the incident was
  // still running when the year was written up.
  if (!state || state.finished) return null

  const incident = incidentCommand(state, index)
  if (!incident) return null

  return (
    <Card
      // Keyed by the incident, so a new one arrives rather than appearing.
      key={incident.id}
      className="animate-arrive mb-4 overflow-hidden border-band-severe/60 shadow-[var(--shadow-lift)]"
      // Announced once when it appears, then left alone: a live region that
      // re-reads on every tick would talk over the player all day.
      role="region"
      aria-labelledby="incident-command"
    >
      {/* The band stays pinned while the panel scrolls with the page. The
          whole panel was sticky, and twice a player mid-incident found it
          covering the Decide control they were trying to reach. */}
      <p className="sticky top-0 z-10 bg-alarm px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-on-alarm">
        Incident active · {incident.name} · {incident.phaseLabel}
      </p>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="document-kicker mb-2">Response journal</p>
            <h2 id="incident-command" tabIndex={-1} className="scroll-mt-36 font-display text-xl leading-tight text-balance">
              {incident.name}
            </h2>
            <p className="mt-1 text-sm text-ink-muted text-pretty">
              {incident.phaseLabel} ·{' '}
              {incident.daysRunning === 0 ? 'today' : `day ${incident.daysRunning + 1} of the response`}
              {incident.detectedDay === undefined && ' · not yet confirmed detected'}
            </p>
          </div>
          <IncidentIllustration name={incident.name} phase={incident.phaseLabel} className="w-24 shrink-0 sm:w-40" />
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
              Read the latest incident message
            </Button>
          )}
        </div>

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

        {/*
          The operational state, in words. Containment is a 0..1 number
          internally and never appears as one: the player is told where the
          response has got to, not given a percentage to optimise.
        */}
        <div className="grid gap-3 border-y border-line py-3 text-sm sm:grid-cols-3">
          <span className="text-ink-muted">
            <span className="mb-1 block text-xs text-ink-faint">Containment:</span> {incident.containmentLabel}
          </span>
          <span className="text-ink-muted">
            <span className="mb-1 block text-xs text-ink-faint">Recovery:</span> {incident.recoveryLabel}
          </span>
          {incident.servicesAffected.length > 0 && (
            <span className="text-ink-muted">
              <span className="mb-1 block text-xs text-ink-faint">Services:</span> {incident.servicesAffected.join(', ')}
            </span>
          )}
        </div>

        {incident.timeline.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink-faint">What you have been told</p>
            <ol className="response-timeline mt-3 text-sm">
              {incident.timeline.slice(-1).map((entry, position) => (
                <li key={`${entry.day}-${position}`} className="flex gap-3 text-pretty">
                  <span className="shrink-0 tabular-nums text-ink-faint">{shortDate(entry.day)}</span>
                  <span className="text-ink-muted">{entry.text}</span>
                </li>
              ))}
            </ol>
            {incident.timeline.length > 1 && <div className="mt-3"><Disclosure summary={`Earlier updates (${incident.timeline.length - 1})`}>
              <ol className="response-timeline space-y-3">
                {incident.timeline.slice(0, -1).map((entry, position) => <li key={`${entry.day}-${position}`} className="flex gap-3 text-pretty">
                  <span className="shrink-0 tabular-nums text-ink-faint">{shortDate(entry.day)}</span>
                  <span>{entry.text}</span>
                </li>)}
              </ol>
            </Disclosure></div>}
          </div>
        )}

        {incident.taken.length > 0 && (
          <Disclosure summary={`What you have already decided (${incident.taken.length})`}>
            <ul className="mt-1.5 space-y-1 text-sm">
              {incident.taken.map((entry, position) => (
                <li key={`${entry.day}-${position}`} className="flex gap-2 text-pretty">
                  <span className="shrink-0 tabular-nums text-ink-faint">{shortDate(entry.day)}</span>
                  <span className="text-ink-muted">
                    {entry.title}: <span className="text-ink">{entry.option}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}

      </CardBody>
    </Card>
  )
}
