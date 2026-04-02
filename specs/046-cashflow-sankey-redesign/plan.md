# Implementation Plan: Cashflow Sankey Redesign

**Branch**: `046-cashflow-sankey-redesign` | **Date**: 2026-04-02 | **Spec**: [spec.md](spec.md)

## Summary

Redesign the Cashflow Sankey from a 2-level (income → expenses) to a 4-level flow: Income Sources → Income (merged) → Major Categories → Final Categories. Backend builds the 4-level node/link graph with a static major-category mapping. Frontend renders the wider Sankey with 4 columns.

## Changes

### Backend: `cashflow.py`
- Add a `MAJOR_CATEGORY_MAP` dict mapping category names → major group names
- Build 4 levels of nodes: income sources, single "income" node, major category nodes, final category nodes  
- Build links between adjacent levels only
- Add `level` field to each node (0-3) for frontend layout hints

### Frontend: `sankey-diagram.tsx`
- Update to handle 4-level node structure
- Adjust margins/width for 4 columns instead of 2
- Keep existing tooltip and color logic

### No other files change (KPI strip, breakdown row, query hook stay the same)
