---
name: feature
description: New feature workflow - research, plan, implement, test
---

# /feature — New Feature Workflow

Given a feature description, follow this exact workflow.

## 1. Research

- Read the relevant pattern docs from `apps/web/.claude/CLAUDE.md` that match the feature.
- Read existing code in the same domain to understand conventions. Start with `apps/web/app/_actions/<domain>.ts`, `apps/web/lib/server/<domain>.ts`, `apps/web/models/<domain>.ts`, and `apps/web/services/<domain>/`.
- Check `packages/design-system/components/ui/` if this involves UI — use existing `@repo/design-system` components, don't recreate what exists. For composed inputs, use `InputGroup`.
- Check existing `lib/`, hooks, and stores before creating new ones.

## 2. Plan

- Use TodoWrite to create a checklist of all tasks.
- Identify all files to create or modify.
- For complex features (5+ files or architectural decisions), present the plan and wait for user approval before implementing.

## 3. Implement

- Follow the pattern docs exactly — don't invent new conventions.
- Work in small, focused steps — complete one piece before starting the next.
- Mark items complete in TodoWrite as you go.
- Use `@repo/design-system` components for any UI work — never create custom HTML that duplicates them.
- Server-side changes follow the action pattern: Zod schema in `models/` → helper in `lib/server/` → wrapper in `app/_actions/` → mutation hook in `services/<domain>/mutations.ts`.

## 4. Verify

Run these checks on the code you changed:

```bash
# Lint and format
pnpm dlx ultracite check

# Build the web app (catches TypeScript errors)
pnpm --filter web build
```

Must pass before considering the feature done. If either fails:
- **Lint errors**: Run `pnpm dlx ultracite fix` to auto-fix, then re-check.
- **Build/TS errors**: Read the error output, fix the root cause, and re-run.
- Do NOT skip verification or move on with failures.

## 5. Self-Review

Review every file you created or modified:

- **Stack compliance**: Server action present in `app/_actions/<domain>.ts`? Helper in `lib/server/<domain>.ts` org-scoped? Zod schema in `models/<domain>.ts`?
- **Pattern compliance**: Component structure, modal flat-single-file convention, service mutations layer.
- **Import paths**: Using `@repo/design-system/components/ui/<name>` direct imports?
- **Security**: No hardcoded secrets, Zod-validated input, `rel="noopener"` on external links, `getCurrentOrganization()` called before any DB call?
- **Accessibility**: Semantic HTML, ARIA labels on icon-only buttons, keyboard handlers alongside pointer events?
- **Performance**: No unnecessary re-renders, parallel awaits with `Promise.all`, debounced server calls where the user types?

For each finding:
- **Issue**: Fix it now, re-run verify after fixing.
- **Suggestion**: Note it in the summary under "Known improvements".

## 6. Summarize

Provide a short summary:
- **What was built**: describe the feature from the user's perspective.
- **Architecture decisions**: any patterns or approaches chosen and why.
- **Files created/modified**: list with brief description of each.
- **What's NOT included**: anything explicitly out of scope.

## Optional: Browser Vision

If the user requests visual verification, or the feature involves complex UI:

1. Invoke the `/visual-qa` skill.
2. Take or request screenshots of the implemented feature.
3. Analyze using the visual QA checklist (alignment, spacing, typography, colors, component correctness, responsive states, interactive states).
4. Report findings using the format from that skill.
