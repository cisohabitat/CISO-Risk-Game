import { Badge, Card, CardBody, Fact, SectionHeading } from '@/components/ui/primitives'
import type { DiscoveredNodeView } from '@/store/selectors'
import { controlBandTone, nodeTypeLabel } from '@/lib/formatting/labels'

export function NodeInspector({ node, onSelect }: { node: DiscoveredNodeView; onSelect: (id: string) => void }) {
  return (
    <Card className="lg:sticky lg:top-24">
      <CardBody className="space-y-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral" glyph={false}>{nodeTypeLabel(node.type)}</Badge>
            <Badge tone={node.criticality === 'critical' ? 'high' : node.criticality === 'high' ? 'elevated' : 'neutral'} glyph={false}>
              {node.criticality} criticality
            </Badge>
            {node.onKnownAttackPath && <Badge tone="high" glyph={false}>On a known attack path</Badge>}
          </div>
          <h2 className="mt-2 text-lg font-semibold text-balance">{node.name}</h2>
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
                    onClick={() => onSelect(dependency.id)}
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
                    onClick={() => onSelect(dependent.id)}
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
