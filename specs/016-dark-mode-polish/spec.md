# Feature Specification: Dark Mode Polish

**Feature Branch**: `016-dark-mode-polish`
**Created**: 2026-03-29
**Status**: Complete

## Summary

Audit and fix all components for dark theme compatibility. The design token system (CSS variables) handles most components correctly, but chart components and the cashflow sankey diagram used hardcoded dark colors (`#1a1a1a`, etc.) that are invisible on dark backgrounds.

## Changes

1. **Budget charts** (income-vs-spend, investment-rate-trend): Replaced hardcoded `#1a1a1a` with `var(--on-surface)` for theme-aware colors
2. **Category distribution chart**: Updated `MONO_PALETTE` from dark-only grays to mid-range grays visible on both light and dark
3. **Cashflow sankey diagram**: Updated node colors from dark-only grays to mid-range grays; fixed link color from `rgba(0,0,0,0.08)` to `rgba(128,128,128,0.12)` visible on dark
4. **Shadow**: Added dark mode `--shadow-color` variable with stronger opacity (0.3 vs 0.06)
5. **Cursor fill**: Fixed chart cursor from `rgba(0,0,0,0.04)` to theme-aware value
