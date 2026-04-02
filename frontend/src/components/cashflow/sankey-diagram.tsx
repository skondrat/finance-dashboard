"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import {
  sankey,
  sankeyLinkHorizontal,
  SankeyNode as D3SankeyNode,
  SankeyLink as D3SankeyLink,
} from "d3-sankey";
import { useCashflowSankey } from "@/lib/queries/cashflow";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

interface NodeDatum {
  id: string;
  label: string;
  type: string;
  level?: number;
  color?: string;
}

interface LinkDatum {
  source: string;
  target: string;
  value: number;
}

type SNode = D3SankeyNode<NodeDatum, LinkDatum>;
type SLink = D3SankeyLink<NodeDatum, LinkDatum>;

const INCOME_COLORS = ["#6b7280", "#4b5563", "#9ca3af", "#78716c", "#a1a1aa"];
const INCOME_MERGED = "#525a65";
const EXPENSE_COLORS = [
  "#9ca3af", "#78716c", "#6b7280", "#4b5563",
  "#57534e", "#a8a29e", "#a1a1aa", "#71717a",
];
const SAVINGS_GREEN = "#009668";
const INVESTMENTS_COLOR = "#6b7280";

function getNodeColor(node: NodeDatum, typeIndex: number): string {
  // Use category color from backend when available
  if (node.color) return node.color;
  if (node.id === "income") return INCOME_MERGED;
  switch (node.type) {
    case "income":
      return INCOME_COLORS[typeIndex % INCOME_COLORS.length];
    case "savings":
      return SAVINGS_GREEN;
    case "investments":
      return INVESTMENTS_COLOR;
    default:
      return EXPENSE_COLORS[typeIndex % EXPENSE_COLORS.length];
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLinkColor(targetNode: NodeDatum, highlighted: boolean): string {
  if (targetNode.color) {
    return hexToRgba(targetNode.color, highlighted ? 0.4 : 0.15);
  }
  if (targetNode.type === "savings") {
    return highlighted ? "rgba(0, 150, 104, 0.45)" : "rgba(0, 150, 104, 0.15)";
  }
  return highlighted ? "rgba(160, 160, 160, 0.35)" : "rgba(128, 128, 128, 0.12)";
}

interface TooltipData {
  label: string;
  value: number;
  x: number;
  y: number;
}

interface SankeyDiagramProps {
  year: number;
  month: number;
}

export function SankeyDiagram({ year, month }: SankeyDiagramProps) {
  const { data, isLoading } = useCashflowSankey(year, month);
  const currency = useCurrencyStore((s) => s.currency);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 1000;
  const height = 600;
  const margin = { top: 16, right: 140, bottom: 16, left: 120 };

  const layout = useMemo(() => {
    if (!data || data.nodes.length === 0 || data.links.length === 0) return null;

    const nodeIdMap = new Map<string, number>();
    data.nodes.forEach((n, i) => nodeIdMap.set(n.id, i));

    const nodes: NodeDatum[] = data.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      level: n.level,
      color: n.color,
    }));

    const links: LinkDatum[] = data.links
      .filter((l) => nodeIdMap.has(l.source) && nodeIdMap.has(l.target))
      .map((l) => ({
        source: l.source,
        target: l.target,
        value: l.value,
      }));

    if (links.length === 0) return null;

    const generator = sankey<NodeDatum, LinkDatum>()
      .nodeId((d) => d.id)
      .nodeWidth(14)
      .nodePadding(14)
      .nodeSort(null)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    return generator({ nodes, links });
  }, [data, width, height, margin.left, margin.right, margin.top, margin.bottom]);

  // Build connected node set for hover highlighting
  const connectedNodes = useMemo(() => {
    if (!layout || !hoveredNodeId) return new Set<string>();
    const connected = new Set<string>([hoveredNodeId]);
    for (const link of layout.links) {
      const src = (link.source as SNode).id;
      const tgt = (link.target as SNode).id;
      if (src === hoveredNodeId || tgt === hoveredNodeId) {
        connected.add(src);
        connected.add(tgt);
      }
    }
    return connected;
  }, [layout, hoveredNodeId]);

  const isLinkHighlighted = useCallback(
    (link: SLink) => {
      if (!hoveredNodeId) return false;
      const src = (link.source as SNode).id;
      const tgt = (link.target as SNode).id;
      return src === hoveredNodeId || tgt === hoveredNodeId;
    },
    [hoveredNodeId]
  );

  const handleNodeHover = useCallback(
    (node: SNode, event: React.MouseEvent) => {
      const value = (node.value as number) ?? 0;
      setTooltip({ label: node.label, value, x: event.clientX, y: event.clientY });
      setHoveredNodeId(node.id);
    },
    []
  );

  const handleLinkHover = useCallback(
    (link: SLink, event: React.MouseEvent) => {
      const sourceNode = link.source as SNode;
      const targetNode = link.target as SNode;
      setTooltip({
        label: `${sourceNode.label} → ${targetNode.label}`,
        value: link.value,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    setHoveredNodeId(null);
  }, []);

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const next = z * (e.deltaY < 0 ? 1.1 : 0.9);
      return Math.min(Math.max(next, 0.5), 4);
    });
  }, []);

  // Pan with mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const isZoomed = zoom !== 1 || pan.x !== 0 || pan.y !== 0;

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6">
        <div className="h-[600px] animate-pulse rounded-xl bg-surface-container-lowest" />
      </div>
    );
  }

  if (!data || !layout) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6">
        <div className="flex h-[600px] items-center justify-center">
          <p className="font-mono text-sm text-on-surface-variant">
            No cashflow data for this month
          </p>
        </div>
      </div>
    );
  }

  const pathGenerator = sankeyLinkHorizontal<SNode, SLink>();
  const typeCounters: Record<string, number> = {};
  const hasHover = hoveredNodeId !== null;

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <div className="relative overflow-hidden rounded-xl">
        {/* Reset zoom button */}
        {isZoomed && (
          <button
            onClick={resetView}
            className="absolute top-3 right-3 z-10 rounded-lg bg-surface-container-lowest/80 backdrop-blur-sm px-3 py-1.5 font-mono text-xs text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Reset view
          </button>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ cursor: isPanning ? "grabbing" : zoom > 1 ? "grab" : "default" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseLeave();
            handleMouseUp();
          }}
        >
          <g
            transform={`translate(${pan.x / (svgRef.current?.clientWidth ? svgRef.current.clientWidth / width : 1)}, ${pan.y / (svgRef.current?.clientHeight ? svgRef.current.clientHeight / height : 1)}) scale(${zoom})`}
            style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
          >
            {/* Links */}
            {layout.links.map((link, i) => {
              const targetNode = link.target as SNode;
              const d = pathGenerator(link as SLink);
              if (!d) return null;

              const highlighted = isLinkHighlighted(link as SLink);
              const dimmed = hasHover && !highlighted;

              return (
                <path
                  key={i}
                  d={d}
                  fill={getLinkColor(targetNode as NodeDatum, highlighted)}
                  stroke="none"
                  strokeWidth={0}
                  style={{
                    fillOpacity: dimmed ? 0.3 : 1,
                    strokeWidth: Math.max(1, link.width ?? 1),
                    transition: "fill-opacity 0.2s, fill 0.2s",
                  }}
                  onMouseMove={(e) => handleLinkHover(link as SLink, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <title>
                    {(link.source as SNode).label} → {targetNode.label}:{" "}
                    {formatCurrency(link.value, currency)}
                  </title>
                </path>
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => {
              const nodeType = node.type ?? "expense";
              const colorKey = node.id === "income" ? "income-merged" : nodeType;
              typeCounters[colorKey] = typeCounters[colorKey] ?? 0;
              const colorIndex = typeCounters[colorKey]++;

              const x0 = node.x0 ?? 0;
              const x1 = node.x1 ?? 0;
              const y0 = node.y0 ?? 0;
              const y1 = node.y1 ?? 0;
              const nodeHeight = y1 - y0;

              if (nodeHeight < 1) return null;

              const color = getNodeColor(node as NodeDatum, colorIndex);
              const level = (node as NodeDatum).level ?? 0;
              const labelOnLeft = level <= 1;
              const dimmed = hasHover && !connectedNodes.has(node.id);

              return (
                <g
                  key={node.id}
                  style={{
                    opacity: dimmed ? 0.25 : 1,
                    transition: "opacity 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseMove={(e) => handleNodeHover(node as SNode, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <rect
                    x={x0}
                    y={y0}
                    width={x1 - x0}
                    height={nodeHeight}
                    fill={color}
                    rx={2}
                  />
                  <text
                    x={labelOnLeft ? x0 - 8 : x1 + 8}
                    y={(y0 + y1) / 2}
                    textAnchor={labelOnLeft ? "end" : "start"}
                    dominantBaseline="central"
                    className="font-mono text-xs fill-on-surface-variant"
                    style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Glassmorphism tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 rounded-xl bg-surface-container-lowest/80 backdrop-blur-[20px] shadow-ambient px-4 py-3"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 40,
            }}
          >
            <p className="font-mono text-xs text-on-surface-variant mb-0.5">
              {tooltip.label}
            </p>
            <p className="font-display text-sm font-medium text-on-surface">
              {formatCurrency(tooltip.value, currency)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
