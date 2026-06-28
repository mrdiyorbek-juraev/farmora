"use client";

import { CreateOrganization, useOrganization } from "@repo/auth/client";
import type { ReactNode } from "react";

import Loader from "@/components/loaders";

// Every page under (main) is org-scoped: server actions throw
// OrgNotSelectedError when there's no active organization, and the
// React Query hooks are `enabled: Boolean(orgId)` — so with no org
// they never fetch and the UI sits in a permanent loading state.
//
// This gate blocks the app shell until the user has an active org.
// A brand-new user (no organizations yet) is shown Clerk's
// create-organization flow and cannot proceed without completing it.
export function OrgGate({ children }: { children: ReactNode }) {
  const { isLoaded, organization } = useOrganization();

  if (!isLoaded) {
    return <Loader />;
  }

  if (!organization) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <div className="flex max-w-sm flex-col items-center gap-2 text-center">
          <h1 className="font-semibold text-xl tracking-tight">
            Create your farm to get started
          </h1>
          <p className="text-muted-foreground text-sm">
            Farmora organizes everything by farm. Create an organization to
            continue — you can invite teammates later.
          </p>
        </div>
        <CreateOrganization
          afterCreateOrganizationUrl="/dashboard"
          skipInvitationScreen
        />
      </div>
    );
  }

  return <>{children}</>;
}
