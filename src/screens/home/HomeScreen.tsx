/**
 * Home / CISO briefing (plan §28.1): the day, what needs you, what changed and
 * what you still do not know. Qualitative language throughout.
 */
import { Badge, Button, Card, CardBody, EmptyState, Meter, SectionHeading } from '@/components/ui/primitives'
import { DecisionList } from '@/components/decisions/DecisionList'
import { Collisions } from '@/components/game/Collisions'
import { PatternNotice } from '@/components/risk/PatternNotice'
import { useGameStore } from '@/store/game-store'
import { briefing, topConcerns, visibleRisks, undiscoveredCount, programmeViews, teamView } from '@/store/selectors'
import { bandTone, capacityTone, confidenceTone, money, plural } from '@/lib/formatting/labels'
import { RISK_BAND_LABEL } from '@/game/risk/bands'

export function HomeScreen() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const setScreen = useGameStore((store) => store.setScreen)
  const setUi = useGameStore((store) => store.setUi)
  const openGlossary = useGameStore((store) => store.openGlossary)
  if (!state) return null

  const view = briefing(state, index)
  const concerns = topConcerns(state, index, 3)
  const unknown = undiscoveredCount(state)
  const programmes = programmeViews(state, index).filter((p) => p.status !== 'proposed')
  const team = teamView(state, index)
  const reviewsDue = visibleRisks(state, index).filter((risk) => risk.reviewDue && risk.status !== 'closed')
  const lastHighlights = state.history.entries.slice(-4).reverse()

  return (
    <div className="space-y-6">
      <section aria-labelledby="standing">
        <h1 id="standing" className="sr-only">Today's briefing</h1>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Residual exposure"
            value={RISK_BAND_LABEL[view.residualExposure]}
            tone={bandTone(view.residualExposure)}
            hint="Across the risks you have actually assessed"
            onInfo={() => openGlossary('gls-residual')}
          />
          <StatCard
            label="Board confidence"
            value={view.boardConfidence}
            tone="accent"
            hint="How the board currently reads your judgement"
          />
          <StatCard
            label="Team capacity"
            value={view.teamCapacity}
            tone={capacityTone(view.teamCapacity)}
            hint={`${plural(view.runningWork, 'piece')} of delegated work running`}
            onInfo={() => openGlossary('gls-capacity')}
          />
          <StatCard
            label="Recovery confidence"
            value={view.recoveryConfidence}
            tone={view.recoveryConfidence === 'Limited' ? 'high' : view.recoveryConfidence === 'Partial' ? 'elevated' : 'low'}
            hint="Based on what you have verified, not what you were told"
          />
        </div>
      </section>

      <Collisions />

      {/* The moment something clicks should find the player, not wait on a tab. */}
      <PatternNotice />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section aria-labelledby="decisions">
            <SectionHeading>
              <span id="decisions">Waiting on you</span>
            </SectionHeading>
            {/* The quarterly board paper only ever appeared on the Board
                screen. A player working from the Briefing — where the game
                puts them, and where this section tells them what needs an
                answer — could play a whole year, take every decision in good
                time, and still be told at the close that they prepared none of
                the four. "Nothing is waiting on you" was being shown with a
                board paper outstanding. */}
            {state.reviews.pendingQuarter !== undefined && (
              <Card className="mb-3 border-accent/40 bg-accent-soft/25">
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-balance">
                      The Q{state.reviews.pendingQuarter} board paper is due
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted text-pretty">
                      What the board hears about this quarter, and what they do not, is your call.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setScreen('board')}>
                    Prepare it
                  </Button>
                </CardBody>
              </Card>
            )}
            <DecisionList limit={4} />
          </section>

          <section aria-labelledby="concerns">
            <SectionHeading
              action={
                <Button variant="quiet" size="sm" className="compact min-h-9" onClick={() => setScreen('risk')}>
                  All risks
                </Button>
              }
            >
              <span id="concerns">Your top concerns</span>
            </SectionHeading>
            {concerns.length === 0 ? (
              <EmptyState
                title="You have not assessed any risks yet"
                description="You inherited a register, not an understanding. Gather evidence, form a hypothesis, and turn it into something the business can decide about."
                action={
                  <Button variant="primary" size="sm" onClick={() => setScreen('risk')}>
                    Open the risk workspace
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {concerns.map((risk) => (
                  <li key={risk.id}>
                    <Card>
                      <CardBody>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={bandTone(risk.band)}>{RISK_BAND_LABEL[risk.band]} residual</Badge>
                          <Badge tone={confidenceTone(risk.confidence)} glyph={false}>
                            {risk.confidence} confidence
                          </Badge>
                          {risk.hasInvalidatedAssumption && <Badge tone="high" glyph={false}>Assumption failed</Badge>}
                        </div>
                        <h3 className="mt-2 font-medium text-balance">{risk.title}</h3>
                        <p className="mt-1 text-sm text-ink-muted text-pretty">{risk.statement}</p>
                        <Button
                          variant="quiet"
                          size="sm"
                          className="compact mt-3 min-h-9"
                          onClick={() => {
                            setUi({ selectedScenarioId: risk.id })
                            setScreen('risk')
                          }}
                        >
                          Examine
                        </Button>
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="resources">
            <SectionHeading><span id="resources">Your resources</span></SectionHeading>
            <Card>
              <CardBody className="space-y-4">
                <Meter
                  label="Cyber budget"
                  value={view.budgetRemaining}
                  max={view.budgetTotal}
                  valueLabel={`${money(view.budgetRemaining)} of ${money(view.budgetTotal)}`}
                  tone={view.budgetRemaining / view.budgetTotal < 0.2 ? 'high' : 'accent'}
                />
                <Meter
                  label="Your week"
                  value={view.focusRemaining}
                  max={view.focusPerWeek}
                  valueLabel={`${view.focusRemaining} of ${view.focusPerWeek} left`}
                  tone={view.focusRemaining === 0 ? 'high' : 'accent'}
                />
                {/*
                  What the player has checked for themselves, not what they
                  were handed. This read "Organisation understood 53%" on day
                  one, before they had looked at anything: a number the game
                  does not render elsewhere, asserting understanding nobody had
                  earned, on the screen that sets the tone for the year.
                */}
                <Meter
                  label="Checked for yourself"
                  value={Math.round(view.examinedShare * 100)}
                  valueLabel={examinedLabel(view.examinedShare)}
                  tone={view.examinedShare < 0.4 ? 'elevated' : 'low'}
                />
                <p className="text-sm text-ink-muted text-pretty">
                  {unknown.nodes > 0 || unknown.edges > 0
                    ? `There is more of Nexora you have not seen: ${plural(unknown.nodes, 'system')} and ${plural(unknown.edges, 'dependency', 'dependencies')} remain undiscovered.`
                    : 'You have brought the whole estate into view.'}
                </p>
              </CardBody>
            </Card>
          </section>

          {reviewsDue.length > 0 && (
            <section aria-labelledby="reviews">
              <SectionHeading><span id="reviews">Due for reassessment</span></SectionHeading>
              <Card>
                <CardBody>
                  <ul className="space-y-2 text-sm">
                    {reviewsDue.slice(0, 4).map((risk) => (
                      <li key={risk.id} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-0.5 text-ink-faint">·</span>
                        <button
                          type="button"
                          className="compact text-left underline decoration-line-strong underline-offset-4 hover:text-accent-ink"
                          onClick={() => {
                            setUi({ selectedScenarioId: risk.id })
                            setScreen('risk')
                          }}
                        >
                          {risk.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </section>
          )}

          <section aria-labelledby="programmes-summary">
            <SectionHeading
              action={
                <Button variant="quiet" size="sm" className="compact min-h-9" onClick={() => setScreen('programmes')}>
                  Portfolio
                </Button>
              }
            >
              <span id="programmes-summary">Capability you are building</span>
            </SectionHeading>
            {programmes.length === 0 ? (
              <EmptyState
                title="No programme has started"
                description="Controls drift downwards on their own. Nothing improves unless you fund it and staff it."
                action={
                  <Button variant="primary" size="sm" onClick={() => setScreen('programmes')}>
                    Review programmes
                  </Button>
                }
              />
            ) : (
              <Card>
                <CardBody className="space-y-4">
                  {programmes.map((programme) => (
                    <div key={programme.id}>
                      <Meter
                        label={programme.shortName}
                        value={programme.progressPercent}
                        valueLabel={`${programme.progressPercent}% · ${programme.confidenceLabel.toLowerCase()} confidence`}
                        tone={programme.status === 'at-risk' ? 'elevated' : 'accent'}
                      />
                      {programme.blockers.length > 0 && (
                        <p className="mt-1 text-xs text-band-elevated">
                          Blocked: {programme.blockers.map((blocker) => blocker.name).join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}
          </section>

          <section aria-labelledby="team-summary">
            <SectionHeading
              action={
                <Button variant="quiet" size="sm" className="compact min-h-9" onClick={() => setScreen('team')}>
                  Team
                </Button>
              }
            >
              <span id="team-summary">Your team</span>
            </SectionHeading>
            <Card>
              <CardBody>
                <p className="text-sm text-ink-muted text-pretty">
                  {team.strainBand === 'available' || team.strainBand === 'committed'
                    ? 'Your functions have room to take on work.'
                    : team.strainBand === 'stretched'
                      ? 'Your functions are stretched. More delegation will come back thinner.'
                      : 'Your team is past what it can sustain. Something has to stop.'}
                </p>
                {state.team.assignments.filter((assignment) => assignment.status === 'running').length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {state.team.assignments
                      .filter((assignment) => assignment.status === 'running')
                      .slice(0, 3)
                      .map((assignment) => (
                        <li key={assignment.id} className="flex justify-between gap-3">
                          <span className="truncate">{assignment.title}</span>
                          <span className="shrink-0 text-ink-faint tabular-nums">
                            {Math.max(0, assignment.dueDay - state.currentDay)}d
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </section>

          {lastHighlights.length > 0 && (
            <section aria-labelledby="recent">
              <SectionHeading><span id="recent">Recently</span></SectionHeading>
              <Card>
                <CardBody>
                  <ul className="space-y-2 text-sm text-ink-muted">
                    {lastHighlights.map((entry, position) => (
                      <li key={`${entry.day}-${position}`} className="flex gap-2">
                        <span className="shrink-0 tabular-nums text-ink-faint">d{entry.day}</span>
                        <span className="text-pretty">{entry.summary}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
  hint,
  onInfo,
}: {
  label: string
  value: string
  tone: Parameters<typeof Badge>[0]['tone']
  hint: string
  onInfo?: () => void
}) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">{label}</p>
          {onInfo && (
            <button
              type="button"
              onClick={onInfo}
              aria-label={`What does ${label} mean?`}
              className="compact -mr-1 -mt-1 rounded-full px-2 py-1 text-xs text-ink-faint hover:text-ink"
            >
              ?
            </button>
          )}
        </div>
        <Badge tone={tone}>{value}</Badge>
        <p className="text-xs text-ink-faint text-pretty">{hint}</p>
      </CardBody>
    </Card>
  )
}

/**
 * Words rather than a percentage, and about verification rather than sight:
 * the inherited register makes most of Nexora visible on day one, and treating
 * that as understanding is the mistake the whole game is about.
 */
function examinedLabel(share: number): string {
  if (share <= 0) return 'none of it yet'
  if (share < 0.2) return 'barely started'
  if (share < 0.45) return 'a start'
  if (share < 0.7) return 'a fair amount'
  if (share < 0.9) return 'most of it'
  return 'nearly all of it'
}
