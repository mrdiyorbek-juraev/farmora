---
paths: "apps/web/**/*.integration.test.*", "apps/web/tests/integration/**"
---

# Integration Tests

> Integration tests run against real infrastructure — Clerk (auth) and Supabase (database). They are intentionally separate from unit tests so they never run during local `vitest run` or in the Vercel build. **There are no API routes here** — these tests exercise server actions directly.

## When they run

| Trigger | Command |
|---------|---------|
| Locally | `pnpm --filter web test:integration` |
| CI | Wire up via `.github/workflows/integration-tests.yml` when added |

They do **not** run during `pnpm --filter web test`, `turbo test`, or Vercel builds.

## File conventions

- Test files: `*.integration.test.ts(x)` — colocated with the server action they exercise.
- Global setup: `apps/web/tests/integration/global-setup.ts`.
- Vitest config: `apps/web/vitest.integration.config.ts`.

## How it works

### Global setup

Before any test file runs, `global-setup.ts` executes once and:

1. Creates a real Clerk user + organization via the Clerk Backend API.
2. Creates a Clerk session with `active_organization_id` so the JWT carries the `o` claim.
3. Mirrors the user, org, and membership into Supabase via `upsert` (idempotent against Clerk webhook race conditions). This matches the JIT provisioning in `apps/web/lib/server/organization.ts`.
4. Provides `userId`, `orgId`, `sessionId`, and `email` to test workers via Vitest's `provide()` / `inject()` bridge.

After all tests finish, teardown deletes everything in FK dependency order, then removes the Clerk org and user.

### Auth token

Each test file calls `clerkClient.sessions.getToken(sessionId, undefined, 3600)` in `beforeAll` to get a JWT with a one-hour expiry. Pass it in calls that simulate a logged-in user.

### Calling server actions directly

Since there are no route handlers, integration tests can import and call the server action function directly. Mock the Clerk session if needed, or use the test session token plus the helpers in `lib/server/organization.ts` to set up org context.

```ts
import { describe, it, expect, inject, beforeAll } from "vitest";
import { createCattleAction } from "@/app/_actions/cattle";
import { setupTestSession } from "../tests/integration/helpers"; // wires up the Clerk session header

beforeAll(async () => {
  await setupTestSession({
    sessionId: inject("sessionId") as string,
  });
});

describe("createCattleAction", () => {
  it("rejects duplicate tag in the same org", async () => {
    await createCattleAction({
      tag_number: "INT-001",
      breed: "holstein",
      gender: "female",
      date_of_birth: "2024-01-01",
      acquisition: "born_on_farm",
    });

    await expect(
      createCattleAction({
        tag_number: "INT-001",
        breed: "holstein",
        gender: "female",
        date_of_birth: "2024-01-01",
        acquisition: "born_on_farm",
      })
    ).rejects.toThrowError(/already exists/i);
  });
});
```

### Environment variables

Locally: read from `apps/web/.env` and `apps/web/.env.local`.

In CI: pull from Vercel's `preview` environment via `vercel env pull` before the tests run. Required GitHub Actions secrets if wired up:

| Secret | Where to find it |
|--------|-----------------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Team Settings → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → Project ID |

## Available inject values

| Key | Type | Description |
|-----|------|-------------|
| `userId` | `string` | Clerk user ID |
| `orgId` | `string` | Clerk organization ID |
| `sessionId` | `string` | Clerk session ID (use to get a JWT) |
| `email` | `string` | Test user email address |

## Key design decisions

- **`upsert` not `insert`** in global setup — Clerk webhooks can fire asynchronously and pre-create Supabase records before the setup reaches its own insert. Upsert is idempotent against that race AND mirrors `getCurrentOrganization()`'s JIT behaviour.
- **`beforeAll` not `beforeEach`** for the token — the token has a 3600s expiry so one token per file is sufficient.
- **`tests/` excluded from `tsconfig.json`** — prevents Vitest-specific types from breaking the Next build.
- **Separate vitest config** — `vitest.integration.config.ts` keeps integration tests isolated. The unit config (`vitest.config.ts`) excludes `*.integration.test.*`.

> **Status:** The integration-test scaffolding may not yet exist in this repo. If you go to wire it up, mirror the structure documented above and use `apps/web/lib/server/organization.ts` as the reference for what global-setup needs to provision in Supabase.
