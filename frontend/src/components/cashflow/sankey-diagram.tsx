"use client";

import { useMemo, useState, useCallback } from "react";
import {
  sankey,
  sankeyLinkHorizontal,
  SankeyNode as D3SankeyNode,
  SankeyLink as D3SankeyLink,
} from "d3-sankey";
import { useCashflowSankey, SankeyNode, SankeyLink } from "@/lib/queries/cashflow";
import { useCurrencyStore } from "@/stores/currency-store";
import { formatCurrency } from "@/lib/utils";

interface NodeDatum {
  id: string;
  label: string;
  type: string;
}

interface LinkDatum {
  source: string;
  target: string;
  value: number;
}

type SNode = D3SankeyNode<NodeDatum, LinkDatum>;
type SLink = D3SankeyLink<NodeDatum, LinkDatum>;

const INCOME_GRAYS = ["#6b7280", "#4b5563", "#9ca3af", "#78716c", "#a1a1aa"];
const EXPENSE_GRAYS = ["#9ca3af", "#78716c", "#6b7280", "#4b5563", "#57534e", "#a8a29e", "#a1a1aa", "#71717a"];
const SAVINGS_GREEN = "#009668";
const INVESTMENTS_COLOR = "#6b7280";

function getNodeColor(node: NodeDatum, index: number): string {
  switch (node.type) {
    case "income":
      return INCOME_GRAYS[index % INCOME_GRAYS.length];
    case "savings":
      return SAVINGS_GREEN;
    case "investments":
      return INVESTMENTS_COLOR;
    default:
      return EXPENSE_GRAYS[index % EXPENSE_GRAYS.length];
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

export function SankeyDiagram() {
  const { data, isLoading } = useCashflowSankey();
  const currency = useCurrencyStore((s) => s.currency);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const width = 800;
  const height = 500;
  const margin = { top: 16, right: 120, bottom: 16, left: 120 };

  const layout = useMemo(() => {
    if (!data || data.nodes.length === 0 || data.links.length === 0) return null;

    const nodeIdMap = new Map<string, number>();
    data.nodes.forEach((n, i) => nodeIdMap.set(n.id, i));

    const nodes: NodeDatum[] = data.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
    }));

    const links: LinkDatum[] = data.links
      .filter(
        (l) => nodeIdMap.has(l.source) && nodeIdMap.has(l.target)
      )
      .map((l) => ({
        source: l.source,
        target: l.target,
        value: l.value,
      }));

    if (links.length === 0) return null;

    const generator = sankey<NodeDatum, LinkDatum>()
      .nodeId((d) => d.id)
      .nodeWidth(14)
      .nodePadding(16)
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
        <h2 className="font-display text-xl font-medium text-on-surface mb-6">
          Cashflow
        </h2>
        <div className="h-[500px] animate-pulse rounded-xl bg-surface-container-lowest" />
      </div>
    );
  }

  if (!data || !layout) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6">
        <h2 className="font-display text-xl font-medium text-on-surface mb-6">
          Cashflow
        </h2>
        <div className="flex h-[500px] items-center justify-center">
          <p className="font-mono text-sm text-on-surface-variant">
            No cashflow data for last month
          </p>
        </div>
      </div>
    );
  }

  const pathGenerator = sankeyLinkHorizontal<SNode, SLink>();
  const incomeIdx = { current: 0 };
  const expenseIdx = { current: 0 };

  return (
    <div className="rounded-2xl bg-surface-container-low p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-medium text-on-surface">
          Cashflow
        </h2>
        <p className="font-mono text-xs text-on-surface-variant">
          {data.month}
        </p>
      </div>

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
            let colorIndex = 0;
            if (node.type === "income") {
              colorIndex = incomeIdx.current++;
            } else if (node.type === "expense") {
              colorIndex = expenseIdx.current++;
            }

            const x0 = node.x0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y0 = node.y0 ?? 0;
            const y1 = node.y1 ?? 0;
            const nodeHeight = y1 - y0;

            if (nodeHeight < 1) return null;

            const color = getNodeColor(node as NodeDatum, colorIndex);
            const isLeft = x0 < width / 2;

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
                  x={isLeft ? x0 - 8 : x1 + 8}
                  y={(y0 + y1) / 2}
                  textAnchor={isLeft ? "end" : "start"}
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
