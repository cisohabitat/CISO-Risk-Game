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

type OrgNodeData = {
  label: string
  type: string
  criticality: string
  onPath: boolean
  confidence: number
}

function OrgNodeCard({ data }: NodeProps) {
  const node = data as OrgNodeData
  const critical = node.criticality === 'critical' || node.criticality === 'high'
  return (
    <div
      className="min-w-[9.5rem] max-w-[13rem] rounded-lg border bg-surface px-3 py-2 text-left shadow-[var(--shadow-soft)]"
      style={{
        borderColor: node.onPath ? 'var(--band-high)' : critical ? 'var(--line-strong)' : 'var(--line)',
        borderWidth: node.onPath ? 2 : 1,
        opacity: 0.55 + node.confidence * 0.45,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <p className="text-[0.7rem] uppercase tracking-wider text-ink-faint">{nodeTypeLabel(node.type)}</p>
      <p className="text-sm font-medium leading-snug">{node.label}</p>
      {node.onPath && <p className="mt-1 text-[0.7rem] text-band-high">on a known attack path</p>}
      {node.confidence < 0.6 && <p className="mt-1 text-[0.7rem] text-ink-faint">partly understood</p>}
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
        position: { x: column * 240, y: row * 96 },
        data: {
          label: node.name,
          type: node.type,
          criticality: node.criticality,
          onPath: node.onKnownAttackPath,
          confidence: node.confidence,
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
        flowEdges.push({
          id,
          source: node.id,
          target: dependency.id,
          label: dependency.relationship,
          animated: false,
          style: {
            stroke: dependency.confidence < 0.6 ? 'var(--line-strong)' : 'var(--line-strong)',
            strokeDasharray: dependency.confidence < 0.6 ? '4 4' : undefined,
          },
          labelStyle: { fill: 'var(--ink-faint)', fontSize: 10 },
          labelBgStyle: { fill: 'var(--surface)' },
        })
      }
    }
    return { flowNodes, flowEdges }
  }, [nodes, selectedId])

  return (
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
        minZoom={0.25}
        maxZoom={1.6}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={24} color="var(--line)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
