# Feature Specification: Cashflow Interactive Zoom

**Feature Branch**: `047-cashflow-interactive-zoom`  
**Created**: 2026-04-02  
**Status**: Draft  
**Input**: User description: "Should be more interactive, maybe with ability to zoom in zoom out"

## Requirements

- Mouse wheel zoom on the Sankey diagram
- Click-and-drag pan to move around when zoomed in
- Hover highlighting: when hovering a node, highlight all connected links and dim others
- Reset zoom button to return to default view
- Smooth transitions on zoom/pan

## Assumptions

- Frontend-only change to sankey-diagram.tsx
- No backend changes
