/**
 * Organisation (plan §28.4). Desktop and tablet get the dependency graph;
 * mobile gets a hierarchical drill-down by default with the graph available as
 * an option. Both views show exactly what the player has discovered and no more.
 */
import { Suspense, lazy, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { discoveredNodes, undiscoveredCount } from '@/store/selectors'
import { NodeInspector } from '@/components/organisation/NodeInspector'
import { nodeTypeLabel, plural } from '@/lib/formatting/labels'
import { cn } from '@/lib/utils/cn'

const OrgGraph = lazy(() => import('@/components/organisation/OrgGraph'))

const GROUP_ORDER = ['service', 'application', 'identity', 'cloud-platform', 'infrastructure', 'network-zone', 'supplier', 'data-set']

export function OrganisationScreen() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const graphMode = useGameStore((store) => store.ui.graphMode)
  const selectedNodeId = useGameStore((store) => store.ui.selectedNodeId)
  const setUi = useGameStore((store) => store.setUi)
  const [filter, setFilter] = useState<string>('all')

  const nodes = useMemo(() => (state ? discoveredNodes(state, index) : []), [state, index])
  if (!state) return null

  const unknown = undiscoveredCount(state)
  const filtered = filter === 'all' ? nodes : nodes.filter((node) => node.type === filter)
  const selected = nodes.find((node) => node.id === selectedNodeId)
  const types = Array.from(new Set(nodes.map((node) => node.type))).sort(
    (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl leading-tight">Organisation</h1>
          <p className="text-sm text-ink-muted">
            {plural(nodes.length, 'system')} discovered.{' '}
            {unknown.nodes + unknown.edges > 0
              ? `${plural(unknown.nodes, 'system')} and ${plural(unknown.edges, 'dependency', 'dependencies')} you have not found.`
              : 'Nothing remains hidden.'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-1">
          <Button
            size="sm"
            variant={graphMode === 'list' ? 'primary' : 'ghost'}
            className="compact min-h-9"
            aria-pressed={graphMode === 'list'}
            onClick={() => setUi({ graphMode: 'list' })}
          >
            List
          </Button>
          <Button
            size="sm"
            variant={graphMode === 'graph' ? 'primary' : 'ghost'}
            className="compact min-h-9"
            aria-pressed={graphMode === 'graph'}
            onClick={() => setUi({ graphMode: 'graph' })}
          >
            Graph
          </Button>
        </div>
      </div>

      {nodes.length === 0 ? (
        <EmptyState
          title="You cannot see the organisation yet"
          description="Nexora's architecture is not documented anywhere you can trust. Commission an architecture review, or talk to the people who run the services."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="space-y-3">
            <div className="scroll-area -mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by type">
              <Button
                size="sm"
                variant={filter === 'all' ? 'secondary' : 'ghost'}
                className="compact min-h-9 shrink-0"
                aria-pressed={filter === 'all'}
                onClick={() => setFilter('all')}
              >
                Everything
              </Button>
              {types.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={filter === type ? 'secondary' : 'ghost'}
                  className="compact min-h-9 shrink-0"
                  aria-pressed={filter === type}
                  onClick={() => setFilter(type)}
                >
                  {nodeTypeLabel(type)}
                </Button>
              ))}
            </div>

            {/* The graph is an enhancement; the list is always available and is
                the default on small screens (plan §27.1). */}
            <div className={cn(graphMode === 'graph' ? 'hidden sm:block' : 'hidden')}>
              <Suspense
                fallback={
                  <div className="flex h-[28rem] items-center justify-center rounded-[--radius-card] border border-line bg-surface-2 text-sm text-ink-muted">
                    Drawing the dependency map…
                  </div>
                }
              >
                <OrgGraph
                  nodes={filtered}
                  selectedId={selectedNodeId}
                  onSelect={(id) => setUi({ selectedNodeId: id })}
                />
              </Suspense>
            </div>

            <div className={cn(graphMode === 'graph' && 'sm:hidden')}>
              <ul className="space-y-2" aria-label="Discovered systems">
                {filtered.map((node) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => setUi({ selectedNodeId: node.id })}
                      aria-current={selectedNodeId === node.id ? 'true' : undefined}
                      className={cn(
                        'w-full rounded-lg border bg-surface p-3 text-left transition-colors',
                        selectedNodeId === node.id ? 'border-accent' : 'border-line hover:border-line-strong',
                        // Something you were told about and never checked is
                        // drawn as what it is: an outline, not a fact. The
                        // badge said so already, but a badge is a label on a
                        // solid row — it reads the same as everything else.
                        // Dashed and set back, the estate visibly resolves as
                        // the player verifies it, which is the one thing the
                        // whole verification model is asking them to feel.
                        !node.verified && selectedNodeId !== node.id && 'border-dashed bg-surface-2/40',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral" glyph={false}>{nodeTypeLabel(node.type)}</Badge>
                        {node.criticality === 'critical' && <Badge tone="high" glyph={false}>Critical</Badge>}
                        {node.onKnownAttackPath && <Badge tone="elevated" glyph={false}>On an attack path</Badge>}
                        {/* One knowledge badge per row: not having checked
                            something subsumes not understanding it well. The
                            list visibly clears as the player verifies things. */}
                        {!node.verified ? (
                          <Badge tone="warning" glyph={false}>Taken on trust</Badge>
                        ) : (
                          node.confidence < 0.6 && <Badge tone="warning" glyph={false}>Partly understood</Badge>
                        )}
                      </div>
                      <p className={cn('mt-1.5 font-medium', !node.verified && 'text-ink-muted')}>{node.name}</p>
                      <p className={cn('mt-0.5 line-clamp-2 text-sm text-pretty', node.verified ? 'text-ink-muted' : 'text-ink-faint')}>
                        {node.description}
                      </p>
                      {node.dependencies.length > 0 && (
                        <p className="mt-1.5 text-xs text-ink-faint">
                          Depends on {node.dependencies.slice(0, 3).map((dependency) => dependency.name).join(', ')}
                          {node.dependencies.length > 3 && ` and ${node.dependencies.length - 3} more`}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            {selected ? (
              <NodeInspector node={selected} onSelect={(id) => setUi({ selectedNodeId: id })} />
            ) : (
              <Card>
                <CardBody>
                  <SectionHeading>Inspector</SectionHeading>
                  <p className="text-sm text-ink-muted text-pretty">
                    Select anything to see what it depends on, what depends on it, and which controls you believe cover it.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
