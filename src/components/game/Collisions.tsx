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
import { useCampaignIndex, useGameStore } from '@/store/game-store'
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

/**
 * The race, drawn.
 *
 * Two tracks on one scale: the business date, which is a commitment and can be
 * stated exactly, and the covering milestone, which is a projection off the
 * rate the programme has actually managed. The second is a band rather than a
 * point on purpose — staffing, blockers and whatever the player does next all
 * move it, and drawing it as a tick would assert a date the game cannot stand
 * behind. The gap is shown as distance and named in words, never as a number of
 * days nobody could promise.
 */
function Race({ collision, tone }: { collision: CollisionView; tone: 'severe' | 'high' | 'elevated' | 'low' }) {
  const target = Math.max(collision.daysUntilTarget, 1)
  // The scale runs to whichever arrives last, with room so a band at the end is
  // still visibly inside the track.
  const scale = Math.max(target, collision.daysToMilestone ?? target * 1.6) * 1.15
  const businessAt = (target / scale) * 100

  // Never started: there is no rate to project from, so the band is the whole
  // stretch after the date rather than a guess at where it would land.
  const projected = collision.daysToMilestone
  const bandCentre = projected === undefined ? undefined : (projected / scale) * 100
  const bandWidth = 18

  return (
    <div className="space-y-1.5 rounded-lg bg-surface-2 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-ink-faint">The business</span>
        <span className="text-xs font-medium tabular-nums">
          {collision.daysUntilTarget === 0 ? 'today' : plural(collision.daysUntilTarget, 'day', 'days')}
        </span>
      </div>
      <div className="relative h-2.5">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
        <span
          className="absolute top-1/2 h-2.5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
          style={{ left: `${businessAt}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between gap-2 pt-1">
        <span className="truncate text-xs font-medium text-ink-faint">
          {collision.programmeName ?? 'No programme'}
        </span>
        <span className="text-xs font-medium">
          {projected === undefined ? 'not started' : 'on this rate'}
        </span>
      </div>
      <div className="relative h-2.5">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        {bandCentre === undefined ? (
          <span
            className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full border border-dashed"
            style={{
              left: `${businessAt}%`,
              right: '0%',
              borderColor: `var(--band-${tone})`,
            }}
          />
        ) : (
          <span
            className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full opacity-70"
            style={{
              left: `${Math.max(0, bandCentre - bandWidth / 2)}%`,
              width: `${bandWidth}%`,
              background: `var(--band-${tone})`,
            }}
          />
        )}
      </div>
      {/* The verdict in words, because the bands carry no number and the
          colour is never the only thing saying which way this goes. */}
      <p className="pt-0.5 text-xs font-medium" style={{ color: `var(--band-${tone})` }}>
        {collision.verdict === 'close'
          ? 'Arrives about the same time — it may not land first'
          : collision.verdict === 'too-late'
            ? 'Arrives after the business does'
            : collision.verdict === 'not-started'
              ? 'Nothing is running, so nothing arrives'
              : 'Arrives before the date'}
      </p>
    </div>
  )
}

export function Collisions({ limit = 2 }: { limit?: number }) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
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
                  <Race collision={collision} tone={verdict.tone} />
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
                      {/* Named, because the date belongs to a person rather than
                          to "the business", and that is who has to be talked to. */}
                      {collision.ownerName ? `Talk to ${collision.ownerName.split(' ')[0]}` : 'Talk to the business'}
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
