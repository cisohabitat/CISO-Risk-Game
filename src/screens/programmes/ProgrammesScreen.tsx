/**
 * Programme portfolio (plan §28.5). Programmes take months, need people as well
 * as money, and hit blockers that money cannot clear.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, Fact, Meter, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { programmeViews, visibleRisks, type ProgrammeView } from '@/store/selectors'
import { FOCUS_COSTS } from '@/game/engine/orchestrator'
import { daysAWeek, functionLabel, money, plural, statusLabel } from '@/lib/formatting/labels'

export function ProgrammesScreen() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const [starting, setStarting] = useState<ProgrammeView | undefined>()
  const [budget, setBudget] = useState(0)
  const [sponsorId, setSponsorId] = useState('')

  const programmes = useMemo(() => (state ? programmeViews(state, index) : []), [state, index])
  // Which of the player's own risks each programme would move. A card listed
  // cost and duration and left the player to work out what it was for. Only
  // risks the player can see are named; the rest of the register stays hidden.
  const risks = useMemo(() => (state ? visibleRisks(state, index) : []), [state, index])
  const treats = (programmeId: string) => risks.filter((risk) => risk.treatmentProgrammeIds.includes(programmeId))
  if (!state) return null
  // Refused after the click otherwise, as a toast that said nothing the card
  // had not already had the chance to say.
  const attentionShort = state.resources.focusRemaining < FOCUS_COSTS.programmeIntervention

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
                              {/* Refused after the click, with £20k left and a
                                  £120k price on the button. Decisions already
                                  disable what the year cannot pay for. */}
                              <Button
                                variant="secondary"
                                size="sm"
                                className="compact mt-2 min-h-9"
                                disabled={
                                  (blocker.budget ?? 0) > state.resources.budgetRemaining ||
                                  (blocker.focus ?? 0) > state.resources.focusRemaining
                                }
                                onClick={() =>
                                  dispatch({ type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: blocker.id })
                                }
                              >
                                {blocker.resolution}
                                {blocker.budget ? ` (${money(blocker.budget)})` : ''}
                              </Button>
                              {(blocker.budget ?? 0) > state.resources.budgetRemaining && (
                                <p className="mt-1 text-xs text-band-elevated">
                                  Costs {money(blocker.budget ?? 0)}, more than the {money(Math.max(0, state.resources.budgetRemaining))} left this year.
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-ink-faint">Milestones</p>
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
                    {/* One risk to a line. Run together with semicolons, three
                        long titles were a paragraph nobody could scan. */}
                    {treats(programme.id).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-ink-faint">Treats</p>
                        <ul className="mt-1 space-y-0.5 text-sm" data-testid="programme-treats">
                          {treats(programme.id).map((risk) => (
                            <li key={risk.id} className="flex gap-2">
                              <span aria-hidden="true" className="text-ink-faint">–</span>
                              <span className="text-pretty">{risk.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Meter
                      label="Of the budget left"
                      value={programme.budgetCost}
                      max={Math.max(1, state.resources.budgetRemaining)}
                      valueLabel={
                        programme.budgetCost > state.resources.budgetRemaining
                          ? `${money(programme.budgetCost)}, more than is left`
                          : `${money(programme.budgetCost)} of ${money(state.resources.budgetRemaining)}`
                      }
                      tone={programme.budgetCost > state.resources.budgetRemaining ? 'high' : 'neutral'}
                    />
                    <dl className="grid grid-cols-2 gap-3">
                      <Fact label="Runs for" value={`about ${Math.round(programme.durationDays / 30)} months`} />
                      <Fact label="Improves" value={programme.controlImpact.join(', ')} />
                      {/* "Identity 2d/wk, Engineering 1.5d/wk" was shorthand the
                          rest of the game never uses; the Team screen counts
                          days a week, and so does this. */}
                      <Fact
                        className="col-span-2"
                        label="People it needs"
                        value={
                          <ul data-testid="programme-people">
                            {programme.capacityDemand.map((demand) => (
                              <li key={demand.fn}>
                                {functionLabel(demand.fn)}, {daysAWeek(demand.days)}
                              </li>
                            ))}
                          </ul>
                        }
                      />
                    </dl>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="self-start"
                      aria-label={`${
                        state.resources.budgetRemaining < programme.budgetCost
                          ? 'Not affordable'
                          : attentionShort
                            ? 'Out of attention this week'
                            : 'Start this'
                      }: ${programme.name}`}
                      disabled={state.resources.budgetRemaining < programme.budgetCost || attentionShort}
                      onClick={() => {
                        setStarting(programme)
                        setBudget(programme.budgetCost)
                        setSponsorId('')
                      }}
                    >
                      {state.resources.budgetRemaining < programme.budgetCost
                        ? 'Not affordable'
                        : attentionShort
                          ? 'Out of attention this week'
                          : 'Start this'}
                    </Button>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {starting && (() => {
        const fundingMax = Math.min(starting.budgetCost, Math.round(state.resources.budgetRemaining))
        return (
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
                // Steps counted down from the most it can have, so the top
                // of the range is reachable: from a minimum of £425k in £10k
                // steps the slider stopped at £845k of £850k, and a keyboard
                // could never fund the programme fully again once it moved.
                min={fundingMax - 10 * Math.floor((fundingMax - Math.round(starting.budgetCost * 0.5)) / 10)}
                max={fundingMax}
                step={10}
                value={budget}
                aria-valuetext={`${money(budget)} of ${money(starting.budgetCost)}`}
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
                aria-label="Executive sponsor"
                value={sponsorId}
                onChange={(event) => setSponsorId(event.target.value)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-base"
              >
                <option value="">Default sponsor</option>
                {/* A sponsor is an executive. The chair of the committee that
                    oversees the programme cannot also sponsor it. */}
                {index.content.stakeholders.filter((person) => person.id !== 'stk-board').map((person) => (
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
        )
      })()}
    </div>
  )
}
