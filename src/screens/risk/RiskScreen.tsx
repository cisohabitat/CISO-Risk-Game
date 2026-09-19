/**
 * The risk workspace (plan §28.3): evidence, hypotheses, risk scenarios and the
 * assumptions underneath them — never a single flat spreadsheet.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, EmptyState, Tab, TabList, TabPanel, Tabs } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { assumptionViews, evidenceList, visibleRisks } from '@/store/selectors'
import { InvestigationPanel } from '@/components/risk/InvestigationPanel'
import { HypothesisWorkspace } from '@/components/risk/HypothesisWorkspace'
import { RiskDetail } from '@/components/risk/RiskDetail'
import { RISK_BAND_LABEL } from '@/game/risk/bands'
import { bandTone, confidenceTone, evidenceSourceLabel, statusLabel } from '@/lib/formatting/labels'
import { cn } from '@/lib/utils/cn'

export function RiskScreen() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const dispatch = useGameStore((store) => store.dispatch)
  const selectedScenarioId = useGameStore((store) => store.ui.selectedScenarioId)
  const setUi = useGameStore((store) => store.setUi)
  const [tab, setTab] = useState('risks')

  const risks = useMemo(() => (state ? visibleRisks(state, index) : []), [state, index])
  const evidence = useMemo(() => (state ? evidenceList(state, index) : []), [state, index])
  const assumptions = useMemo(() => (state ? assumptionViews(state) : []), [state])
  if (!state) return null

  const selected = risks.find((risk) => risk.id === selectedScenarioId)
  const unreadEvidence = evidence.filter((item) => !item.read).length
  const failedAssumptions = assumptions.filter((assumption) => assumption.status === 'invalidated').length

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl leading-tight">Risk</h1>

      <Tabs value={tab} onChange={setTab}>
        <TabList label="Risk workspace">
          <Tab value="risks" count={risks.filter((risk) => risk.status === 'open').length}>Risk scenarios</Tab>
          <Tab value="evidence" count={unreadEvidence}>Evidence</Tab>
          <Tab value="hypotheses">Hypotheses</Tab>
          <Tab value="investigate">Investigate</Tab>
          <Tab value="assumptions" count={failedAssumptions}>Assumptions</Tab>
        </TabList>

        <TabPanel value="risks">
          {risks.length === 0 ? (
            <EmptyState
              title="No risk scenarios yet"
              description="A risk scenario states a threat, a pathway and a business consequence together. Build one from evidence rather than inheriting it."
              action={<Button variant="primary" size="sm" onClick={() => setTab('investigate')}>Go and find something out</Button>}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
              <ul className="space-y-3">
                {risks.map((risk) => (
                  <li key={risk.id}>
                    <button
                      type="button"
                      onClick={() => setUi({ selectedScenarioId: risk.id })}
                      className={cn(
                        'w-full rounded-[--radius-card] border bg-surface p-4 text-left transition-colors',
                        selectedScenarioId === risk.id ? 'border-accent' : 'border-line hover:border-line-strong',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={bandTone(risk.band)}>{RISK_BAND_LABEL[risk.band]}</Badge>
                        <Badge tone={confidenceTone(risk.confidence)} glyph={false}>{risk.confidence}</Badge>
                        <Badge tone="neutral" glyph={false}>{statusLabel(risk.status)}</Badge>
                        {risk.reviewDue && <Badge tone="warning" glyph={false}>Review due</Badge>}
                        {risk.hasInvalidatedAssumption && <Badge tone="high" glyph={false}>Assumption failed</Badge>}
                      </div>
                      <h3 className="mt-2 font-medium text-balance">{risk.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-muted text-pretty">{risk.statement}</p>
                      <p className="mt-2 text-xs text-ink-faint">
                        Owned by {risk.ownerName}
                        {risk.affectedServices.length > 0 && ` · ${risk.affectedServices.join(', ')}`}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              <div>
                {selected ? (
                  <RiskDetail risk={selected} onClose={() => setUi({ selectedScenarioId: undefined })} />
                ) : (
                  <Card>
                    <CardBody>
                      <p className="text-sm text-ink-muted">
                        Select a risk to see its exposure, its consequence, who owns it and what it rests on.
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabPanel>

        <TabPanel value="evidence">
          {evidence.length === 0 ? (
            <EmptyState
              title="No evidence yet"
              description="Evidence arrives from audits, the SOC, suppliers, tests and the people around you — and from work you commission."
              action={<Button variant="primary" size="sm" onClick={() => setTab('investigate')}>Commission some work</Button>}
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {evidence.map((item) => (
                <li key={item.id}>
                  <Card className={cn('h-full', !item.read && 'border-accent/50')}>
                    <CardBody>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral" glyph={false}>{evidenceSourceLabel(item.source)}</Badge>
                        <Badge
                          tone={item.confidence === 'high' ? 'low' : item.confidence === 'medium' ? 'moderate' : 'elevated'}
                          glyph={false}
                        >
                          {item.confidence} confidence
                        </Badge>
                        <span className="text-xs text-ink-faint tabular-nums">day {item.day}</span>
                      </div>
                      <h3 className="mt-2 font-medium text-balance">{item.title}</h3>
                      <p className="mt-1 text-sm text-ink-muted text-pretty">{item.description}</p>
                      {item.affectedNames.length > 0 && (
                        <p className="mt-2 text-xs text-ink-faint">Relates to {item.affectedNames.join(', ')}</p>
                      )}
                      {!item.read && (
                        <Button
                          variant="quiet"
                          size="sm"
                          className="compact mt-3 min-h-9"
                          onClick={() => dispatch({ type: 'markEvidenceRead', evidenceId: item.id })}
                        >
                          Mark as read
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabPanel>

        <TabPanel value="hypotheses">
          <HypothesisWorkspace />
        </TabPanel>

        <TabPanel value="investigate">
          <InvestigationPanel />
        </TabPanel>

        <TabPanel value="assumptions">
          {assumptions.length === 0 ? (
            <EmptyState
              title="No assumptions recorded"
              description="When you accept a risk or take a material decision, record what it depends on. The simulation will tell you when one stops being true."
            />
          ) : (
            <ul className="space-y-3">
              {assumptions.map((assumption) => (
                <li key={assumption.id}>
                  <Card className={assumption.status === 'invalidated' ? 'border-band-high/50' : undefined}>
                    <CardBody>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={assumption.status === 'invalidated' ? 'high' : assumption.status === 'uncertain' ? 'elevated' : 'low'}
                          glyph={false}
                        >
                          {statusLabel(assumption.status)}
                        </Badge>
                        {assumption.status === 'invalidated' && !assumption.heldWhenRecorded && (
                          <Badge tone="severe" glyph={false}>Was never true</Badge>
                        )}
                        <span className="text-xs text-ink-faint tabular-nums">recorded day {assumption.createdDay}</span>
                      </div>
                      <p className="mt-2 font-medium text-pretty">{assumption.statement}</p>
                      {assumption.invalidationReason && (
                        <p className="mt-1 text-sm text-band-high text-pretty">{assumption.invalidationReason}</p>
                      )}
                      {assumption.linkedScenarioIds.length > 0 && (
                        <p className="mt-2 text-xs text-ink-faint">
                          Supports {assumption.linkedScenarioIds
                            .map((id) => index.riskScenario.get(id)?.title)
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabPanel>
      </Tabs>
    </div>
  )
}
