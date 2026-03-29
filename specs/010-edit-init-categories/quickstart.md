# Quickstart: Edit Init Categories

## What's Changing

Adding two capabilities to the Init Categories screen in the Import Statement modal:
1. **Inline budget editing** — click a budget value to edit it
2. **Category removal** — click an "x" button to delete a category

## Files to Modify

### Backend
- `backend/app/api/categories.py` — Add `DELETE /budget/categories/{category_id}` endpoint
- No model or schema changes needed

### Frontend
- `frontend/src/lib/queries/budget.ts` — Add `useUpdateCategory()` and `useDeleteCategory()` mutation hooks
- `frontend/src/components/budget/import-modal.tsx` — Update `InitCategories` component:
  - Make budget column cells click-to-edit
  - Add remove button column to category table
  - Wire up mutations

## Implementation Order

1. Backend: Add DELETE endpoint (small, isolated)
2. Frontend: Add mutation hooks (small, isolated)
3. Frontend: Update InitCategories table with inline edit and remove button

## Key Decisions

- Hard delete (not soft/archive) for categories during Init — no transactions exist yet
- DELETE returns 409 if category has transactions (safety guard for future use)
- No confirmation dialog on remove — easily reversible by re-uploading CSV
- Budget edit: click-to-edit with blur/Enter to confirm, Escape to cancel
