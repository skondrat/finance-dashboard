# Finance Dashboard Constitution

## Core Principles

### I. Feature Delivery Workflow

When the user specifies a feature (or list of features), execute this end-to-end pipeline for each:

1. **Checkout & pull main** — `git checkout main && git pull origin main`
2. **Specify** — `/speckit.specify` with the feature description. Write the spec, create the checklist, validate.
3. **Plan** — `/speckit.plan`. Write plan.md, research.md, quickstart.md, data-model.md (if needed), contracts/ (if needed). Run agent context update.
4. **Tasks** — `/speckit.tasks`. Generate tasks.md with implementation tasks.
5. **Implement** — `/speckit.implement`. Execute all tasks, mark each done in tasks.md.
6. **Test** — Start backend + frontend servers, test manually with browser MCP (Playwright). Take screenshots as evidence.
7. **Commit** — Stage only feature-related files, commit with descriptive message.
8. **Push & PR** — `git push -u origin <branch>`, create PR with `gh pr create`.
9. **Merge** — `gh pr merge <number> --merge`.
10. **Mark done** — Update ideas.md (strikethrough + PR number) if the feature came from the backlog.

If multiple features are specified as one batch, combine them into a single spec/branch. Otherwise, execute each as a separate branch with its own full cycle.

### II. Combine Small Related Features

When the user groups related features (e.g., "do the budget UI improvements in one spec"), combine them into a single branch/spec. Each becomes a separate user story within the spec.

### III. Always Test with Browser

After implementation, always start both servers and verify with Playwright MCP before committing. Don't skip this step or mark it as "verified via code review" unless the test infrastructure genuinely can't support it (e.g., requires specific external services).

### IV. Ideas Tracking

The file `ideas.md` at the repo root is the feature backlog. When completing a feature from this list, mark it with strikethrough and the PR number: `~~feature text~~ (DONE - PR #N)`.

### V. Git Hygiene

- Always start from latest main
- One branch per feature (or feature group)
- Commit, push, create PR, merge — don't leave branches hanging
- Pull main after merge before starting next feature

### VI. Keep It Simple

- Skip speckit steps that add no value for trivial changes (e.g., a 1-file backend fix doesn't need data-model.md or contracts/)
- Don't create unnecessary abstractions or over-engineer
- Frontend-only changes don't need backend artifacts and vice versa

## Governance

This constitution defines the standard workflow for all feature development in this project. Follow it unless the user explicitly requests a different approach.

**Version**: 1.0 | **Ratified**: 2026-03-29
