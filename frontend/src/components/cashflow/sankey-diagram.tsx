"use client";

import { useMemo, useState, useCallback } from "react";
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
const MAJOR_COLORS = [
  "#6b7280", "#4b5563", "#78716c", "#57534e",
  "#525252", "#71717a", "#44403c", "#64748b",
  "#334155", "#475569",
];
const EXPENSE_COLORS = [
  "#9ca3af", "#78716c", "#6b7280", "#4b5563",
  "#57534e", "#a8a29e", "#a1a1aa", "#71717a",
];
const SAVINGS_GREEN = "#009668";
const INVESTMENTS_COLOR = "#6b7280";

function getNodeColor(node: NodeDatum, typeIndex: number): string {
  if (node.id === "income") return INCOME_MERGED;
  switch (node.type) {
    case "income":
      return INCOME_COLORS[typeIndex % INCOME_COLORS.length];
    case "major":
      return MAJOR_COLORS[typeIndex % MAJOR_COLORS.length];
    case "savings":
      return SAVINGS_GREEN;
    case "investments":
      return INVESTMENTS_COLOR;
    default:
      return EXPENSE_COLORS[typeIndex % EXPENSE_COLORS.length];
  }
}

function getLinkColor(targetType: string): string {
  if (targetType === "savings") return "rgba(0, 150, 104, 0.15)";
  return "rgba(128, 128, 128, 0.12)";
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

  const handleNodeHover = useCallback(
    (node: SNode, event: React.MouseEvent) => {
      const value = (node.value as number) ?? 0;
      setTooltip({
        label: node.label,
        value,
        x: event.clientX,
        y: event.clientY,
      });
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
  }, []);

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

  // Track color indices per type
  const typeCounters: Record<string, number> = {};

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={handleMouseLeave}
        >
          {/* Links */}
          {layout.links.map((link, i) => {
            const targetNode = link.target as SNode;
            const d = pathGenerator(link as SLink);
            if (!d) return null;

            return (
              <path
                key={i}
                d={d}
                fill={getLinkColor(targetNode.type)}
                stroke="none"
                strokeWidth={0}
                style={{
                  fillOpacity: 1,
                  strokeWidth: Math.max(1, link.width ?? 1),
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
            typeCounters[colorKey] = (typeCounters[colorKey] ?? 0);
            const colorIndex = typeCounters[colorKey]++;

            const x0 = node.x0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y0 = node.y0 ?? 0;
            const y1 = node.y1 ?? 0;
            const nodeHeight = y1 - y0;

            if (nodeHeight < 1) return null;

            const color = getNodeColor(node as NodeDatum, colorIndex);

            // Label positioning: level 0 and 1 labels on left, level 2 and 3 on right
            const level = (node as NodeDatum).level ?? 0;
            const labelOnLeft = level <= 1;

            return (
              <g
                key={node.id}
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
