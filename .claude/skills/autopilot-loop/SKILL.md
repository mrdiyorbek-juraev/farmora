---
name: autopilot-loop
description: Autonomous delivery cycle - iterative loop until completion quality met
disable-model-invocation: true
---

# /autopilot-loop — Autonomous Delivery Cycle

Run a strict iterative loop for a scoped task until completion quality is met.

## Required cycle (in order)

1. **Plan**
   - Restate goal, constraints, and explicit acceptance criteria.
   - Identify touched code areas (server action / lib/server / model / view / service).
2. **Implement**
   - Make the smallest viable code change set.
   - Keep edits scoped; avoid unrelated refactors.
3. **Verify**
   - `pnpm dlx ultracite check`
   - `pnpm --filter web build` (and `pnpm --filter web test` if there are tests in the touched area)
   - Record failures and fix before continuing.
4. **Doc Sync**
   - Update `apps/web/.claude/CLAUDE.md` if the change introduces a new pattern, invariant, or sub-path convention.
   - Update the relevant rule under `.claude/rules/` if a coding pattern changed.
5. **Summarize**
   - Report what changed, verification results, and residual risk.

## Hard gates

- Do not skip steps 3–4.
- If verification fails, return to step 2.
- If docs/rules drifted because of this change, return to step 4.
- Stop only when acceptance criteria pass and docs are in sync.

## Exit template

- Goal: ...
- Code changes: ...
- Verification: lint / build / test outcomes
- Doc updates: files updated, or "none"
- Remaining risks: ...
