/**
 * Evidence → hypothesis → risk scenario (plan §12).
 *
 * Hypothesis creation is assisted rather than free-text: the player picks a
 * template and attaches the evidence they believe supports or contradicts it.
 * Evidence the game considers contradictory is attached as such automatically,
 * so the player has to confront it rather than quietly ignore it.
 */
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { evidenceList } from '@/store/selectors'
import { cn } from '@/lib/utils/cn'
import { evidenceSourceLabel, statusLabel } from '@/lib/formatting/labels'

export function HypothesisWorkspace() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const dispatch = useGameStore((store) => store.dispatch)
  const [creating, setCreating] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [picked, setPicked] = useState<string[]>([])

  const evidence = useMemo(() => (state ? evidenceList(state, index) : []), [state, index])
  if (!state) return null

  const hypotheses = Object.values(state.risks.hypotheses).sort((a, b) => b.createdDay - a.createdDay)
  const knownTags = new Set(evidence.flatMap((item) => item.tags))
  const templates = index.content.hypothesisTemplates.filter((template) =>
    template.requiresTags.every((tag) => knownTags.has(tag)),
  )

  const create = () => {
    if (!templateId) return
    const result = dispatch({ type: 'createHypothesis', templateId, evidenceIds: picked })
    if (result.ok) {
      setCreating(false)
      setTemplateId('')
      setPicked([])
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="hypotheses">
        <SectionHeading
          action={
            <Button
              variant="primary"
              size="sm"
              className="compact min-h-9"
              disabled={templates.length === 0}
              onClick={() => setCreating(true)}
            >
              Form a hypothesis
            </Button>
          }
        >
          <span id="hypotheses">Working hypotheses</span>
        </SectionHeading>

        {hypotheses.length === 0 ? (
          <EmptyState
            title="No hypotheses yet"
            description={
              templates.length === 0
                ? 'You do not yet hold enough evidence to propose anything worth testing. Go and find some.'
                : 'A hypothesis links evidence to a way harm could actually occur. Forming one costs a little of your week; testing one costs more.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {hypotheses.map((hypothesis) => {
              const supporting = hypothesis.supportingEvidenceIds
                .map((id) => index.evidence.get(id)?.title)
                .filter((title): title is string => Boolean(title))
              const contradicting = hypothesis.contradictingEvidenceIds
                .map((id) => index.evidence.get(id)?.title)
                .filter((title): title is string => Boolean(title))
              const canConvert = hypothesis.status === 'draft' || hypothesis.status === 'investigating'
              return (
                <li key={hypothesis.id}>
                  <Card>
                    <CardBody>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={hypothesis.confidence === 'high' ? 'low' : hypothesis.confidence === 'medium' ? 'moderate' : 'elevated'} glyph={false}>
                          {hypothesis.confidence} confidence
                        </Badge>
                        <Badge tone="neutral" glyph={false}>{statusLabel(hypothesis.status)}</Badge>
                      </div>
                      <h3 className="mt-2 font-medium text-balance">{hypothesis.title}</h3>
                      <p className="mt-1 text-sm text-ink-muted text-pretty">{hypothesis.statement}</p>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Supports</p>
                          {supporting.length === 0 ? (
                            <p className="mt-1 text-sm text-ink-faint">Nothing attached.</p>
                          ) : (
                            <ul className="mt-1 space-y-1 text-sm">
                              {supporting.map((title) => (
                                <li key={title} className="flex gap-2">
                                  <span aria-hidden="true" className="text-band-moderate">+</span>
                                  <span className="text-pretty">{title}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Contradicts</p>
                          {contradicting.length === 0 ? (
                            <p className="mt-1 text-sm text-ink-faint">Nothing attached.</p>
                          ) : (
                            <ul className="mt-1 space-y-1 text-sm">
                              {contradicting.map((title) => (
                                <li key={title} className="flex gap-2">
                                  <span aria-hidden="true" className="text-band-high">−</span>
                                  <span className="text-pretty">{title}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {canConvert && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="compact min-h-9"
                            onClick={() => dispatch({ type: 'convertHypothesis', hypothesisId: hypothesis.id })}
                          >
                            Raise as a risk scenario
                          </Button>
                          <Button
                            variant="quiet"
                            size="sm"
                            className="compact min-h-9"
                            onClick={() => dispatch({ type: 'rejectHypothesis', hypothesisId: hypothesis.id })}
                          >
                            Set aside
                          </Button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        size="lg"
        title="Form a hypothesis"
        description="Pick the proposition you want to test, then attach the evidence you think bears on it."
        footer={
          <>
            <Button variant="quiet" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" disabled={!templateId} onClick={create}>Record it</Button>
          </>
        }
      >
        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">Proposition</legend>
            {templates.map((template) => (
              <label
                key={template.id}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-lg border p-3',
                  templateId === template.id ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface-2',
                )}
              >
                <input
                  type="radio"
                  name="template"
                  value={template.id}
                  checked={templateId === template.id}
                  onChange={() => setTemplateId(template.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                  style={{ minHeight: 0 }}
                />
                <span>
                  <span className="block font-medium">{template.title}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted text-pretty">{template.statement}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Evidence you hold
            </legend>
            <div className="space-y-2">
              {evidence.slice(0, 40).map((item) => {
                const active = picked.includes(item.id)
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-3',
                      active ? 'border-accent bg-accent-soft/30' : 'border-line bg-surface-2',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() =>
                        setPicked((current) => (active ? current.filter((id) => id !== item.id) : [...current, item.id]))
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                      style={{ minHeight: 0 }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-faint">
                        {evidenceSourceLabel(item.source)} · {item.confidence} confidence · day {item.day}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>
      </Dialog>
    </div>
  )
}
