/**
 * A risk scenario, and what the CISO can do about it: treat it, accept it with
 * recorded assumptions, or give it to an executive to own (plan §12.3, §13).
 */
import { useEffect, useRef, useState } from 'react'
import { detailIsBelowTheList } from '@/lib/layout/stacked'
import { Badge, Button, Card, CardBody, Dialog, Fact, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { Terms } from '@/components/game/Terms'
import type { VisibleRisk } from '@/store/selectors'
import { RISK_BAND_LABEL } from '@/game/risk/bands'
import { bandTone, confidenceTone, statusLabel } from '@/lib/formatting/labels'
import { cn } from '@/lib/utils/cn'

export function RiskDetail({ risk, onClose }: { risk: VisibleRisk; onClose: () => void }) {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const [accepting, setAccepting] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [assumptions, setAssumptions] = useState<string[]>([])
  const [days, setDays] = useState(90)
  const panel = useRef<HTMLElement>(null)

  // Under the list on a phone, a chosen risk's detail was after every card,
  // and choosing one seemed to do nothing. Go to it.
  useEffect(() => {
    if (!detailIsBelowTheList()) return
    panel.current?.focus({ preventScroll: true })
    panel.current?.scrollIntoView?.({ block: 'start' })
  }, [risk.id])

  if (!state) return null
  const def = index.riskScenario.get(risk.id)
  if (!def) return null
  const runtime = state.risks.scenarios[risk.id]
  const programmes = def.treatmentProgrammeIds
    .map((id) => ({ id, def: index.programme.get(id), runtime: state.programmes.programmes[id] }))
    .filter((entry) => entry.def && entry.runtime)
  // The programme a link would point at: one running now before one already
  // finished. Two second-year playtesters could link supplier ransomware only
  // to last year's finished identity programme, never to the ransomware
  // programme they had just started.
  const running = (status?: string) => status === 'active' || status === 'at-risk'
  const treating =
    programmes.find((entry) => running(entry.runtime?.status)) ??
    programmes.find((entry) => entry.runtime?.status !== 'proposed')
  // What it was last linked to, as the risk's own notes record it.
  const linkedTo =
    risk.status === 'treated'
      ? runtime?.notes.find((note) => note.startsWith('Treatment: '))?.slice('Treatment: '.length, -1)
      : undefined
  const linkedProgramme = linkedTo ? programmes.find((entry) => entry.def!.name === linkedTo && entry.runtime?.status !== 'proposed') : undefined

  const accept = () => {
    const result = dispatch({
      type: 'acceptRisk',
      scenarioId: risk.id,
      rationaleTagIds: tags,
      assumptionDefIds: assumptions,
      days,
    })
    if (result.ok) {
      setAccepting(false)
      setTags([])
      setAssumptions([])
    }
  }

  return (
    <section ref={panel} tabIndex={-1} aria-label={def.title} className="outline-none lg:sticky lg:top-24">
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone={bandTone(risk.band)}>{RISK_BAND_LABEL[risk.band]} residual</Badge>
            <Badge tone={confidenceTone(risk.confidence)} glyph={false}>{risk.confidence} confidence</Badge>
            <Badge tone="neutral" glyph={false}>{statusLabel(risk.status)}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="compact min-h-9 px-2.5 lg:hidden" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-balance">{risk.title}</h2>
          <p className="mt-1 text-sm text-ink-muted text-pretty">{risk.statement}</p>
          <Terms text={`${risk.title} ${risk.statement}`} className="mt-2" />
          {risk.trend && (
            <p className="mt-2 text-sm text-ink-muted">
              {risk.trend.charAt(0).toUpperCase() + risk.trend.slice(1)} since it was first assessed.
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Fact label="Exposure" value={RISK_BAND_LABEL[risk.exposureBand]} />
          <Fact label="Consequence" value={RISK_BAND_LABEL[risk.consequenceBand]} />
          <Fact label="Owner" value={`${risk.ownerName}${risk.ownerRole ? ` (${risk.ownerRole})` : ''}`} />
          <Fact
            label="Next review"
            value={risk.reviewDue ? 'Due now' : `in ${risk.daysUntilReview} days`}
            hint={risk.hasInvalidatedAssumption ? 'An assumption behind this no longer holds.' : undefined}
          />
        </dl>

        {def.consequences.length > 0 && (
          <div>
            <SectionHeading>If it happened</SectionHeading>
            <ul className="space-y-1 text-sm text-ink-muted">
              {def.consequences.map((consequence) => (
                <li key={consequence} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  <span className="text-pretty">{consequence}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {risk.affectedServices.length > 0 && (
          <Fact label="Services affected" value={risk.affectedServices.join(', ')} />
        )}

        {runtime && runtime.assumptionIds.length > 0 && (
          <div>
            <SectionHeading>Assumptions behind this</SectionHeading>
            <ul className="space-y-1 text-sm">
              {runtime.assumptionIds.map((id) => {
                const assumption = state.assumptions.assumptions[id]
                if (!assumption) return null
                return (
                  <li key={id} className="flex gap-2">
                    <Badge tone={assumption.status === 'invalidated' ? 'high' : assumption.status === 'uncertain' ? 'elevated' : 'low'} glyph={false}>
                      {statusLabel(assumption.status)}
                    </Badge>
                    <span className="text-pretty">{assumption.statement}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {risk.reviewDue && risk.status !== 'closed' && (
          <p className="border-t border-line pt-4 text-sm text-ink-muted text-pretty">
            A review is a decision about this risk: accept it for a stated period, or link it to the programme
            that treats it. Either sets the next review.
          </p>
        )}

        <div className={cn('flex flex-wrap gap-2', !(risk.reviewDue && risk.status !== 'closed') && 'border-t border-line pt-4')}>
          {risk.status === 'emerging' && (
            <Button variant="primary" size="sm" onClick={() => dispatch({ type: 'openRisk', scenarioId: risk.id })}>
              {/* One verb for one act: the board paper says a risk is raised,
                  and this said "open", which a playtester did not connect. */}
              Raise as a risk scenario
            </Button>
          )}
          {(risk.status === 'open' || risk.status === 'emerging') && (
            <Button variant="secondary" size="sm" onClick={() => setAccepting(true)}>
              Accept for now
            </Button>
          )}
          {/* Linking a risk already linked did nothing a player could see (harbour-87524, day 91). */}
          {treating && risk.status !== 'closed' && treating.def!.name !== linkedTo && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: 'treatRisk', scenarioId: risk.id, programmeId: treating.id })}
            >
              Link to {treating.def!.name}
            </Button>
          )}
        </div>
        {linkedTo && <p className="text-sm text-ink-muted text-pretty">Linked to {linkedTo}.</p>}
        {/* A review due on a linked risk had nothing to press: the panel asked
            for "accept it … or link it" and the link was already made (AI
            tablet playtest). Confirming the link is the review. */}
        {linkedProgramme && risk.reviewDue && risk.status !== 'closed' && (
          <Button
            variant="secondary"
            size="sm"
            className="compact min-h-9"
            onClick={() => dispatch({ type: 'treatRisk', scenarioId: risk.id, programmeId: linkedProgramme.id })}
          >
            Confirm it stays with {linkedProgramme.def!.shortName}
          </Button>
        )}
        {/* It offered "Link to treatment" and then refused: start the programme first. */}
        {!treating && programmes.length > 0 && risk.status !== 'closed' && (
          <p className="text-sm text-ink-muted text-pretty">
            Treated by {programmes.map((entry) => entry.def!.name).join(' or ')}, which {programmes.length === 1 ? 'has' : 'have'} not
            started.
          </p>
        )}

        <div>
          <SectionHeading>Give it an owner</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {index.content.stakeholders.slice(0, 5).map((person) => (
              <Button
                key={person.id}
                variant="quiet"
                size="sm"
                className="compact min-h-9"
                onClick={() => dispatch({ type: 'escalateRisk', scenarioId: risk.id, stakeholderId: person.id })}
              >
                {person.shortRole}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-faint text-pretty">
            Escalating a well-evidenced risk builds credibility. Escalating everything spends it.
          </p>
        </div>
      </CardBody>

      <Dialog
        open={accepting}
        onClose={() => setAccepting(false)}
        title="Accept this risk"
        description="Accepting is a legitimate decision. Recording what it depends on is what makes it a defensible one."
        footer={
          <>
            <Button variant="quiet" onClick={() => setAccepting(false)}>Cancel</Button>
            <Button variant="primary" disabled={tags.length === 0} onClick={accept}>Accept and record</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">Why</p>
            <div className="flex flex-wrap gap-2">
              {index.content.rationaleTags.map((tag) => {
                const active = tags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTags((current) => (active ? current.filter((id) => id !== tag.id) : [...current, tag.id]))}
                    className={cn(
                      'compact min-h-10 rounded-full border px-3 py-1.5 text-sm',
                      active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line bg-surface-2 text-ink-muted',
                    )}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              What are you assuming?
            </p>
            <p className="mb-2 text-sm text-ink-muted">
              The simulation will tell you if the world stops supporting one of these.
            </p>
            <div className="space-y-2">
              {index.content.assumptions.map((assumption) => {
                const active = assumptions.includes(assumption.id)
                return (
                  <label
                    key={assumption.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-3 text-sm',
                      active ? 'border-accent bg-accent-soft/30' : 'border-line bg-surface-2',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        setAssumptions((current) =>
                          active ? current.filter((id) => id !== assumption.id) : [...current, assumption.id],
                        )
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                      style={{ minHeight: 0 }}
                    />
                    <span className="text-pretty">{assumption.statement}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Revisit in
            </span>
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-base"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>Six months</option>
            </select>
          </label>
        </div>
      </Dialog>
    </Card>
    </section>
  )
}
