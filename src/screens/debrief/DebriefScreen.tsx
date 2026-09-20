/**
 * The annual CISO review (plan §26). Dimensions are assessed independently and
 * the output is narrative: the optional performance band never replaces it.
 * Incident reconstructions live here too, alongside the decisions that shaped them.
 */
import { useMemo } from 'react'
import { Badge, Button, Card, CardBody, SectionHeading } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { incidentViews, yearTimeline } from '@/store/selectors'
import { exportSave } from '@/store/persistence'
import { CAMPAIGN_DAYS } from '@/game/types'
import { objectiveStatusLabel } from '@/game/business/objectives'
import { statusLabel } from '@/lib/formatting/labels'
import { YearTimeline } from '@/components/debrief/YearTimeline'

const BAND_TONE: Record<string, 'severe' | 'elevated' | 'moderate' | 'low'> = {
  weak: 'severe',
  developing: 'elevated',
  solid: 'moderate',
  strong: 'low',
}

export function DebriefScreen() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const finishCampaign = useGameStore((store) => store.finishCampaign)
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-ink-faint">Annual review</p>
        <h1 className="mt-1 font-display text-3xl leading-tight text-balance">{review.headline}</h1>
        <p className="mt-2 text-ink-muted">{review.performanceBand} · seed {state.seed}</p>
      </header>

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
        <ul className="grid gap-3 lg:grid-cols-2">
          {review.dimensions.map((dimension) => (
            <li key={dimension.id}>
              <Card className="h-full">
                <CardBody className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">{dimension.label}</h3>
                    <Badge tone={BAND_TONE[dimension.band] ?? 'neutral'} glyph={false}>{dimension.band}</Badge>
                  </div>
                  <p className="text-sm text-ink-muted text-pretty">{dimension.narrative}</p>
                  {dimension.evidence.length > 0 && (
                    <ul className="space-y-0.5 text-xs text-ink-faint">
                      {dimension.evidence.slice(0, 5).map((evidence, position) => (
                        <li key={position}>{evidence}</li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
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
              <li key={incident.id}>
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium">{incident.name}</h3>
                      <Badge tone={incident.severity} >{incident.severity} consequence</Badge>
                    </div>
                    <p className="text-sm text-ink-muted">
                      Day {incident.startedDay}
                      {incident.resolvedDay !== undefined && ` to ${incident.resolvedDay}`} · {statusLabel(incident.phase)}
                      {incident.servicesAffected.length > 0 && ` · ${incident.servicesAffected.join(', ')}`}
                    </p>

                    {incident.reconstruction && (
                      <>
                        <p className="text-pretty">{incident.reconstruction.narrative}</p>
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
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">What helped</p>
                            <ul className="mt-1 space-y-1 text-sm text-ink-muted">
                              {incident.reconstruction.helped.map((item, position) => (
                                <li key={position} className="text-pretty">{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">What hurt</p>
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
                        <span className="tabular-nums text-ink-faint">Day {entry.day}</span>{' '}
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
                  <li key={position} className="text-pretty">{spot}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={download}>Export this campaign</Button>
      </div>
    </div>
  )
}
