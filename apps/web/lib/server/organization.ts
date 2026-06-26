import "server-only";

import { auth, clerkClient, currentUser } from "@repo/auth/server";
import { createAdminClient } from "@repo/database/admin";
import type { Membership, Organization } from "@repo/database/types";

export class OrgUnauthenticatedError extends Error {
  constructor() {
    super("Not signed in.");
    this.name = "OrgUnauthenticatedError";
  }
}

export class OrgNotSelectedError extends Error {
  constructor() {
    super("No organization selected. Pick or create one first.");
    this.name = "OrgNotSelectedError";
  }
}

export class OrgProvisioningError extends Error {
  constructor(cause?: unknown) {
    super("Failed to provision organization or membership.");
    this.name = "OrgProvisioningError";
    this.cause = cause;
  }
}

export type CurrentOrgContext = {
  userId: string;
  organization: Organization;
  membership: Membership;
};

/**
 * Resolve the current Clerk session's organization + membership,
 * creating both rows on first access. Throws when the user is signed out
 * or hasn't picked an org (Clerk's `OrganizationSwitcher` with
 * `hidePersonal` forces an org choice).
 */
export async function getCurrentOrganization(): Promise<CurrentOrgContext> {
  const { userId, orgId } = await auth();
  if (!userId) {
    throw new OrgUnauthenticatedError();
  }
  if (!orgId) {
    throw new OrgNotSelectedError();
  }

  const db = createAdminClient();

  const organization = await upsertOrganization(db, orgId);
  const membership = await upsertMembership(db, {
    organizationId: organization.id,
    clerkUserId: userId,
  });

  return { userId, organization, membership };
}

async function upsertOrganization(
  db: ReturnType<typeof createAdminClient>,
  clerkOrgId: string
): Promise<Organization> {
  const existing = await db
    .from("organizations")
    .select("*")
    .eq("clerk_org_id", clerkOrgId)
    .maybeSingle();

  if (existing.error) {
    throw new OrgProvisioningError(existing.error);
  }
  if (existing.data) {
    return existing.data;
  }

  // First request for this org — fetch its display name from Clerk
  const clerk = await clerkClient();
  const clerkOrg = await clerk.organizations.getOrganization({
    organizationId: clerkOrgId,
  });

  const inserted = await db
    .from("organizations")
    .insert({
      clerk_org_id: clerkOrgId,
      name: clerkOrg.name,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw new OrgProvisioningError(inserted.error);
  }
  return inserted.data;
}

async function upsertMembership(
  db: ReturnType<typeof createAdminClient>,
  args: { organizationId: string; clerkUserId: string }
): Promise<Membership> {
  const existing = await db
    .from("memberships")
    .select("*")
    .eq("organization_id", args.organizationId)
    .eq("clerk_user_id", args.clerkUserId)
    .maybeSingle();

  if (existing.error) {
    throw new OrgProvisioningError(existing.error);
  }
  if (existing.data) {
    return existing.data;
  }

  const user = await currentUser();
  if (!user) {
    throw new OrgUnauthenticatedError();
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new OrgProvisioningError(
      new Error("Clerk user has no email address.")
    );
  }

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  const inserted = await db
    .from("memberships")
    .insert({
      organization_id: args.organizationId,
      clerk_user_id: args.clerkUserId,
      email,
      full_name: fullName,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw new OrgProvisioningError(inserted.error);
  }
  return inserted.data;
}
