---
name: fix
description: Bug fix workflow - understand, fix, test, verify
---

# /fix — Bug Fix Workflow

Given a bug description, follow this exact workflow.

## 1. Understand

- Read the relevant source files where the bug likely lives.
- Read the related pattern doc from `apps/web/.claude/CLAUDE.md` to understand the expected pattern.
- For a server-side bug, trace through: `app/_actions/<domain>.ts` → `lib/server/<domain>.ts` → DB. For a UI bug, trace: `views/...` → `services/<domain>/` → server action.

## 2. Reproduce

- Identify what the correct behavior should be.
- Identify what's actually happening (the bug).
- Find the root cause — don't guess, trace the logic.

## 3. Check Escalation

If this bug touches any of the following, STOP and tell the user before proceeding:
- Authentication, permissions, or the org-scoping invariant.
- Database schema or migrations.
- Billing or pricing logic (not yet present here, but if it appears).
- Anything in `getCurrentOrganization()` — that's the JIT provisioning entry point.

## 4. Fix

- Minimal changes — fix the root cause only.
- Don't refactor surrounding code — fix the bug and nothing else.
- Follow the patterns in `apps/web/.claude/CLAUDE.md`.

## 5. Verify

Run these checks on the code you changed:

```bash
# Lint and format
pnpm dlx ultracite check

# Build the web app (catches TypeScript errors)
pnpm --filter web build
```

Must pass before continuing. If either fails:
- **Lint errors**: Run `pnpm dlx ultracite fix` to auto-fix, then re-check.
- **Build/TS errors**: Read the error output, fix the root cause, and re-run.
- Do NOT skip verification or move on with failures.

## 6. Self-Review

Review every file you modified:

- **Root cause addressed**: Does the fix target the actual cause, not a symptom?
- **No regressions**: Could this change break any other path through the code?
- **Pattern compliance**: Does it still match the project's server-action / model / service conventions?
- **Minimal diff**: Did you change only what was necessary?

For each finding:
- **Issue**: Fix it now, re-run verify.
- **Suggestion**: Note in summary under "Known improvements".

## 7. Summarize

Provide a short summary:
- **What was broken**: describe the user-facing symptom.
- **Root cause**: what was actually wrong in the code.
- **Fix**: what you changed and why.
- **Files changed**: list of modified files.

## Optional: Browser Vision

If the user requests visual verification, or the fix involves UI layout changes:

1. Invoke `/visual-qa`.
2. Take or request before/after screenshots.
3. Analyze using the visual QA checklist.
4. Report before/after comparison.
