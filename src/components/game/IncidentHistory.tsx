/** Closed-incident audit, available as soon as a reconstruction exists. */
import { Badge, Button, Card, CardBody, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { incidentViews } from '@/store/selectors'
import { shortDate, statusLabel } from '@/lib/formatting/labels'
import { IncidentIllustration } from './IncidentIllustration'

export function IncidentHistory() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  if (!state) return null
  const incidents = incidentViews(state, index).filter((incident) => state.finished || incident.reconstruction)
  const openMessage = (id: string) => {
    useGameStore.getState().setUi({ selectedMessageId: id })
    useGameStore.getState().setScreen('inbox')
  }
    return incidents.length > 0 ? (
        <section aria-labelledby="incidents">
          <SectionHeading><span id="incidents">Incident reconstruction</span></SectionHeading>
          <ul className="space-y-3">
            {incidents.map((incident) => (
              <li key={incident.id} className="print-keep">
                <Card>
                  <CardBody className="space-y-3">
                    <IncidentIllustration name={incident.name} className="mb-4 w-full max-w-sm" />
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
                        <p className="text-sm text-ink-muted">
                          Control assessment at incident debrief{incident.reconstruction.assessedDay !== undefined ? `, ${shortDate(incident.reconstruction.assessedDay)}` : ' (assessment date not retained in this save)'}. These are estate-wide conditions, not proof that a control covered or stopped this particular route. Conditions at intrusion time were not recorded.
                        </p>
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
                                    {step.wasBlocked ? ' (at least one had broad coverage and operation at debrief)' : ''}
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ol>
                        <div>
                          <p className="text-xs font-medium text-ink-faint">Earlier SOC warnings</p>
                          {(incident.reconstruction.warningMessageIds?.length ?? 0) > 0 ? (
                            <ul className="mt-1 space-y-2 text-sm">
                              {incident.reconstruction.warningMessageIds!.map((id) => {
                                const message = state.inbox.messages.find((item) => item.id === id)
                                return <li key={id}>{message ? <>
                                  <Button variant="quiet" size="sm" onClick={() => openMessage(id)}>Open warning: {shortDate(message.day)} · {message.subject}</Button>
                                  <p className="text-ink-muted">{message.body}</p>
                                  <p className="text-xs text-ink-faint">Raised {Math.max(0, incident.startedDay - message.day)} days before business impact. At the time, Risk and Investigate offered ways to check the signal; the route was not yet known.</p>
                                </> : <p className="text-ink-muted">The linked warning has aged out of the Inbox.</p>}</li>
                              })}
                            </ul>
                          ) : <p className="mt-1 text-sm text-ink-muted">No exact warning link was retained for this reconstruction. Similar messages are not evidence of the same intrusion.</p>}
                        </div>
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
    ) : null
}
