import { useMemo } from "react"
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import {
  SERVICES,
  TONE_META,
  type ServiceColumn,
  type ServiceIcon,
  type ServiceTone,
} from "./service-data"

type ServiceNodeData = {
  label: string
  detail?: string
  tone: ServiceTone
  icon: ServiceIcon
  selected: boolean
  dimmed: boolean
}

type LaneNodeData = {
  label: ServiceColumn
  count: number
}

type ServiceNodeType = Node<ServiceNodeData, "service">
type LaneNodeType = Node<LaneNodeData, "lane">

const toneStyles: Record<ServiceTone, string> = {
  section:
    "border-ui-border-strong bg-ui-bg-base text-ui-fg-base shadow-elevation-card-rest",
  host: "border-ui-border-base bg-ui-bg-subtle text-ui-fg-base shadow-borders-base",
  app: "border-ui-border-base bg-ui-bg-base text-ui-fg-base shadow-borders-base",
  paid: "border-ui-tag-blue-border bg-ui-tag-blue-bg text-ui-tag-blue-text shadow-borders-base",
}

const toneIconStyles: Record<ServiceTone, string> = {
  section: "bg-ui-tag-purple-bg text-ui-tag-purple-icon",
  host: "bg-ui-tag-orange-bg text-ui-tag-orange-icon",
  app: "bg-ui-tag-neutral-bg text-ui-tag-neutral-icon",
  paid: "bg-ui-tag-blue-bg text-ui-tag-blue-icon",
}

const ServiceFlowNode = ({ data }: NodeProps<ServiceNodeType>) => {
  const Icon = data.icon
  return (
    <div
      className={`group min-w-52 rounded-xl border px-3 py-2 transition-all ${
        toneStyles[data.tone]
      } ${
        data.selected
          ? "ring-2 ring-ui-fg-interactive ring-offset-1 ring-offset-ui-bg-subtle"
          : ""
      } ${data.dimmed ? "opacity-40" : "opacity-100"}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-1.5! w-1.5! border-0! bg-ui-border-strong!"
      />
      <div className="flex items-center gap-x-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            toneIconStyles[data.tone]
          }`}
        >
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="txt-compact-small-plus leading-tight">
            {data.label}
          </div>
          {data.detail ? (
            <div className="txt-compact-xsmall truncate text-ui-fg-subtle">
              {data.detail}
            </div>
          ) : null}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-1.5! w-1.5! border-0! bg-ui-border-strong!"
      />
    </div>
  )
}

const LaneNode = ({ data }: NodeProps<LaneNodeType>) => {
  return (
    <div className="h-full w-full rounded-2xl border border-dashed border-ui-border-base bg-ui-bg-base/40">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="txt-compact-xsmall-plus uppercase tracking-wider text-ui-fg-muted">
          {data.label}
        </span>
        <span className="txt-compact-xsmall text-ui-fg-muted">
          {data.count} services
        </span>
      </div>
    </div>
  )
}

const nodeTypes = { service: ServiceFlowNode, lane: LaneNode }

const COLUMN_X: Record<ServiceColumn, number> = { Admin: 0, Storefront: 320 }
const ROW_GAP = 92
const NODE_TOP = 0
const LANE_PAD_TOP = 52
const LANE_PAD_BOTTOM = 24
const NODE_HEIGHT = 62

const columnOrder = (column: ServiceColumn) =>
  SERVICES.filter((service) => service.column === column)

const positionFor = (id: string) => {
  const service = SERVICES.find((s) => s.id === id)!
  const siblings = columnOrder(service.column)
  const row = siblings.findIndex((s) => s.id === id)
  return { x: COLUMN_X[service.column], y: NODE_TOP + row * ROW_GAP }
}

const laneNodes: LaneNodeType[] = (
  ["Admin", "Storefront"] as ServiceColumn[]
).map((column) => {
  const siblings = columnOrder(column)
  const height =
    LANE_PAD_TOP + (siblings.length - 1) * ROW_GAP + NODE_HEIGHT + LANE_PAD_BOTTOM
  return {
    id: `lane-${column}`,
    type: "lane",
    position: { x: COLUMN_X[column] - 24, y: NODE_TOP - LANE_PAD_TOP },
    data: { label: column, count: siblings.length },
    draggable: false,
    selectable: false,
    focusable: false,
    zIndex: 0,
    style: { width: 256, height },
  }
})

const serviceEdges: Edge[] = [
  { id: "a1", source: "admin", target: "admin-railway" },
  { id: "a2", source: "admin-railway", target: "admin-medusa-docker" },
  { id: "a3", source: "admin-medusa-docker", target: "admin-medusa-app" },
  { id: "a4", source: "admin-medusa-app", target: "admin-meilisearch", label: "uses" },
  { id: "a5", source: "admin-meilisearch", target: "admin-convex", label: "syncs" },
  { id: "a6", source: "admin-convex", target: "admin-bunny", label: "serves" },

  { id: "s1", source: "storefront", target: "storefront-vercel" },
  { id: "s2", source: "storefront-vercel", target: "storefront-next" },
  { id: "s3", source: "storefront-next", target: "storefront-stripe", label: "uses" },
  { id: "s4", source: "storefront-stripe", target: "storefront-upstash" },
  { id: "s5", source: "storefront-upstash", target: "storefront-neon", label: "data" },
]

const crossEdge: Edge = {
  id: "x1",
  source: "storefront-next",
  target: "admin-medusa-docker",
  label: "Store API",
  animated: true,
}

type ServiceHierarchyGraphProps = {
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export const ServiceHierarchyGraph = ({
  selectedId,
  onSelect,
}: ServiceHierarchyGraphProps) => {
  const nodes = useMemo<(ServiceNodeType | LaneNodeType)[]>(() => {
    const serviceNodes: ServiceNodeType[] = SERVICES.map((service) => ({
      id: service.id,
      type: "service",
      position: positionFor(service.id),
      data: {
        label: service.label,
        detail: service.detail,
        tone: service.tone,
        icon: service.icon,
        selected: selectedId === service.id,
        dimmed: selectedId !== null && selectedId !== service.id,
      },
      zIndex: 5,
    }))
    return [...laneNodes, ...serviceNodes]
  }, [selectedId])

  const edges = useMemo<Edge[]>(() => {
    const isActive = (edge: Edge) =>
      selectedId !== null &&
      (edge.source === selectedId || edge.target === selectedId)

    return [...serviceEdges, crossEdge].map((edge) => {
      const active = isActive(edge)
      const cross = edge.id === "x1"
      return {
        ...edge,
        type: "smoothstep" as const,
        animated: edge.animated ?? active,
        style: {
          stroke: active ? "#3b82f6" : cross ? "#71717a" : "#a1a1aa",
          strokeWidth: active ? 1.75 : 1,
          strokeDasharray: cross ? "4 4" : undefined,
          opacity: selectedId && !active ? 0.35 : 1,
        },
        labelStyle: { fontSize: 10, fill: active ? "#2563eb" : "#52525b" },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.85 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
      }
    })
  }, [selectedId])

  return (
    <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-base shadow-borders-base">
      <div className="flex items-center justify-between border-b border-ui-border-base px-4 py-3">
        <div>
          <div className="txt-compact-small-plus">Service Hierarchy</div>
          <div className="txt-compact-xsmall mt-0.5 text-ui-fg-subtle">
            Select a node to inspect a service. Admin and Storefront stacks side by side.
          </div>
        </div>
        <Legend />
      </div>
      <div className="flex-1 bg-ui-bg-subtle">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          onNodeClick={(_, node) => {
            if (node.type === "service") {
              onSelect(node.id === selectedId ? null : node.id)
            }
          }}
          onPaneClick={() => onSelect(null)}
          panOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="#e4e4e7"
          />
        </ReactFlow>
      </div>
    </div>
  )
}

const Legend = () => {
  const tones: ServiceTone[] = ["section", "host", "app", "paid"]
  return (
    <div className="hidden flex-wrap items-center gap-x-3 gap-y-1 md:flex">
      {tones.map((tone) => (
        <div key={tone} className="flex items-center gap-x-1.5">
          <span className={`h-2 w-2 rounded-sm ${TONE_META[tone].swatch}`} />
          <span className="txt-compact-xsmall text-ui-fg-subtle">
            {TONE_META[tone].label}
          </span>
        </div>
      ))}
    </div>
  )
}
