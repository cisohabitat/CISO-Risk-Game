/**
 * Where the three clocks meet.
 *
 * The business date, the programme that would cover it and the risk already
 * raised against it were each visible on their own screen, which left the
 * player to notice for themselves that the control arrives after the launch.
 * This says it in one line, which is the decision the job actually turns on:
 * what do you do in the gap?
 */
import { Badge, Button, Card, CardBody, SectionHeading } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { collisions, type CollisionView } from '@/store/selectors'
import { plural } from '@/lib/formatting/labels'

function verdictLine(collision: CollisionView): { tone: 'severe' | 'high' | 'elevated' | 'low'; text: string } {
  switch (collision.verdict) {
    case 'covered':
      return {
        tone: 'low',
        text: `${collision.programmeName} should have this covered before the date.`,
      }
    case 'close':
      return {
        tone: 'elevated',
        text: `${collision.programmeName} is running close to the date. ${collision.milestoneName} may not land in time.`,
      }
    case 'too-late':
      return {
        tone: 'high',
        text: `${collision.programmeName} will not reach ${collision.milestoneName} before the date. The business will arrive first.`,
      }
    case 'not-started':
      return {
        tone: 'severe',
        text: `${collision.programmeName} would cover this and has not been started.`,
      }
    default:
      return { tone: 'high', text: 'No programme you could run covers what this depends on.' }
  }
}

export function Collisions({ limit = 2 }: { limit?: number }) {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const setScreen = useGameStore((store) => store.setScreen)
  const setUi = useGameStore((store) => store.setUi)
  if (!state) return null

  // Only the ones where something is actually going to be missed: a collision
  // that resolves itself is not a collision, and saying so every day would
  // teach the player to stop reading this.
  const pressing = collisions(state, index).filter((collision) => collision.verdict !== 'covered')
  if (pressing.length === 0) return null

  return (
    <section aria-labelledby="collisions">
      <SectionHeading><span id="collisions">What is about to collide</span></SectionHeading>
      <ul className="space-y-3">
        {pressing.slice(0, limit).map((collision) => {
          const verdict = verdictLine(collision)
          return (
            <li key={collision.objectiveId}>
              <Card>
                <CardBody className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={verdict.tone} glyph={false}>
                      {collision.daysUntilTarget === 0
                        ? 'Due today'
                        : plural(collision.daysUntilTarget, 'day', 'days')}
                    </Badge>
                    <h3 className="font-medium text-balance">{collision.objectiveName}</h3>
                  </div>
                  <p className="text-sm text-ink-muted text-pretty">{verdict.text}</p>
                  {collision.exposedRisks.length > 0 && (
                    <p className="text-sm text-ink-faint text-pretty">
                      You have already raised{' '}
                      {collision.exposedRisks.slice(0, 2).map((risk) => risk.title).join(' and ')} against what this
                      depends on.
                    </p>
                  )}
                  {collision.ownerName && (
                    <p className="text-xs text-ink-faint">{collision.ownerName} owns the date.</p>
                  )}
                  {/*
                    Ways into the decision, not a new mechanic: naming a problem
                    and leaving the player to find the screen it lives on is
                    half a feature.
                  */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {collision.programmeId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setUi({ selectedProgrammeId: collision.programmeId })
                          setScreen('programmes')
                        }}
                      >
                        Open {collision.programmeName}
                      </Button>
                    )}
                    {collision.exposedRisks[0] && (
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => {
                          setUi({ selectedScenarioId: collision.exposedRisks[0]!.id })
                          setScreen('risk')
                        }}
                      >
                        See the risk
                      </Button>
                    )}
                    <Button variant="quiet" size="sm" onClick={() => setScreen('board')}>
                      Talk to the business
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
