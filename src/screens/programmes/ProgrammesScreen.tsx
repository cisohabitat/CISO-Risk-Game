import { ProgrammeCommitments } from '@/components/game/ProgrammeCommitments'
/**
 * Programme portfolio (plan §28.5). Programmes take months, need people as well
 * as money, and hit blockers that money cannot clear.
 */
import { minimumProgrammeFunding, programmeAccelerationCost } from '@/game/programmes/funding'
import { ProgrammeJourney } from '@/components/programmes/ProgrammeJourney'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Dialog, Disclosure, Fact, Meter, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { programmeViews, visibleRisks, type ProgrammeView } from '@/store/selectors'
import { FOCUS_COSTS } from '@/game/engine/orchestrator'
import { daysAWeek, functionLabel, money, plural, statusLabel } from '@/lib/formatting/labels'

export function ProgrammesScreen() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const requestedProgramme = useGameStore((store) => store.ui.selectedProgrammeId)
  const setUi = useGameStore((store) => store.setUi)
  useEffect(() => {
    if (!requestedProgramme) return
    const target = document.getElementById(`programme-${requestedProgramme}`)
    target?.scrollIntoView?.({ block: 'start' })
    target?.focus({ preventScroll: true })
    setUi({ selectedProgrammeId: undefined })
  }, [requestedProgramme, setUi])
  const [starting, setStarting] = useState<ProgrammeView | undefined>()
  const [budget, setBudget] = useState(0)
  const [sponsorId, setSponsorId] = useState('')
  const [blockerReceipt, setBlockerReceipt] = useState<{ gameId: string; text: string }>()

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

  // Finished in an earlier year: not "Under way" in this one.
  const live = programmes.filter((programme) => programme.status !== 'proposed' && !programme.finishedEarlier)
  const earlier = programmes.filter((programme) => programme.finishedEarlier)
  const proposed = programmes.filter((programme) => programme.status === 'proposed')
  const groupOf = (programme: ProgrammeView) => programme.status === 'complete' ? 'Completed' : programme.status === 'paused' ? 'Paused' : programme.blockers.length > 0 ? 'Blocked' : 'Running'
  const groupedLive = ['Running', 'Paused', 'Blocked', 'Completed'].flatMap((label) => {
    const entries = live.filter((programme) => groupOf(programme) === label)
    return entries.map((programme, position) => ({ programme, label: position === 0 ? label : undefined, count: entries.length }))
  })
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
    <div className="portfolio-workspace space-y-6">
      <div>
        <p className="document-kicker">Nexora Group · Delivery portfolio</p>
        <h1 className="mt-2 font-display text-3xl leading-tight">Programmes</h1>
        <p className="text-sm text-ink-muted text-pretty">
          {money(state.resources.budgetRemaining)} of cyber budget remains. Everything still on the table would cost{' '}
          {money(totalCost)}, so this is a choice rather than a plan.
        </p>
      </div>

      <ProgrammeCommitments />
      {blockerReceipt?.gameId === state.gameId && <p role="status" aria-label="Blocker cleared" className="rounded border border-line p-3 text-sm">{blockerReceipt.text}</p>}
      {earlier.length > 0 && (
        <p className="text-sm text-ink-muted text-pretty">
          Delivered in an earlier year: {earlier.map((programme) => programme.name).join(', ')}.
        </p>
      )}

      {live.length > 0 && (
        <section aria-label="Delivery portfolio">
          <ul className="portfolio-list">
            {groupedLive.map(({ programme, label, count }) => (
              <li key={programme.id} id={`programme-${programme.id}`} tabIndex={-1}>
                {label && <h2 className="portfolio-divider"><span>{label}</span>{' '}<span className="text-sm font-normal tabular-nums text-ink-muted">{count} {count === 1 ? 'programme' : 'programmes'}</span></h2>}
                <article className="programme-row programme-active grid gap-5 py-6">
                  <div className="programme-summary space-y-3">
                    <div className="programme-heading space-y-2">
                      <div>
                        <h3 className="font-display text-xl leading-tight text-balance">{programme.name}</h3>
                        <p className="text-sm text-ink-muted">
                          {programme.sponsorName ? `Sponsored by ${programme.sponsorName}` : 'No executive sponsor'}
                        </p>
                      </div>
                      <Badge tone={programme.status === 'at-risk' ? 'elevated' : programme.status === 'complete' ? 'low' : 'moderate'} glyph={false}>
                        {statusLabel(programme.status)}
                      </Badge>
                    </div>
                    {programme.latestBlockerNote && <p className="text-xs text-ink-muted">Latest recorded blocker update: {programme.latestBlockerNote}</p>}

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

                  </div>
                  <div className="space-y-4">
                    {programme.blockers.length > 0 && (
                      <div className="rounded-lg border border-band-elevated/40 bg-band-elevated-soft/50 p-3">
                        <p className="text-sm font-medium">Blocked</p>
                        <ul className="mt-2 space-y-3">
                          {programme.blockers.map((blocker) => (
                            <li key={blocker.id}>
                              <p className="text-sm font-medium">{blocker.name}</p>
                              <p className="mt-0.5 text-sm text-ink-muted text-pretty">{blocker.description}</p>
                              <p className="mt-1 text-sm text-ink-muted">{blocker.progressNote}</p>
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
                                onClick={() => { const before = useGameStore.getState().state!; const result = dispatch({ type: 'resolveProgrammeBlocker', programmeId: programme.id, blockerId: blocker.id }); const after = useGameStore.getState().state!; if (result.ok) setBlockerReceipt({ gameId: state.gameId, text: `${programme.name}: ${blocker.name} cleared. Used ${before.resources.focusRemaining - after.resources.focusRemaining} attention and ${money(before.resources.budgetRemaining - after.resources.budgetRemaining)} budget. ${result.message}` }) }}
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

                    <ProgrammeJourney programme={programme} />
                    <Disclosure summary={`Milestones · ${programme.milestones.filter((milestone) => milestone.complete).length} of ${programme.milestones.length} complete`}>
                      <ul className="mt-1 space-y-1 text-sm">
                        {programme.milestones.map((milestone) => (
                          <li key={milestone.id} className="flex gap-2">
                            <span aria-hidden="true" className={milestone.complete ? 'text-positive' : 'text-ink-faint'}>
                              {milestone.complete ? '✓' : '○'}
                            </span>
                            <span><span className="font-medium">{milestone.name}</span><span className="mt-1 block text-ink-muted">{milestone.description}</span></span>
                          </li>
                        ))}
                      </ul>
                    </Disclosure>

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
                              budget: programmeAccelerationCost(programme.budgetCost),
                            })
                          }
                        >
                          Accelerate ({money(programmeAccelerationCost(programme.budgetCost))})
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {proposed.length > 0 && (
        <section aria-labelledby="proposed">
          <SectionHeading><span id="proposed">On the table</span></SectionHeading>
          <ul className="divide-y divide-line border-y border-line">
            {proposed.map((programme) => (
              <li key={programme.id} id={`programme-${programme.id}`} tabIndex={-1}>
                <article className="programme-row grid gap-5 py-6 lg:grid-cols-2 lg:gap-8">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-display text-xl leading-tight text-balance">{programme.name}</h3>
                      <p className="mt-1 text-sm text-ink-muted text-pretty">{programme.description}</p>
                    </div>
                    <p className="flex-1 text-sm italic text-ink-faint text-pretty">{programme.rationale}</p>
                  </div>
                  <div className="space-y-4">
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
                    <p className="text-sm text-ink-muted">Minimum to start: {money(minimumProgrammeFunding(programme.budgetCost))}. Full funding: {money(programme.budgetCost)}.
                      {programme.budgetCost > state.resources.budgetRemaining && minimumProgrammeFunding(programme.budgetCost) <= state.resources.budgetRemaining && <> You can start with {money(state.resources.budgetRemaining)}; partial funding slows delivery.</>}
                    </p>
                    <dl className="grid grid-cols-2 gap-3">
                      <Fact label="Base duration" value={`about ${Math.round(programme.durationDays / 30)} months`} />
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
                        state.resources.budgetRemaining < minimumProgrammeFunding(programme.budgetCost)
                          ? 'Not affordable'
                          : attentionShort
                            ? 'Out of attention this week'
                            : 'Start this'
                      }: ${programme.name}`}
                      disabled={state.resources.budgetRemaining < minimumProgrammeFunding(programme.budgetCost) || attentionShort}
                      onClick={() => {
                        setStarting(programme)
                        setBudget(Math.min(programme.budgetCost, Math.floor(state.resources.budgetRemaining)))
                        setSponsorId('')
                      }}
                    >
                      {state.resources.budgetRemaining < minimumProgrammeFunding(programme.budgetCost)
                        ? 'Not affordable'
                        : attentionShort
                          ? 'Out of attention this week'
                          : 'Start this'}
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {starting && (() => {
        const fundingMax = Math.min(starting.budgetCost, Math.floor(state.resources.budgetRemaining))
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
                // Whole £1k steps keep both the half-cost floor and the
                // affordable upper endpoint reachable, including after cuts.
                min={minimumProgrammeFunding(starting.budgetCost)}
                max={fundingMax}
                step={1}
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

            <p className="text-sm text-ink-muted">
              Funding is committed now. Pausing later frees people, but does not return
              this allocation. Keep room for later decisions and incident response.
            </p>

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
              {Math.round(starting.durationDays / 30)} months at the base rate. Funding, staffing, blockers, acceleration and recorded delivery decisions change the actual date; this is not a fixed completion promise.
            </p>
          </div>
        </Dialog>
        )
      })()}
    </div>
  )
}
