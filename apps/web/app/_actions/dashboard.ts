"use server";

import { auth } from "@repo/auth/server";
import {
  type DashboardMetricsRange,
  getDashboardMetrics,
} from "@/lib/server/dashboard";
import {
  getCurrentOrganization,
  OrgUnauthenticatedError,
} from "@/lib/server/organization";

export async function getDashboardMetricsAction(range?: DashboardMetricsRange) {
  const { userId } = await auth();
  if (!userId) {
    throw new OrgUnauthenticatedError();
  }
  const { organization } = await getCurrentOrganization();
  return getDashboardMetrics(organization.id, range);
}