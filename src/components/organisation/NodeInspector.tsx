import { useEffect, useRef, useState } from 'react'
import { Badge, Card, CardBody, Fact, SectionHeading } from '@/components/ui/primitives'
import type { DiscoveredNodeView } from '@/store/selectors'
import { controlBandTone, nodeTypeLabel } from '@/lib/formatting/labels'

interface Step {
  id: string
  name: string
}

/**
 * The graph's equivalent for anyone who cannot use the graph (docs/ROADMAP.md,
 * Phase 4): walk the estate from one system to what it depends on, and back.
 * Following a link used to replace the panel under the keyboard, so focus
 * fell to the page and a screen reader said nothing about where it had gone.
 * Now the walk moves focus to the system it arrives at, and keeps the route
 * walked so far, each step a way back.
 */
export function NodeInspector({ node, onSelect }: { node: DiscoveredNodeView; onSelect: (id: string) => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const [walkingTo, setWalkingTo] = useState<string>()
  const [shown, setShown] = useState(node.id)
  const [trail, setTrail] = useState<Step[]>([{ id: node.id, name: node.name }])
  const [arrived, setArrived] = useState(false)

  // A new node: a step on the walk if a link here was followed, otherwise
  // (picked from the list or the graph) the start of a new one.
  if (shown !== node.id) {
    const walked = walkingTo === node.id
    setShown(node.id)
    setWalkingTo(undefined)
    setArrived(walked)
    setTrail((current) => {
      if (!walked) return [{ id: node.id, name: node.name }]
      const at = current.findIndex((step) => step.id === node.id)
      return at >= 0 ? current.slice(0, at + 1) : [...current, { id: node.id, name: node.name }]
    })
  }

  useEffect(() => {
    if (arrived) heading.current?.focus()
  }, [arrived, shown])

  const walk = (id: string) => {
    setWalkingTo(id)
    onSelect(id)
  }

  return (
    <Card className="lg:sticky lg:top-24">
      <CardBody className="space-y-4">
        {trail.length > 1 && (
          <nav aria-label="Your walk through the estate" data-testid="walk-trail">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-faint">
              {trail.map((step, position) => (
                <li key={step.id} className="flex items-center gap-1.5">
                  {position > 0 && <span aria-hidden="true">→</span>}
                  {position === trail.length - 1 ? (
                    <span aria-current="location" className="font-medium text-ink">
                      {step.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => walk(step.id)}
                      className="compact underline decoration-line-strong underline-offset-2 hover:text-ink"
                    >
                      {step.name}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral" glyph={false}>{nodeTypeLabel(node.type)}</Badge>
            <Badge tone={node.criticality === 'critical' ? 'high' : node.criticality === 'high' ? 'elevated' : 'neutral'} glyph={false}>
              {node.criticality} criticality
            </Badge>
            {node.onKnownAttackPath && <Badge tone="high" glyph={false}>On a known attack path</Badge>}
          </div>
          <h2 ref={heading} tabIndex={-1} className="mt-2 font-display text-xl leading-tight text-balance outline-none" data-testid="inspector-heading">
            {node.name}
          </h2>
          <p className="mt-1 text-sm text-ink-muted text-pretty">{node.description}</p>
        </div>

        {!node.verified ? (
          <p className="rounded-lg border border-line bg-surface-2 p-3 text-sm text-ink-muted text-pretty">
            This is what you were handed, not what you have checked. Nobody on your watch has looked at
            it — commission work that covers it if it matters.
          </p>
        ) : (
          node.confidence < 0.7 && (
            <p className="rounded-lg border border-line bg-surface-2 p-3 text-sm text-ink-muted text-pretty">
              Your picture of this is partial. What you can see here may not be all of it.
            </p>
          )
        )}

        {node.serviceHealth !== undefined && (
          <Fact
            label="Service health"
            value={node.serviceHealth > 0.95 ? 'Operating normally' : node.serviceHealth > 0.6 ? 'Degraded' : 'Substantially disrupted'}
          />
        )}

        {node.dependencies.length > 0 && (
          <div>
            <SectionHeading>Depends on</SectionHeading>
            <ul className="space-y-1 text-sm">
              {node.dependencies.map((dependency) => (
                <li key={`${dependency.id}-${dependency.relationship}`}>
                  <button
                    type="button"
                    onClick={() => walk(dependency.id)}
                    className="compact text-left underline decoration-line-strong underline-offset-4 hover:text-accent-ink"
                  >
                    {dependency.name}
                  </button>
                  <span className="text-ink-faint"> — {dependency.relationship}</span>
                  {dependency.confidence < 0.6 && <span className="text-ink-faint"> (uncertain)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {node.dependents.length > 0 && (
          <div>
            <SectionHeading>Depended on by</SectionHeading>
            <ul className="space-y-1 text-sm">
              {node.dependents.map((dependent) => (
                <li key={`${dependent.id}-${dependent.relationship}`}>
                  <button
                    type="button"
                    onClick={() => walk(dependent.id)}
                    className="compact text-left underline decoration-line-strong underline-offset-4 hover:text-accent-ink"
                  >
                    {dependent.name}
                  </button>
                  <span className="text-ink-faint"> — {dependent.relationship}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {node.controls.length > 0 && (
          <div>
            <SectionHeading>Controls you believe cover this</SectionHeading>
            <ul className="flex flex-wrap gap-2">
              {node.controls.map((control) => (
                <li key={control.id}>
                  <Badge tone={controlBandTone(control.band)} glyph={false}>
                    {control.name}: {control.band}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-ink-faint text-pretty">
              These reflect your current assurance picture, which may be out of date.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
