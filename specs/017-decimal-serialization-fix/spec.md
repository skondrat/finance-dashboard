# Feature Specification: Decimal Serialization Fix

**Feature Branch**: `017-decimal-serialization-fix`
**Created**: 2026-03-29
**Status**: Complete

## Summary

Pydantic v2 serializes `Decimal` fields as strings in JSON responses (e.g. `"50.00"` instead of `50.00`). This caused sort bugs (string comparison instead of numeric) and progress bar bugs (strict equality `=== 0` failed against `"0.00"`) that were patched in PR #12 with frontend `Number()` coercion.

This fix addresses the root cause by configuring a custom JSON response class that serializes Decimals as floats globally, and removes the frontend `Number()` workarounds.
