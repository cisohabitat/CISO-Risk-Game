/**
 * Team (plan §28.6). Enough to make capacity and delegation real decisions,
 * without turning the game into an HR simulator.
 */
import { useMemo } from 'react'
import { Badge, Button, Card, CardBody, EmptyState, Fact, Meter, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { teamView } from '@/store/selectors'
import { capacityTone, money, plural } from '@/lib/formatting/labels'

export function TeamScreen() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)

  const view = useMemo(() => (state ? teamView(state, index) : undefined), [state, index])
  if (!state || !view) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl leading-tight">Team</h1>
        <p className="text-sm text-ink-muted text-pretty">
          Your functions are <strong>{view.strainBand}</strong>{view.healthNote ? <> — and {view.healthNote}</> : null}. Delegated work competes with programme delivery for
          the same people.
        </p>
      </div>

      <section aria-labelledby="functions">
        <SectionHeading><span id="functions">Capacity</span></SectionHeading>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {view.functions.map((fn) => (
            <li key={fn.fn}>
              <Card className="h-full">
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{fn.label}</h3>
                    <Badge tone={capacityTone(fn.band)} glyph={false}>{fn.band}</Badge>
                  </div>
                  <Meter
                    label="Committed"
                    value={fn.committed}
                    max={fn.capacity}
                    valueLabel={`${fn.committed} of ${fn.capacity} days a week`}
                    tone={capacityTone(fn.band)}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-ink-muted">{fn.moraleLabel}</p>
                    {fn.vacancies > 0 && (
                      <Button
                        variant="quiet"
                        size="sm"
                        className="compact min-h-9"
                        disabled={fn.hiring}
                        onClick={() => dispatch({ type: 'hire', fn: fn.fn as never })}
                      >
                        {fn.hiring ? 'Recruiting…' : `Recruit (${money(120)})`}
                      </Button>
                    )}
                  </div>
                  {fn.vacancies > 0 && !fn.hiring && (
                    <p className="text-xs text-band-elevated">{plural(fn.vacancies, 'vacancy', 'vacancies')} unfilled</p>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="leaders">
        <SectionHeading><span id="leaders">Cyber leadership</span></SectionHeading>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {view.leaders.map((leader) => (
            <li key={leader.id}>
              <Card className="h-full">
                <CardBody className="space-y-3">
                  <div>
                    <h3 className="font-medium">{leader.name}</h3>
                    <p className="text-sm text-ink-muted">{leader.role}</p>
                  </div>
                  <dl className="grid grid-cols-3 gap-2">
                    <Fact label="Workload" value={leader.workloadLabel} />
                    <Fact label="Morale" value={leader.moraleLabel} />
                    <Fact label="Track record" value={leader.reliabilityLabel} />
                  </dl>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Strong on</p>
                      <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                        {leader.strengths.map((strength) => (
                          <li key={strength}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Watch for</p>
                      <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                        {leader.weaknesses.map((weakness) => (
                          <li key={weakness}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-ink-faint">
                    {plural(leader.running, 'assignment')} running · {leader.completed} delivered
                    {leader.late > 0 && ` · ${leader.late} late`}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="delegated">
        <SectionHeading><span id="delegated">Delegated work</span></SectionHeading>
        {view.assignments.length === 0 ? (
          <EmptyState
            title="Nothing delegated right now"
            description="You cannot do all of this yourself. Commission work from the Risk screen and choose who leads it."
          />
        ) : (
          <ul className="space-y-2">
            {view.assignments.map((assignment) => (
              <li key={assignment.id}>
                <Card>
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-ink-muted">Led by {assignment.leaderName}</p>
                    </div>
                    <Badge tone="neutral" glyph={false}>
                      {assignment.daysRemaining <= 0 ? 'Due today' : `${assignment.daysRemaining}d left`}
                    </Badge>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
