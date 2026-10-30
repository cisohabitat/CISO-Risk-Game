/**
 * Commissioning work (plan §2.4, §11). Information is a resource: every line of
 * enquiry costs attention, capacity and sometimes money, and who you give it to
 * changes what comes back.
 */
import { useState } from 'react'
import { CapacityNotice } from '@/components/game/CapacityNotice'
import { Terms } from '@/components/game/Terms'
import { Badge, Button, Card, CardBody, Dialog, Disclosure, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { enquirySpeaksTo, topConcerns } from '@/store/selectors'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { ENQUIRY_THEMES } from '@/game/types'
import { evaluateCondition } from '@/game/events/conditions'
import { availableCapacity, delegationOutlook, delegationQuality, leaderAsAssigned, teamStrain, type DelegationOutlook, outlookBecause } from '@/game/team/capacity'
import { money } from '@/lib/formatting/labels'
import { cn } from '@/lib/utils/cn'
import type { InvestigationDef } from '@/game/types'

const OUTLOOK: Record<DelegationOutlook, string> = {
  room: 'Has room for this.',
  busy: 'Busy, but could take this on.',
  partial: 'expect part of an answer.',
  thin: 'expect it to slip or come back thin.',
}

/** The outlook with its reason, where the reason is what holds it back. */
function outlookText(outlook: DelegationOutlook, because: string): string {
  return outlook === 'partial' || outlook === 'thin' ? `${because}: ${OUTLOOK[outlook]}` : OUTLOOK[outlook]
}

export function InvestigationPanel() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const [chosen, setChosen] = useState<InvestigationDef | undefined>()
  const [receipt, setReceipt] = useState<string>()
  const [leaderId, setLeaderId] = useState<string>('')
  const [overloadAccepted, setOverloadAccepted] = useState(false)
  const [showAll, setShowAll] = useState(false)

  if (!state) return null

  // What delegated work comes back with depends on the whole team, not just
  // how busy the one person leading it is.
  const strain = teamStrain(state)
  const assigned = chosen && leaderId && state.team.leaders[leaderId] ? leaderAsAssigned(state, state.team.leaders[leaderId]!, chosen.capacityPerDay) : undefined
  const overloadWarning = Boolean(assigned && (assigned.workload > 0.55 || strain > 0.7))
  const running = state.team.assignments.filter((assignment) => assignment.status === 'running')
  // Coached modes point at the enquiries that speak to the biggest thing on
  // the player's list; the others get the same connection without the badge.
  const coached = DIFFICULTY_PROFILES[state.difficulty].showsDecisionCoaching
  const topConcern = topConcerns(state, index, 1)[0]?.id
  const available = index.content.investigations.filter((investigation) => {
    if (investigation.requiresCondition && !evaluateCondition(state, index, investigation.requiresCondition)) return false
    if (!investigation.repeatable && state.team.assignments.some((a) => a.refId === investigation.id)) return false
    return true
  })

  const capacityShort = (investigation: InvestigationDef) =>
    Object.entries(investigation.capacityPerDay).some(
      ([fn, demand]) => (demand ?? 0) > availableCapacity(state, fn as never),
    )

  const affordable = available.filter((investigation) => !capacityShort(investigation) && state.resources.focusRemaining >= investigation.focusCost && state.resources.budgetRemaining >= investigation.budgetCost)
  const linked = affordable.filter((investigation) => topConcern && enquirySpeaksTo(state, index, investigation.id).some((risk) => risk.id === topConcern))
  const starter = [...new Map([...linked, ...affordable, ...available].map((investigation) => [investigation.id, investigation])).values()].slice(0, 3)
  const shown = coached && !showAll ? starter : available

  const start = () => {
    if (!chosen || !leaderId) return
    if (overloadWarning && !overloadAccepted) return
    const result = dispatch({ type: 'startInvestigation', investigationId: chosen.id, leaderId })
    if (result.ok) {
      setReceipt(result.message)
      setChosen(undefined)
      setLeaderId('')
    }
  }

  return (
    <div className="space-y-6">
      <CapacityNotice />
      {receipt && <p role="status" aria-label="Commission confirmation" className="rounded border border-line bg-surface-2 p-3 text-sm">{receipt} Work in progress below records the commission.</p>}
      <Disclosure summary="Completed and stopped enquiries">
        {state.team.assignments.filter((assignment) => assignment.status !== 'running').length === 0 ? <p className="text-sm">No enquiry has finished or been stopped yet.</p> : <ul className="space-y-4">{state.team.assignments.filter((assignment) => assignment.status !== 'running').slice().reverse().map((assignment) => <li key={assignment.id} className="text-sm"><h3 className="font-medium">{assignment.title} · {assignment.status === 'complete' ? 'Completed' : 'Stopped'}</h3><p className="mt-1 whitespace-pre-line">{assignment.resultSummary ?? 'Stopped before a report was delivered.'}</p>{assignment.status === 'complete' && <Button variant="quiet" size="sm" onClick={() => useGameStore.getState().setUi({ riskTab: 'evidence' })}>Review the evidence</Button>}</li>)}</ul>}
      </Disclosure>
      {running.length > 0 && (
        <section aria-labelledby="running-work">
          <SectionHeading><span id="running-work">Work in progress</span></SectionHeading>
          <ul className="space-y-2">
            {running.map((assignment) => {
              const def = index.investigation.get(assignment.refId)
              const leader = index.leader.get(assignment.leaderId)
              const daysLeft = Math.max(0, assignment.dueDay - state.currentDay)
              return (
                <li key={assignment.id}>
                  <Card>
                    <CardBody>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{assignment.title}</p>
                          <p className="mt-0.5 text-sm text-ink-muted text-pretty">
                            {def?.workingNarrative ?? ''} {leader ? `Led by ${leader.name}.` : ''}
                          </p>
                        </div>
                        <Badge tone="neutral" glyph={false}>
                          {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                        </Badge>
                      </div>
                    </CardBody>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="available-work">
        <SectionHeading><span id="available-work">Lines of enquiry</span></SectionHeading>
        <p className="mb-4 text-sm text-ink-muted">Commission a check to gather evidence before deciding what to do. Choose a leader, allow time for the work, then read the result in your Inbox and assess it in Risk.</p>
        <p className="mb-4 text-sm">Start with one question, not every enquiry. Choose one check that speaks to a concern you can explain, read its result, then decide what is still uncertain. The list is a menu, not a weekly checklist.</p>
        {coached && available.length > 3 && <div className="mb-4 text-sm"><p>{showAll ? 'The full menu is open.' : 'A short starting menu is shown. Affordable checks linked to your visible top concern come first; this does not establish which evidence will come back clean.'}</p><Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowAll((value) => !value)}>{showAll ? 'Return to starter view' : `Show all ${available.length} available enquiries`}</Button></div>}
        {available.length === 0 ? (
          <EmptyState
            title="Nothing left to commission"
            description="You have already asked for everything that is available to you right now."
          />
        ) : (
          ENQUIRY_THEMES.map((theme) => {
            const inTheme = shown.filter((investigation) => investigation.theme === theme.id)
            if (inTheme.length === 0) return null
            return (
          <section key={theme.id} aria-labelledby={`theme-${theme.id}`} className="mb-6 last:mb-0">
            <h3 id={`theme-${theme.id}`} className="mb-2 text-sm font-semibold text-ink-muted">{theme.label}</h3>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {inTheme.map((investigation) => {
              const speaksTo = enquirySpeaksTo(state, index, investigation.id)
              const onTopConcern = coached && topConcern !== undefined && speaksTo.some((r) => r.id === topConcern)
              const short = capacityShort(investigation)
              const noFocus = state.resources.focusRemaining < investigation.focusCost
              const noBudget = state.resources.budgetRemaining < investigation.budgetCost
              return (
                <li key={investigation.id}>
                  <Card className={cn('h-full', (short || noFocus || noBudget) && 'opacity-70')}>
                    <CardBody className="flex h-full flex-col">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-balance">{investigation.name}</h4>
                        {onTopConcern && <Badge tone="accent" glyph={false}>Speaks to your top concern</Badge>}
                      </div>
                      <p className="mt-1 flex-1 text-sm text-ink-muted text-pretty">{investigation.description}</p>
                      <Terms text={`${investigation.name} ${investigation.description}`} className="mt-2" />
                      {/* One risk to a line, as the programme cards list what
                          they treat: run together with semicolons in the
                          smallest type, three risk titles were unreadable. */}
                      {speaksTo.length > 0 && (
                        <div className="mt-2" data-testid="speaks-to">
                          <p className="text-xs text-ink-faint">Speaks to</p>
                          <ul className="mt-0.5 space-y-0.5 text-sm text-ink-muted">
                            {speaksTo.slice(0, 3).map((risk) => (
                              <li key={risk.id} className="flex gap-2">
                                <span aria-hidden="true" className="text-ink-faint">–</span>
                                <span className="text-pretty">{risk.title}</span>
                              </li>
                            ))}
                            {speaksTo.length > 3 && <li className="pl-4 text-xs text-ink-faint">and {speaksTo.length - 3} more</li>}
                          </ul>
                        </div>
                      )}
                      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                        <div className="flex gap-1">
                          <dt>Takes</dt>
                          <dd className="font-medium text-ink-muted">about {investigation.durationDays} days</dd>
                        </div>
                        <div className="flex gap-1">
                          <dt>Your attention</dt>
                          <dd className="font-medium text-ink-muted">{investigation.focusCost}</dd>
                        </div>
                        {investigation.budgetCost > 0 && (
                          <div className="flex gap-1">
                            <dt>Cost</dt>
                            <dd className="font-medium text-ink-muted">{money(investigation.budgetCost)}</dd>
                          </div>
                        )}
                      </dl>
                      {(short || noFocus || noBudget) && (
                        <p className="mt-2 text-xs text-band-elevated">
                          {short
                            ? 'The team it needs has no spare capacity.'
                            : noFocus
                              ? 'No attention left this week.'
                              : `Costs ${money(investigation.budgetCost)}, more than the ${money(Math.max(0, state.resources.budgetRemaining))} left this year.`}
                        </p>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3 self-start"
                        aria-label={`Commission: ${investigation.name}`}
                        disabled={short || noFocus || noBudget}
                        onClick={() => {
                          setChosen(investigation)
                          setOverloadAccepted(false)
                          // Offered the leader whose work would come back best. It
                          // used to be whoever ran the area, which the quality of
                          // delegated work does not read.
                          const best = [...index.content.leaders].sort(
                            (a, b) =>
                              delegationQuality(leaderAsAssigned(state, state.team.leaders[b.id]!, investigation.capacityPerDay), strain, 0.5) -
                              delegationQuality(leaderAsAssigned(state, state.team.leaders[a.id]!, investigation.capacityPerDay), strain, 0.5),
                          )[0]
                          setLeaderId(best?.id ?? '')
                        }}
                      >
                        Commission
                      </Button>
                    </CardBody>
                  </Card>
                </li>
              )
            })}
          </ul>
          </section>
            )
          })
        )}
      </section>

      {chosen && (
        <Dialog
          open
          onClose={() => setChosen(undefined)}
          title={`Commission: ${chosen.name}`}
          description="Who leads this changes both how long it takes and how much comes back."
          descriptionInBody
          footer={
            <>
              <Button variant="quiet" onClick={() => setChosen(undefined)}>Cancel</Button>
              <Button variant="primary" disabled={!leaderId || (overloadWarning && !overloadAccepted)} aria-describedby={overloadWarning ? 'commission-overload' : undefined} onClick={start}>Commission the work</Button>
            </>
          }
        >
          <p className="mb-4 rounded-lg border border-line p-3 text-sm text-ink-muted">This uses {chosen.focusCost} attention{chosen.budgetCost > 0 ? ` and ${money(chosen.budgetCost)} budget` : ' and no budget'}. Allow about {chosen.durationDays} days; workload and delegation can affect the result. Findings arrive in your Inbox.</p>
          <p className="mb-3 text-sm text-ink-muted">Team shows workload today. These forecasts include this proposed enquiry and the team's strain, morale and expected answer quality; having room does not guarantee a strong answer.</p>
          {overloadWarning && <div id="commission-overload" className="mb-4 rounded border border-band-elevated p-3 text-sm"><p>This adds work to an already busy leader or stretched team. It may slip or return a thin answer. Choose another lead, wait, or review Team.</p><label className="mt-2 flex min-h-11 items-center gap-2"><input type="checkbox" checked={overloadAccepted} onChange={(event) => setOverloadAccepted(event.target.checked)} />I understand and commission despite the workload</label></div>}
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">Delegate to</legend>
            {index.content.leaders.map((leader) => {
              const runtime = leaderAsAssigned(state, state.team.leaders[leader.id]!, chosen?.capacityPerDay)
              return (
                <label
                  key={leader.id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-3',
                    leaderId === leader.id ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface-2',
                  )}
                >
                  <input
                    type="radio"
                    name="leader"
                    value={leader.id}
                    checked={leaderId === leader.id}
                    onChange={() => { setLeaderId(leader.id); setOverloadAccepted(false) }}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                    style={{ minHeight: 0 }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{leader.name}</span>
                      <span className="text-sm text-ink-muted">{leader.role}</span>
                    </span>
                    <span className="mt-1 block text-sm text-ink-muted">
                      {outlookText(delegationOutlook(runtime, strain), outlookBecause(runtime, strain))}
                    </span>
                  </span>
                </label>
              )
            })}
          </fieldset>
        </Dialog>
      )}
    </div>
  )
}
