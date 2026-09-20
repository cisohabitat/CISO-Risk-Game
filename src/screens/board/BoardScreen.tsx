/**
 * Board and executives (plan §19, §28.7). Relationships are shown as bands and
 * in the executives' own words; quarterly preparation is an exercise in what to
 * put in front of people, not in writing a document.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { stakeholderViews } from '@/store/selectors'
import { materialTopics } from '@/game/debrief/review'
import { plural, relationshipTone } from '@/lib/formatting/labels'
import { cn } from '@/lib/utils/cn'

export function BoardScreen() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const dispatch = useGameStore((store) => store.dispatch)
  const [preparing, setPreparing] = useState(false)
  const [topics, setTopics] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [uncertainty, setUncertainty] = useState(true)

  const people = useMemo(() => (state ? stakeholderViews(state, index) : []), [state, index])
  const availableTopics = useMemo(() => (state ? materialTopics(state, index) : []), [state, index])
  // Why a risk the player can see is not on the agenda: it has not been raised.
  const emergingCount = state ? Object.values(state.risks.scenarios).filter((s) => s.status === 'emerging').length : 0
  if (!state) return null

  const pendingQuarter = state.reviews.pendingQuarter

  const submit = () => {
    if (pendingQuarter === undefined) return
    const result = dispatch({
      type: 'completeQuarterReview',
      quarter: pendingQuarter,
      topics,
      recommendations,
      communicateUncertainty: uncertainty,
    })
    if (result.ok) {
      setPreparing(false)
      setTopics([])
      setRecommendations([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl leading-tight">Board and executives</h1>
        {pendingQuarter !== undefined && (
          <Button variant="primary" onClick={() => setPreparing(true)}>
            Prepare the Q{pendingQuarter} board paper
          </Button>
        )}
      </div>

      {pendingQuarter !== undefined && (
        <Card className="border-brass/50 bg-brass-soft/40">
          <CardBody>
            <p className="font-medium">The risk committee meets this quarter.</p>
            <p className="mt-1 text-sm text-ink-muted text-pretty">
              Choose what goes in front of them. Leaving out something material does more damage than bringing bad news.
            </p>
          </CardBody>
        </Card>
      )}

      <section aria-labelledby="people">
        <SectionHeading><span id="people">Where you stand</span></SectionHeading>
        <ul className="grid gap-3 lg:grid-cols-2">
          {people.map((person) => (
            <li key={person.id}>
              <Card className="h-full">
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{person.name}</h3>
                      <p className="text-sm text-ink-muted">{person.role}</p>
                    </div>
                    <Badge tone={relationshipTone(person.band)} glyph={false}>{person.band}</Badge>
                  </div>
                  <p className="text-sm italic text-ink-faint text-pretty">{person.voice}</p>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">What they care about</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                      {person.priorities.map((priority) => (
                        <li key={priority}>{priority}</li>
                      ))}
                    </ul>
                  </div>
                  {person.concerns.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">On their mind</p>
                      <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                        {person.concerns.map((concern) => (
                          <li key={concern}>{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {person.memory.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">They remember</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {person.memory.map((memory, position) => (
                          <li key={`${memory.day}-${position}`} className="flex gap-2">
                            <span
                              aria-hidden="true"
                              className={
                                memory.sentiment === 'positive'
                                  ? 'text-positive'
                                  : memory.sentiment === 'negative'
                                    ? 'text-band-high'
                                    : 'text-ink-faint'
                              }
                            >
                              {memory.sentiment === 'positive' ? '+' : memory.sentiment === 'negative' ? '−' : '·'}
                            </span>
                            <span className="text-ink-muted text-pretty">{memory.summary}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    {(['listen', 'brief', 'press'] as const).map((approach) => (
                      <Button
                        key={approach}
                        variant="quiet"
                        size="sm"
                        className="compact min-h-9"
                        onClick={() => dispatch({ type: 'meetStakeholder', stakeholderId: person.id, approach })}
                      >
                        {approach === 'listen' ? 'Listen' : approach === 'brief' ? 'Brief them' : 'Press for a commitment'}
                      </Button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {state.reviews.quarters.length > 0 && (
        <section aria-labelledby="past">
          <SectionHeading><span id="past">Previous board meetings</span></SectionHeading>
          <ul className="space-y-2">
            {state.reviews.quarters.map((quarter) => (
              <li key={quarter.quarter}>
                <Card>
                  <CardBody>
                    <p className="font-medium">Quarter {quarter.quarter}</p>
                    <p className="mt-1 text-sm text-ink-muted text-pretty">{quarter.boardReaction}</p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog
        open={preparing}
        onClose={() => setPreparing(false)}
        size="lg"
        title={`Board paper: quarter ${pendingQuarter ?? ''}`}
        description="Pick what the committee sees. They will find out about the rest another way."
        footer={
          <>
            <Button variant="quiet" onClick={() => setPreparing(false)}>Cancel</Button>
            <Button variant="primary" onClick={submit}>Take it to the board</Button>
          </>
        }
      >
        <div className="space-y-5">
          {availableTopics.length === 0 ? (
            <EmptyState
              title="You have nothing to report"
              description="You have not assessed a risk, run an incident or had an assumption fail. That is itself something the board may ask about."
            />
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">Agenda</legend>
              {emergingCount > 0 && (
                <p className="mb-3 text-sm text-ink-muted">
                  {plural(emergingCount, 'risk is', 'risks are')} emerging and not on the agenda: the board hears about
                  risks you have raised, and an emerging one is raised from the Risk screen.
                </p>
              )}
              <div className="space-y-2">
                {availableTopics.map((topic) => {
                  const active = topics.includes(topic.id)
                  return (
                    <label
                      key={topic.id}
                      className={cn(
                        'flex cursor-pointer gap-3 rounded-lg border p-3 text-sm',
                        active ? 'border-accent bg-accent-soft/30' : 'border-line bg-surface-2',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() =>
                          setTopics((current) => (active ? current.filter((id) => id !== topic.id) : [...current, topic.id]))
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                        style={{ minHeight: 0 }}
                      />
                      <span className="text-pretty">{topic.label}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Recommendations
            </legend>
            <div className="flex flex-wrap gap-2">
              {index.content.programmes.map((programme) => {
                const id = `programme:${programme.id}`
                const active = recommendations.includes(id)
                return (
                  <button
                    key={programme.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setRecommendations((current) => (active ? current.filter((value) => value !== id) : [...current, id]))
                    }
                    className={cn(
                      'compact min-h-10 rounded-full border px-3 py-1.5 text-sm',
                      active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface-2 text-ink-muted',
                    )}
                  >
                    {programme.shortName}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface-2 p-3">
            <input
              type="checkbox"
              checked={uncertainty}
              onChange={(event) => setUncertainty(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
              style={{ minHeight: 0 }}
            />
            <span>
              <span className="block text-sm font-medium">Be explicit about what you do not yet know</span>
              <span className="mt-0.5 block text-sm text-ink-muted text-pretty">
                Honest uncertainty, communicated well, tends to build more credibility than confidence you cannot support.
              </span>
            </span>
          </label>
        </div>
      </Dialog>
    </div>
  )
}
