/**
 * Dependency graph (plan §32.6). Read-only: the player does not design the
 * architecture, they discover it. Lazy-loaded so the graph library never lands
 * in the initial bundle, and always paired with a list view for small screens.
 */
import { useMemo } from 'react'
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { DiscoveredNodeView } from '@/store/selectors'
import { nodeTypeLabel } from '@/lib/formatting/labels'

const COLUMNS: Record<string, number> = {
  service: 0,
  application: 1,
  identity: 2,
  'cloud-platform': 3,
  infrastructure: 3,
  'network-zone': 2,
  supplier: 4,
  'data-set': 4,
  control: 5,
  objective: 0,
}

/**
 * Each kind of thing carries a colour on its edge, so the columns read as what
 * they are before any label does. Families rather than ten colours: ten hues
 * are a puzzle, and the distinction that matters is whose thing it is.
 */
const FAMILIES: { id: string; label: string; colour: string; types: string[] }[] = [
  { id: 'business', label: 'Business', colour: 'var(--accent)', types: ['service', 'objective', 'application'] },
  { id: 'identity', label: 'Identity', colour: 'var(--chart-programme)', types: ['identity'] },
  { id: 'platform', label: 'Platform', colour: 'var(--ink-faint)', types: ['cloud-platform', 'infrastructure', 'network-zone'] },
  { id: 'supplier', label: 'Supplier', colour: 'var(--brass)', types: ['supplier'] },
  { id: 'data', label: 'Data', colour: 'var(--chart-enquiry)', types: ['data-set'] },
  { id: 'control', label: 'Control', colour: 'var(--line-strong)', types: ['control'] },
]

function familyOf(type: string) {
  return FAMILIES.find((family) => family.types.includes(type)) ?? FAMILIES[2]!
}

type OrgNodeData = {
  label: string
  type: string
  criticality: string
  onPath: boolean
  confidence: number
  /** Established by the player's own work, rather than inherited or overheard. */
  verified: boolean
}

function OrgNodeCard({ data }: NodeProps) {
  const node = data as OrgNodeData
  const critical = node.criticality === 'critical' || node.criticality === 'high'
  return (
    <div
      className="relative min-w-[9.5rem] max-w-[13rem] overflow-hidden rounded-lg border bg-surface py-2 pl-4 pr-3 text-left shadow-[var(--shadow-soft)]"
      style={{
        borderColor: node.onPath ? 'var(--band-high)' : critical ? 'var(--line-strong)' : 'var(--line)',
        borderWidth: node.onPath ? 2 : 1,
        // Solid once the player has checked it themselves, dashed while it is
        // still somebody else's word. Confidence was already dimming the card,
        // but confidence and having checked are different things — an
        // inherited entry can arrive confident and wrong — and only one of
        // them is the thing this game is about. The estate resolves from
        // outlines into architecture as the year goes on.
        borderStyle: node.verified ? 'solid' : 'dashed',
        opacity: (node.verified ? 0.72 : 0.5) + node.confidence * 0.28,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{ background: familyOf(node.type).colour }} />
      <p className="text-[0.7rem] text-ink-faint">{nodeTypeLabel(node.type)}</p>
      <p className="text-sm font-medium leading-snug">{node.label}</p>
      {node.onPath && <p className="mt-1 text-[0.7rem] text-band-high">on a known attack path</p>}
      {/* The outline says whether it was checked, and the key says what an
          outline means; a line of words under every dashed card repeated it
          forty times. */}
      {node.verified && node.confidence < 0.6 && <p className="mt-1 text-[0.7rem] text-ink-faint">partly understood</p>}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}

const NODE_TYPES = { org: OrgNodeCard }

export default function OrgGraph({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: DiscoveredNodeView[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  const { flowNodes, flowEdges } = useMemo(() => {
    const perColumn: Record<number, number> = {}
    const flowNodes: Node[] = nodes.map((node) => {
      const column = COLUMNS[node.type] ?? 3
      const row = (perColumn[column] = (perColumn[column] ?? 0) + 1)
      return {
        id: node.id,
        type: 'org',
        position: { x: column * 260, y: row * 96 },
        data: {
          label: node.name,
          type: node.type,
          criticality: node.criticality,
          onPath: node.onKnownAttackPath,
          confidence: node.confidence,
          verified: node.verified,
        } satisfies OrgNodeData,
        selected: node.id === selectedId,
      }
    })

    const known = new Set(nodes.map((node) => node.id))
    const seen = new Set<string>()
    const flowEdges: Edge[] = []
    for (const node of nodes) {
      for (const dependency of node.dependencies) {
        if (!known.has(dependency.id)) continue
        const id = `${node.id}->${dependency.id}`
        if (seen.has(id)) continue
        seen.add(id)
        // Every edge carried its label, and fifty labels at fit-to-screen were
        // a pile of overlapping words. Labels belong to the selected node's
        // own edges, which are drawn in the accent; the rest step back.
        const touches = selectedId !== undefined && (node.id === selectedId || dependency.id === selectedId)
        flowEdges.push({
          id,
          source: node.id,
          target: dependency.id,
          label: touches ? dependency.relationship : undefined,
          animated: false,
          zIndex: touches ? 1 : 0,
          style: {
            stroke: touches ? 'var(--accent)' : 'var(--line-strong)',
            strokeWidth: touches ? 2 : 1,
            strokeDasharray: dependency.confidence < 0.6 ? '4 4' : undefined,
            opacity: selectedId === undefined || touches ? 1 : 0.35,
          },
          labelStyle: { fill: 'var(--ink-muted)', fontSize: 11 },
          labelBgStyle: { fill: 'var(--surface)' },
        })
      }
    }
    return { flowNodes, flowEdges }
  }, [nodes, selectedId])

  // Opened on what the business runs and the applications under it, at a
  // size that can be read. Fitting the whole estate made every label a few
  // pixels tall; the rest is a scroll or a zoom away.
  const opening = useMemo(
    () => nodes.filter((node) => (COLUMNS[node.type] ?? 3) <= 1).map((node) => ({ id: node.id })),
    [nodes],
  )

  const families = FAMILIES.filter((family) => nodes.some((node) => family.types.includes(node.type)))

  return (
    <div className="space-y-2">
      <ul aria-label="Key to the map" data-testid="graph-key" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        {families.map((family) => (
          <li key={family.id} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-1.5 rounded-sm" style={{ background: family.colour }} />
            {family.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-5 rounded-sm border border-solid border-line-strong" />
          Checked
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-5 rounded-sm border border-dashed border-line-strong" />
          Taken on trust
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-5 rounded-sm border-2 border-band-high" />
          On a known attack path
        </li>
      </ul>
      <div className="h-[28rem] w-full overflow-hidden rounded-[--radius-card] border border-line bg-surface-2 sm:h-[34rem]">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={NODE_TYPES}
          onNodeClick={(_, node) => onSelect(node.id)}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          fitView
          fitViewOptions={{ nodes: opening.length > 0 ? opening : undefined, padding: 0.15, maxZoom: 1 }}
          minZoom={0.25}
          maxZoom={1.6}
          proOptions={{ hideAttribution: false }}
        >
          <Background gap={24} color="var(--line)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  )
}
