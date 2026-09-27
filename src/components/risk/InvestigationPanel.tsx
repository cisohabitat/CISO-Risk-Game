/**
 * Commissioning work (plan §2.4, §11). Information is a resource: every line of
 * enquiry costs attention, capacity and sometimes money, and who you give it to
 * changes what comes back.
 */
import { useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { enquirySpeaksTo, topConcerns } from '@/store/selectors'
import { DIFFICULTY_PROFILES } from '@/game/engine/setup'
import { ENQUIRY_THEMES } from '@/game/types'
import { evaluateCondition } from '@/game/events/conditions'
import { availableCapacity } from '@/game/team/capacity'
import { money } from '@/lib/formatting/labels'
import { cn } from '@/lib/utils/cn'
import type { InvestigationDef } from '@/game/types'

export function InvestigationPanel() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const dispatch = useGameStore((store) => store.dispatch)
  const [chosen, setChosen] = useState<InvestigationDef | undefined>()
  const [leaderId, setLeaderId] = useState<string>('')

  if (!state) return null

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

  const start = () => {
    if (!chosen || !leaderId) return
    const result = dispatch({ type: 'startInvestigation', investigationId: chosen.id, leaderId })
    if (result.ok) {
      setChosen(undefined)
      setLeaderId('')
    }
  }

  return (
    <div className="space-y-6">
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
        {available.length === 0 ? (
          <EmptyState
            title="Nothing left to commission"
            description="You have already asked for everything that is available to you right now."
          />
        ) : (
          ENQUIRY_THEMES.map((theme) => {
            const inTheme = available.filter((investigation) => investigation.theme === theme.id)
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
                      {speaksTo.length > 0 && (
                        <p className="mt-2 text-xs text-ink-faint">
                          Speaks to: {speaksTo.slice(0, 3).map((r) => r.title).join('; ')}
                          {speaksTo.length > 3 && ` and ${speaksTo.length - 3} more`}
                        </p>
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
                              : 'Not enough budget remains.'}
                        </p>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3 self-start"
                        disabled={short || noFocus || noBudget}
                        onClick={() => {
                          setChosen(investigation)
                          const preferred = index.content.leaders.find((leader) =>
                            leader.functions.some((fn) => investigation.functions.includes(fn)),
                          )
                          setLeaderId(preferred?.id ?? index.content.leaders[0]?.id ?? '')
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
          footer={
            <>
              <Button variant="quiet" onClick={() => setChosen(undefined)}>Cancel</Button>
              <Button variant="primary" disabled={!leaderId} onClick={start}>Commission the work</Button>
            </>
          }
        >
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">Delegate to</legend>
            {index.content.leaders.map((leader) => {
              const runtime = state.team.leaders[leader.id]!
              const fits = leader.functions.some((fn) => chosen.functions.includes(fn))
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
                    onChange={() => setLeaderId(leader.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                    style={{ minHeight: 0 }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{leader.name}</span>
                      <span className="text-sm text-ink-muted">{leader.role}</span>
                      {fits && <Badge tone="low" glyph={false}>In their area</Badge>}
                    </span>
                    <span className="mt-1 block text-sm text-ink-muted">
                      {runtime.workload > 0.8
                        ? 'Overloaded — expect this to slip and to come back thin.'
                        : runtime.workload > 0.55
                          ? 'Busy, but could take this on.'
                          : 'Has room for this.'}
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
