/**
 * Board and executives (plan §19, §28.7). Relationships are shown as bands and
 * in the executives' own words; quarterly preparation is an exercise in what to
 * put in front of people, not in writing a document.
 */
import { RiskAppetite } from '@/components/game/RiskAppetite'
import { useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, Disclosure, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { stakeholderViews, visibleRisks } from '@/store/selectors'
import { materialTopics } from '@/game/debrief/quarter'
import { formatGameDate } from '@/game/time'
import { DAYS_PER_QUARTER } from '@/game/types'
import { bandTone, plural } from '@/lib/formatting/labels'
import { RISK_BAND_LABEL } from '@/game/risk/bands'
import { Icon } from '@/components/ui/icons'
import { PersonPortrait, RelationshipScale } from '@/components/game/Person'
import { cn } from '@/lib/utils/cn'
import { FOCUS_COSTS } from '@/game/engine/orchestrator'
import { NexoraMark } from '@/components/game/NexoraMark'

export function BoardScreen() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const draft = useGameStore((store) => store.ui.boardDraft)
  const [preparing, setPreparing] = useState(Boolean(draft && draft.quarter === state?.reviews.pendingQuarter))
  const [topics, setTopics] = useState<string[]>(draft?.quarter === state?.reviews.pendingQuarter ? draft?.topics ?? [] : [])
  const [recommendations, setRecommendations] = useState<string[]>(draft?.quarter === state?.reviews.pendingQuarter ? draft?.recommendations ?? [] : [])
  const [omissionsAcknowledged, setOmissionsAcknowledged] = useState<string>('')
  const [reviewOmissions, setReviewOmissions] = useState(false)
  const omissionHeading = useRef<HTMLHeadingElement>(null)
  const [uncertainty, setUncertainty] = useState(draft?.quarter === state?.reviews.pendingQuarter ? draft?.uncertainty ?? true : true)

  const people = useMemo(() => (state ? stakeholderViews(state, index) : []), [state, index])
  const availableTopics = useMemo(() => (state ? materialTopics(state, index) : []), [state, index])
  // What the player has assessed each risk at, beside it on the agenda. Seven
  // identical rows meant choosing what the board hears from memory of
  // another screen.
  const riskBands = useMemo(
    () => new Map((state ? visibleRisks(state, index) : []).map((risk) => [`risk:${risk.id}`, risk.band])),
    [state, index],
  )
  // Why a risk the player can see is not on the agenda: it has not been raised.
  const emergingRisks = state ? Object.values(state.risks.scenarios).filter((s) => s.status === 'emerging').flatMap((risk) => { const def = index.riskScenario.get(risk.id); return def ? [{ id: risk.id, title: def.title }] : [] }) : []
  const emergingCount = emergingRisks.length
  const omitted = availableTopics.filter((topic) => topic.material && !topics.includes(topic.id))
  const omissionKey = `${state?.reviews.pendingQuarter}:${omitted.map((topic) => topic.id).sort().join('|')}`
  if (!state) return null

  const pendingQuarter = state.reviews.pendingQuarter

  const reviewRisks = () => {
    if (pendingQuarter === undefined) return
    useGameStore.getState().setUi({ boardDraft: { quarter: pendingQuarter, topics, recommendations, uncertainty }, riskTab: 'risks' })
    setPreparing(false)
    useGameStore.getState().setScreen('risk')
  }

  const closePaper = () => {
    useGameStore.getState().setUi({ boardDraft: undefined })
    setPreparing(false)
  }

  const submit = () => {
    if (pendingQuarter === undefined) return
    if (omitted.length > 0 && omissionsAcknowledged !== omissionKey) {
      setReviewOmissions(true)
      requestAnimationFrame(() => { omissionHeading.current?.focus(); omissionHeading.current?.scrollIntoView({ block: 'center' }) })
      return
    }
    const result = dispatch({
      type: 'completeQuarterReview',
      quarter: pendingQuarter,
      topics,
      recommendations,
      communicateUncertainty: uncertainty,
    })
    if (result.ok) {
      useGameStore.getState().setUi({ boardDraft: undefined })
      setPreparing(false)
      setTopics([])
      setRecommendations([])
    }
  }

  return (
    <div className="governance-workspace space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="document-kicker">Nexora Group · Governance</p>
          <h1 className="mt-2 font-display text-3xl leading-tight">Board and executives</h1>
        </div>
        {pendingQuarter !== undefined && (
          <Button variant="primary" onClick={() => { dispatch({ type: 'setSpeed', speed: 'paused' }); setPreparing(true) }}>
            Prepare the Q{pendingQuarter} board paper
            <span className="font-normal opacity-80"> · {FOCUS_COSTS.boardPreparation} attention</span>
          </Button>
        )}
      </div>

      {pendingQuarter !== undefined && (
        <Card className="committee-brief">
          <CardBody>
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
              <div className="flex items-center gap-3"><NexoraMark /><p className="document-kicker">Board Risk Committee</p></div>
              <span className="font-display text-3xl text-ink-muted">Q{pendingQuarter}</span>
            </div>
            <p className="font-medium">Q{pendingQuarter} results, presented during Q{Math.min(4, pendingQuarter + 1)}.</p>
            <p className="mt-1 text-sm text-ink-muted text-pretty">
              Choose what goes in front of them. Leaving out something material does more damage than bringing bad news.
            </p>
            <p className="mt-1 text-sm text-ink-muted text-pretty" data-testid="paper-deadline">
              Write it by {formatGameDate((pendingQuarter + 1) * DAYS_PER_QUARTER - 1).label}. After that the committee meets without it, and notices.
            </p>
          </CardBody>
        </Card>
      )}

      <RiskAppetite />
      <Disclosure summary="Governance correspondence: insurance, appetite and intelligence">
        <p className="text-sm">Use the reports already received when preparing the paper. A report or recommendation does not itself buy cover, change policy or commission a test.</p>
        {state.inbox.messages.filter((message) => message.eventId && index.event.get(message.eventId)?.boardReference).length === 0 ? <p className="mt-2 text-sm">No correspondence in these categories has been received yet.</p> : <ul className="mt-2 space-y-2">{state.inbox.messages.filter((message) => message.eventId && index.event.get(message.eventId)?.boardReference).map((message) => <li key={message.id}><Button variant="quiet" size="sm" onClick={() => { useGameStore.getState().setUi({ selectedMessageId: message.id }); useGameStore.getState().setScreen('inbox') }}>{message.subject}</Button></li>)}</ul>}
      </Disclosure>
      <section aria-labelledby="people">
        <SectionHeading><span id="people">Where you stand</span></SectionHeading>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {people.map((person) => (
            <li key={person.id}>
              <Card className="person-dossier h-full">
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PersonPortrait id={person.id} name={person.name} size="large" />
                      <div className="min-w-0">
                        <h3 className="font-display text-xl leading-tight">{person.name}</h3>
                        <p className="text-sm text-ink-muted">{person.role}</p>
                      </div>
                    </div>
                    <RelationshipScale band={person.band} />
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    {(['listen', 'brief', 'press'] as const).map((approach) => (
                      <Button
                        key={approach}
                        variant="quiet"
                        size="sm"
                        className="compact min-h-9"
                        aria-label={`${approach === 'listen' ? 'Listen' : approach === 'brief' ? 'Brief them' : 'Press for a commitment'}: ${person.name}, ${FOCUS_COSTS.executiveIntervention} attention`}
                        onClick={() => dispatch({ type: 'meetStakeholder', stakeholderId: person.id, approach })}
                      >
                        {approach === 'listen' ? 'Listen' : approach === 'brief' ? 'Brief them' : 'Press for a commitment'}
                        {/* Every meeting spends attention and no button said so (AI tablet playtest). */}
                        <span className="font-normal opacity-80"> · {FOCUS_COSTS.executiveIntervention} attention</span>
                      </Button>
                    ))}
                  </div>
                  <Disclosure summary={`Profile and history: ${person.name}`}>
                    <div className="space-y-3">
                      <p className="text-sm italic text-ink-faint text-pretty">{person.voice}</p>
                      <div>
                        <p className="text-xs font-medium text-ink-faint">What they care about</p>
                        <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                          {person.priorities.map((priority) => (
                            <li key={priority}>{priority}</li>
                          ))}
                        </ul>
                      </div>
                      {person.concerns.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-ink-faint">On their mind</p>
                          <ul className="mt-1 space-y-0.5 text-sm text-ink-muted">
                            {person.concerns.map((concern) => (
                              <li key={concern}>{concern}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {person.memory.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-ink-faint">They remember</p>
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

                    </div>
                  </Disclosure>
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
                <div className="record-row sm:grid sm:grid-cols-[8rem_1fr] sm:gap-4">
                    <p className="font-medium">Quarter {quarter.quarter}</p>
                    <p className="mt-1 text-sm text-ink-muted text-pretty">{quarter.boardReaction}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog
        open={preparing}
        onClose={closePaper}
        size="lg"
        title={`Board paper: quarter ${pendingQuarter ?? ''}`}
        descriptionInBody
        description="Pick what the committee sees. It expects every risk rated high or with a high consequence, every risk accepted on its behalf, any incident or failed assumption it has not yet been told about, a programme blocked on an unresolved dependency, and a team past its limit. The rest is your call."
        footer={
          <>
            <Button variant="quiet" onClick={closePaper}>Cancel</Button>
            <Button variant="primary" onClick={submit}>Take it to the board</Button>
          </>
        }
      >
        <div className="board-paper space-y-6">
          <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-5">
            <div><p className="document-kicker">Nexora Group</p><p className="mt-2 font-display text-2xl">Board Risk Committee</p><p className="mt-1 text-sm text-ink-muted">Management paper</p></div>
            <span aria-hidden="true" className="font-display text-5xl text-ink-faint">Q{pendingQuarter}</span>
          </header>
          <dl className="paper-dates grid grid-cols-2 gap-4 border-b border-line pb-5 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-ink-faint">Reporting period</dt><dd className="mt-1 font-medium">Q{pendingQuarter} results · presented in Q{Math.min(4, (pendingQuarter ?? 0) + 1)}</dd></div>
            <div><dt className="text-xs text-ink-faint">Prepared</dt><dd className="mt-1 font-medium">{formatGameDate(state.currentDay).label}</dd></div>
            <div className="col-span-2 sm:col-span-1"><dt className="text-xs text-ink-faint">Submit by</dt><dd className="mt-1 font-medium">{formatGameDate(((pendingQuarter ?? 0) + 1) * DAYS_PER_QUARTER - 1).label}</dd></div>
          </dl>
          <p className="text-sm text-ink-muted">Choose the agenda, programme recommendations and uncertainties you will disclose. Submitting records the paper and returns the committee’s response; recommendations do not start programmes automatically.</p>
          {omitted.length > 0 && reviewOmissions && <section className="rounded-lg border border-band-high/50 bg-band-high-soft p-3" aria-label="Material omissions" role={reviewOmissions ? 'alert' : undefined}>
            <h2 ref={omissionHeading} tabIndex={-1} className="font-medium">{plural(omitted.length, 'material item')} not selected</h2>
            <p className="mt-2 text-sm">The board will not hear these items. Omitting material information affects its confidence; a draft is not a submitted paper.</p>
            <ul className="mt-2 list-disc pl-5 text-sm">{omitted.map((topic) => <li key={topic.id}>{topic.label}</li>)}</ul>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setTopics((current) => [...new Set([...current, ...omitted.map((topic) => topic.id)])])}>Include all material items</Button>
            <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={omissionsAcknowledged === omissionKey} onChange={(event) => setOmissionsAcknowledged(event.target.checked ? omissionKey : '')} />I understand and deliberately omit these items</label>
          </section>}
          {availableTopics.length === 0 ? (
            <EmptyState
              title="No agenda topics are eligible yet"
              description="The agenda draws on raised risks, incidents, failed assumptions, off-track programmes and a team beyond its workload limit. Completed checks and low morale alone do not add an agenda item. Programme recommendations remain available below. Open Risk to assess or raise a risk for the paper."
              action={<Button variant="secondary" size="sm" onClick={reviewRisks}>Review risks for the paper</Button>}
            />
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint"><span aria-hidden="true" className="paper-number">01</span>Agenda</legend>
              <p className="mb-3 text-sm text-ink-muted">Evidence for the committee to consider.</p>
              {emergingCount > 0 && (
                <p className="mb-3 text-sm text-ink-muted">
                  {plural(emergingCount, 'risk is', 'risks are')} emerging and not on the agenda: the board hears about
                  risks you have raised, and an emerging one is raised from the Risk screen. This count does not include the raised risks listed below.
                </p>
              )}
              {emergingCount > 0 && <Disclosure summary="Which risks are still emerging?"><ul className="list-disc pl-5">{emergingRisks.map((risk) => <li key={risk.id}>{risk.title}</li>)}</ul></Disclosure>}
              {emergingCount > 0 && <Button variant="secondary" size="sm" className="mb-3" onClick={reviewRisks}>Review emerging risks and return to this draft</Button>}
              <div className="space-y-2">
                {availableTopics.map((topic) => {
                  const active = topics.includes(topic.id)
                  return (
                    <label
                      key={topic.id}
                      className={cn(
                        'board-agenda-row flex cursor-pointer flex-wrap gap-3 border-b border-line px-2 py-4 text-sm',
                        active ? 'bg-accent-soft/30' : 'hover:bg-surface-2',
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
                      <span className="min-w-[8rem] flex-1 text-pretty">{topic.label}<span className="mt-1 block text-xs text-ink-muted">{topic.material ? 'Required: material to this committee' : 'Optional update'}</span>{state.reviews.quarters.some((paper) => paper.completed && paper.topicsChosen.includes(topic.id)) && <span className="mt-1 block text-xs text-ink-muted">Previously reported; still available for this paper</span>}</span>
                      {riskBands.has(topic.id) ? (
                        <Badge tone={bandTone(riskBands.get(topic.id)!)} className="shrink-0 self-start">
                          {RISK_BAND_LABEL[riskBands.get(topic.id)!]} residual
                        </Badge>
                      ) : topic.id.startsWith('incident:') ? (
                        <Badge tone="high" glyph={false} className="shrink-0 self-start">Incident</Badge>
                      ) : null}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              <span aria-hidden="true" className="paper-number">02</span>
              Recommendations
            </legend>
            {/* Pills read as tags. Each says whether it is in the paper: a
                tick when it is, a plus when it could be. */}
            <p className="mb-2 text-sm text-ink-muted">What the paper asks the board to back. Choose any.</p>
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
                      'compact inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm',
                      active
                        ? 'border-accent bg-accent-soft font-medium text-accent-ink'
                        : 'border-dashed border-line-strong bg-surface text-ink-muted hover:text-ink',
                    )}
                  >
                    <Icon name={active ? 'check' : 'plus'} size={14} />
                    {programme.shortName}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-3 border-y border-line bg-surface-2 p-4">
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
          <section aria-labelledby="paper-submission" className="paper-submission border-t-2 border-ink pt-5">
            <h3 id="paper-submission" className="document-kicker"><span aria-hidden="true" className="paper-number">03</span>Your submission</h3>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div><dt className="text-ink-faint">Agenda topics</dt><dd className="mt-1 font-medium">{topics.length} selected</dd></div>
              <div><dt className="text-ink-faint">Programme recommendations</dt><dd className="mt-1 font-medium">{recommendations.length} selected</dd></div>
              <div><dt className="text-ink-faint">Uncertainty</dt><dd className="mt-1 font-medium">{uncertainty ? 'Explicitly acknowledged' : 'Not acknowledged'}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-ink-muted">Prepared by the Office of the CISO · For committee consideration</p>
          </section>
        </div>
      </Dialog>
    </div>
  )
}
