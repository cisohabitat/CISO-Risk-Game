/**
 * Programme portfolio (plan §28.5). Programmes take months, need people as well
 * as money, and hit blockers that money cannot clear.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, Fact, Meter, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { programmeViews, type ProgrammeView } from '@/store/selectors'
import { functionLabel, money, plural, statusLabel } from '@/lib/formatting/labels'

export function ProgrammesScreen() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const [starting, setStarting] = useState<ProgrammeView | undefined>()
  const [budget, setBudget] = useState(0)
  const [sponsorId, setSponsorId] = useState('')

  const programmes = useMemo(() => (state ? programmeViews(state, index) : []), [state, index])
  if (!state) return null

  const live = programmes.filter((programme) => programme.status !== 'proposed')
  const proposed = programmes.filter((programme) => programme.status === 'proposed')
  const totalCost = proposed.reduce((sum, programme) => sum + programme.budgetCost, 0)

  const start = () => {
    if (!starting) return
    const result = dispatch({
      type: 'startProgramme',
      programmeId: starting.id,
      budget,
      sponsorId: sponsorId || undefined,
    })
    if (result.ok) setStarting(undefined)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl leading-tight">Programmes</h1>
        <p className="text-sm text-ink-muted text-pretty">
          {money(state.resources.budgetRemaining)} of cyber budget remains. Everything still on the table would cost{' '}
          {money(totalCost)}, so this is a choice rather than a plan.
        </p>
      </div>

      {live.length > 0 && (
        <section aria-labelledby="live">
          <SectionHeading><span id="live">Under way</span></SectionHeading>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {live.map((programme) => (
              <li key={programme.id}>
                <Card className={programme.status === 'at-risk' ? 'border-band-elevated/50' : undefined}>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{programme.name}</h3>
                        <p className="text-sm text-ink-muted">
                          {programme.sponsorName ? `Sponsored by ${programme.sponsorName}` : 'No executive sponsor'}
                        </p>
                      </div>
                      <Badge tone={programme.status === 'at-risk' ? 'elevated' : programme.status === 'complete' ? 'low' : 'moderate'} glyph={false}>
                        {statusLabel(programme.status)}
                      </Badge>
                    </div>

                    <Meter
                      label="Delivered"
                      value={programme.progressPercent}
                      valueLabel={`${programme.progressPercent}%`}
                      tone={programme.status === 'at-risk' ? 'elevated' : 'accent'}
                    />

                    <dl className="grid grid-cols-2 gap-3">
                      <Fact label="Staffing" value={programme.staffingLabel} />
                      <Fact label="Delivery confidence" value={programme.confidenceLabel} />
                    </dl>

                    {programme.blockers.length > 0 && (
                      <div className="rounded-lg border border-band-elevated/40 bg-band-elevated-soft/50 p-3">
                        <p className="text-sm font-medium">Blocked</p>
                        <ul className="mt-2 space-y-3">
                          {programme.blockers.map((blocker) => (
                            <li key={blocker.id}>
                              <p className="text-sm font-medium">{blocker.name}</p>
                              <p className="mt-0.5 text-sm text-ink-muted text-pretty">{blocker.description}</p>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="compact mt-2 min-h-9"
                                onClick={() =>
                                  dispatch({ type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: blocker.id })
                                }
                              >
                                {blocker.resolution}
                                {blocker.budget ? ` (${money(blocker.budget)})` : ''}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Milestones</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {programme.milestones.map((milestone) => (
                          <li key={milestone.id} className="flex gap-2">
                            <span aria-hidden="true" className={milestone.complete ? 'text-positive' : 'text-ink-faint'}>
                              {milestone.complete ? '✓' : '○'}
                            </span>
                            <span className={milestone.complete ? '' : 'text-ink-muted'}>{milestone.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {programme.status !== 'complete' && (
                      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                        <Button
                          variant="quiet"
                          size="sm"
                          className="compact min-h-9"
                          onClick={() =>
                            dispatch({
                              type: 'setProgrammeStatus',
                              programmeId: programme.id,
                              status: programme.status === 'paused' ? 'active' : 'paused',
                            })
                          }
                        >
                          {programme.status === 'paused' ? 'Resume' : 'Pause'}
                        </Button>
                        <Button
                          variant="quiet"
                          size="sm"
                          className="compact min-h-9"
                          onClick={() =>
                            dispatch({
                              type: 'accelerateProgramme',
                              programmeId: programme.id,
                              budget: Math.round(programme.budgetCost * 0.25),
                            })
                          }
                        >
                          Accelerate ({money(Math.round(programme.budgetCost * 0.25))})
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {proposed.length > 0 && (
        <section aria-labelledby="proposed">
          <SectionHeading><span id="proposed">On the table</span></SectionHeading>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {proposed.map((programme) => (
              <li key={programme.id}>
                <Card className="h-full">
                  <CardBody className="flex h-full flex-col space-y-3">
                    <div>
                      <h3 className="font-medium">{programme.name}</h3>
                      <p className="mt-1 text-sm text-ink-muted text-pretty">{programme.description}</p>
                    </div>
                    <p className="flex-1 text-sm italic text-ink-faint text-pretty">{programme.rationale}</p>
                    <dl className="grid grid-cols-2 gap-3">
                      <Fact label="Cost" value={money(programme.budgetCost)} />
                      <Fact label="Runs for" value={`about ${Math.round(programme.durationDays / 30)} months`} />
                      <Fact
                        label="People it needs"
                        value={programme.capacityDemand.map((demand) => `${functionLabel(demand.fn)} ${demand.days}d/wk`).join(', ')}
                      />
                      <Fact label="Improves" value={programme.controlImpact.join(', ')} />
                    </dl>
                    <Button
                      variant="primary"
                      size="sm"
                      className="self-start"
                      disabled={state.resources.budgetRemaining < programme.budgetCost}
                      onClick={() => {
                        setStarting(programme)
                        setBudget(programme.budgetCost)
                        setSponsorId('')
                      }}
                    >
                      {state.resources.budgetRemaining < programme.budgetCost ? 'Not affordable' : 'Start this'}
                    </Button>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {starting && (
        <Dialog
          open
          onClose={() => setStarting(undefined)}
          title={`Start ${starting.name}`}
          description="Standing a programme up costs budget, two units of your attention, and a claim on people who are already busy."
          footer={
            <>
              <Button variant="quiet" onClick={() => setStarting(undefined)}>Cancel</Button>
              <Button variant="primary" onClick={start}>Start the programme</Button>
            </>
          }
        >
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Funding
              </span>
              <input
                type="range"
                min={Math.round(starting.budgetCost * 0.5)}
                max={Math.min(starting.budgetCost, Math.round(state.resources.budgetRemaining))}
                step={10}
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                className="w-full accent-[var(--accent)]"
                style={{ minHeight: 0 }}
              />
              <span className="mt-1 block text-sm">
                {money(budget)} of {money(starting.budgetCost)} —{' '}
                {budget >= starting.budgetCost
                  ? 'fully funded'
                  : 'underfunded, which will slow delivery'}
              </span>
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Executive sponsor
              </legend>
              <select
                value={sponsorId}
                onChange={(event) => setSponsorId(event.target.value)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-base"
              >
                <option value="">Default sponsor</option>
                {index.content.stakeholders.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} — {person.shortRole}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-ink-muted text-pretty">
                A sponsor who already believes you is worth more than one who outranks everyone.
              </p>
            </fieldset>

            <p className="text-sm text-ink-muted text-pretty">
              It will need {plural(starting.capacityDemand.length, 'team')} for about{' '}
              {Math.round(starting.durationDays / 30)} months. If those people are committed elsewhere, this will crawl.
            </p>
          </div>
        </Dialog>
      )}
    </div>
  )
}
