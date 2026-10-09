/**
 * The annual CISO review (plan §26). Dimensions are assessed independently and
 * the output is narrative: the optional performance band never replaces it.
 * Incident reconstructions live here too, alongside the decisions that shaped them.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, SectionHeading } from '@/components/ui/primitives'
import { sendYear, shareYear, type SharedYear } from '@/lib/share-year'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { incidentViews, yearTimeline } from '@/store/selectors'
import { exportSave } from '@/store/persistence'
import { CAMPAIGN_DAYS } from '@/game/types'
import { objectiveStatusLabel } from '@/game/business/objectives'
import { shortDate, statusLabel } from '@/lib/formatting/labels'
import { YearTimeline } from '@/components/debrief/YearTimeline'

// A scale from bad to good, warm to cool. "Solid" borrowed the risk palette's
// moderate, which is blue there and read here as a neutral label sitting
// between amber "developing" and green "strong" rather than a step on the way.
const BAND_TONE: Record<string, 'severe' | 'elevated' | 'low' | 'positive'> = {
  weak: 'severe',
  developing: 'elevated',
  solid: 'low',
  strong: 'positive',
}

export function DebriefScreen() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const finishCampaign = useGameStore((store) => store.finishCampaign)
  const leaveCampaign = useGameStore((store) => store.leaveCampaign)
  const pushToast = useGameStore((store) => store.pushToast)
  const [sharing, setSharing] = useState<SharedYear>()
  const incidents = useMemo(() => (state ? incidentViews(state, index) : []), [state, index])
  const timeline = useMemo(() => (state ? yearTimeline(state, index) : []), [state, index])

  if (!state) return null
  const review = state.reviews.annual

  const download = () => {
    const blob = new Blob([exportSave(state, index.content.meta.title)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ciso-first-year-${state.seed}-day${state.currentDay}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  // Mid-campaign the review does not exist yet, but the year does. Showing the
  // timeline here is the point of it: a player can see the shape of what they
  // have done while there is still time to change it, rather than meeting it
  // for the first time on 31 December when nothing can be done about it.
  if (!review) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.24em] text-ink-faint">The year so far</p>
          <h1 className="mt-1 font-display text-3xl leading-tight text-balance">Your year, day by day</h1>
          <p className="mt-2 text-ink-muted">Day {state.currentDay} of {CAMPAIGN_DAYS} · seed {state.seed}</p>
        </header>

        <Card>
          <CardBody>
            <YearTimeline lanes={timeline} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-pretty">
              The annual review is written on the last day. You can close the year out early if you would rather read it now.
            </p>
            <Button variant="primary" onClick={finishCampaign}>
              Write up the year now
            </Button>
          </CardBody>
        </Card>

        {/* Export was only offered once the year was over, so a campaign
            deleted or lost with the browser's data mid-year could not be kept
            anywhere. A copy can be taken at any point (docs/ROADMAP.md,
            Phase 5); importing it resumes the year from here. */}
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1 text-sm text-ink-muted text-pretty">
              Keep a copy of this campaign as a file, to bring back on another device or after clearing this browser.
            </p>
            <Button variant="secondary" onClick={download}>
              Export this campaign
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* The payoff for a whole year should not look like another screen. It
          is set as the report it is: a masthead, a rule, and the verdict in
          the display face with room around it. */}
      <header className="border-y-2 border-ink py-6 text-center sm:py-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ink-faint">
          {index.content.meta.organisation} · Annual review
          {state.situationId && index.situation.get(state.situationId) && ` · ${index.situation.get(state.situationId)!.name}`}
        </p>
        <h1 className="mx-auto mt-4 max-w-[26ch] font-display text-3xl leading-tight text-balance sm:text-4xl">
          {review.headline}
        </h1>
        <p className="mt-4 text-sm uppercase tracking-[0.18em] text-ink-muted">{review.performanceBand}</p>
        <p className="mt-1 text-xs text-ink-faint">Seed {state.seed}</p>
      </header>

      {/* The review is the document a player might take to their own board;
          it prints as one, without the game around it. */}
      <div className="flex flex-wrap justify-end gap-2" data-print="hide">
        <Button
          variant="quiet"
          size="sm"
          onClick={() => {
            const shared = shareYear(
              review,
              {
                organisation: index.content.meta.organisation,
                seed: state.seed,
                mode: state.difficulty,
                situationId: state.situationId,
                situationName: state.situationId ? index.situation.get(state.situationId)?.name : undefined,
              },
              window.location.origin,
            )
            void sendYear(shared).then((outcome) => {
              if (outcome === 'copied') pushToast('Your year is copied, with a link to play the same one.', 'success')
              if (outcome === 'failed') setSharing(shared)
            })
          }}
        >
          Share this year
        </Button>
        <Button variant="quiet" size="sm" onClick={() => window.print()}>
          Print or save as PDF
        </Button>
      </div>
      {/* Where the browser allows neither the share sheet nor the clipboard,
          the text is shown to copy by hand. */}
      <Dialog open={sharing !== undefined} onClose={() => setSharing(undefined)} title="Share this year" description="Copy this and send it.">
        <textarea
          readOnly
          value={sharing?.text ?? ''}
          rows={14}
          aria-label="Your year, to copy"
          className="w-full rounded-lg border border-line bg-surface-2 p-3 font-mono text-sm"
          onFocus={(event) => event.currentTarget.select()}
        />
      </Dialog>

      <Card>
        <CardBody className="space-y-3">
          {review.narrative.map((paragraph, position) => (
            <p key={position} className="text-pretty leading-relaxed">
              {paragraph}
            </p>
          ))}
          <p className="border-t border-line pt-3 text-pretty">{review.businessOutcome}</p>
        </CardBody>
      </Card>

      <section aria-labelledby="the-year">
        <SectionHeading><span id="the-year">Your year, day by day</span></SectionHeading>
        <Card>
          <CardBody>
            <YearTimeline lanes={timeline} />
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="dimensions">
        <SectionHeading><span id="dimensions">How the year is read</span></SectionHeading>
        {/* A strip you read down, not eight boxes competing for the eye. The
            verdict sits in a fixed column so the shape of the year is legible
            before a single sentence is read. */}
        <ul className="divide-y divide-line border-y border-line">
          {review.dimensions.map((dimension) => (
            <li key={dimension.id} className="print-keep">
              <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 py-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                <div className="flex flex-wrap items-center gap-2 sm:block">
                  <h3 className="font-medium leading-tight">{dimension.label}</h3>
                  <span className="sm:mt-1.5 sm:block">
                    <Badge tone={BAND_TONE[dimension.band] ?? 'neutral'} glyph={false}>{dimension.band}</Badge>
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-ink-muted text-pretty">{dimension.narrative}</p>
                  {dimension.evidence.length > 0 && (
                    <ul className="space-y-0.5 text-xs text-ink-faint">
                      {dimension.evidence.slice(0, 6).map((evidence, position) => (
                        <li key={position}>{evidence}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="objectives">
        <SectionHeading><span id="objectives">What the business achieved</span></SectionHeading>
        <Card>
          <CardBody>
            <ul className="space-y-2">
              {index.content.objectives.map((objective) => {
                const runtime = state.business.objectives[objective.id]!
                return (
                  <li key={objective.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{objective.name}</span>
                    <Badge
                      tone={runtime.status === 'achieved' ? 'low' : runtime.status === 'failed' ? 'high' : 'elevated'}
                      glyph={false}
                    >
                      {objectiveStatusLabel(runtime.status)}
                      {runtime.delayDays > 0 && ` · ${runtime.delayDays}d of delay`}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          </CardBody>
        </Card>
      </section>

      {incidents.length > 0 && (
        <section aria-labelledby="incidents">
          <SectionHeading><span id="incidents">Incident reconstruction</span></SectionHeading>
          <ul className="space-y-3">
            {incidents.map((incident) => (
              <li key={incident.id} className="print-keep">
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium">{incident.name}</h3>
                      <Badge tone={incident.severity} >{incident.severity} consequence</Badge>
                    </div>
                    <p className="text-sm text-ink-muted">
                      {shortDate(incident.startedDay)}
                      {incident.resolvedDay !== undefined && ` to ${shortDate(incident.resolvedDay)}`} · {statusLabel(incident.phase)}
                      {incident.servicesAffected.length > 0 && ` · ${incident.servicesAffected.join(', ')}`}
                    </p>

                    {incident.reconstruction && (
                      <>
                        {/* What happened in a line; the route and what helped
                            and hurt follow as steps and columns, so the prose
                            version of them is not repeated above. */}
                        <p className="text-pretty">{incident.headline || incident.reconstruction.narrative}</p>
                        <ol className="space-y-1 text-sm">
                          {incident.reconstruction.pathSummary.map((step, position) => (
                            <li key={step.stepId} className="flex gap-2">
                              <span className="shrink-0 tabular-nums text-ink-faint">{position + 1}.</span>
                              <span>
                                <span className="font-medium">{step.nodeName}</span>
                                <span className="text-ink-muted"> — {step.narrative}</span>
                                {step.controlNames.length > 0 && (
                                  <span className="block text-xs text-ink-faint">
                                    Controls on this step: {step.controlNames.join(', ')}
                                    {step.wasBlocked ? ' (operating well)' : ''}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ol>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-ink-faint">What helped</p>
                            <ul className="mt-1 space-y-1 text-sm text-ink-muted">
                              {incident.reconstruction.helped.map((item, position) => (
                                <li key={position} className="text-pretty">{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-ink-faint">What hurt</p>
                            <ul className="mt-1 space-y-1 text-sm text-ink-muted">
                              {incident.reconstruction.hurt.map((item, position) => (
                                <li key={position} className="text-pretty">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.history.decisionsLog.length > 0 && (
        <section aria-labelledby="decisions-log">
          <SectionHeading><span id="decisions-log">The judgements you made</span></SectionHeading>
          <Card>
            <CardBody>
              <ul className="space-y-2 text-sm">
                {state.history.decisionsLog.slice(-14).reverse().map((entry, position) => {
                  const runtime = state.decisions.decisions[entry.decisionId]
                  const def = runtime ? index.decision.get(runtime.defId) : undefined
                  const option = def?.options.find((candidate) => candidate.id === entry.optionId)
                  const rationale = entry.rationaleTagIds
                    .map((id) => index.rationaleTag.get(id)?.label)
                    .filter(Boolean)
                  return (
                    <li key={`${entry.decisionId}-${position}`} className="border-b border-line pb-2 last:border-0">
                      <p>
                        <span className="tabular-nums text-ink-faint">{shortDate(entry.day)}</span>{' '}
                        <span className="font-medium">{def?.title ?? entry.decisionId}</span>
                      </p>
                      <p className="text-ink-muted">{option?.label ?? entry.optionId}</p>
                      {rationale.length > 0 && (
                        <p className="text-xs text-ink-faint">Because: {rationale.join('; ')}</p>
                      )}
                      {runtime?.resolvedByDefault && (
                        <p className="text-xs text-band-elevated">This one lapsed; the organisation chose for you.</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </CardBody>
          </Card>
        </section>
      )}

      {(review.reasoning ?? []).length > 0 && (
        <section aria-labelledby="reasoning">
          <SectionHeading><span id="reasoning">The reasoning you used</span></SectionHeading>
          <Card>
            <CardBody>
              {(review.reasoning ?? []).some((line) => line.materialised === 0 && line.assumptionsFailed === 0) && (
                <p className="mb-3 text-sm text-ink-muted text-pretty">
                  {(review.reasoning ?? []).every((line) => line.materialised === 0 && line.assumptionsFailed === 0)
                    ? 'Nothing this year contradicted any reason you gave. That is not the same as the reasons having been tested.'
                    : 'Where a reason says only how often you used it, nothing this year contradicted it. That is not the same as its having been tested.'}
                </p>
              )}
              <ul className="space-y-3 text-sm">
                {(review.reasoning ?? []).map((line) => (
                  <li key={line.tagId} className="border-b border-line pb-3 last:border-0 last:pb-0">
                    <p className="font-medium">{line.label}</p>
                    <p className="mt-0.5 text-ink-muted text-pretty">{line.verdict}</p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      )}

      {review.blindSpots.length > 0 && (
        <section aria-labelledby="blind-spots">
          <SectionHeading><span id="blind-spots">What you never looked at</span></SectionHeading>
          <Card>
            <CardBody>
              <ul className="space-y-1 text-sm text-ink-muted">
                {review.blindSpots.map((spot, position) => (
                  <li key={position} className="text-pretty">{spot.charAt(0).toUpperCase() + spot.slice(1)}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      )}

      <section aria-labelledby="another-year">
        <SectionHeading><span id="another-year">Another year</span></SectionHeading>
        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm text-ink-muted text-pretty">{anotherYear(state.situationId, index.content.situations ?? [])}</p>
            <div className="flex flex-wrap gap-2">
              {state.finished && (
                <Button variant="primary" onClick={() => void leaveCampaign()}>Start another year</Button>
              )}
              <Button variant="secondary" onClick={download}>Export this campaign</Button>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  )
}

/** Names the openings this year did not have, so a second year is a choice rather than a repeat. */
function anotherYear(situationId: string | undefined, situations: { id: string; name: string }[]): string {
  const quoted = (name: string) => `\u201c${name}\u201d`
  const current = situations.find((s) => s.id === situationId)
  const others = situations.filter((s) => s.id !== situationId).map((s) => quoted(s.name))
  const list = others.length > 1 ? `${others.slice(0, -1).join(', ')} or ${others[others.length - 1]}` : (others[0] ?? '')
  const opening = current ? `This year was ${quoted(current.name)}.` : 'Nexora can begin more than one way.'
  return `${opening} The same organisation can also start from ${list}, each with its own budget, its own threat and a decision this year never asked. Your saved years stay on the start screen.`
}
