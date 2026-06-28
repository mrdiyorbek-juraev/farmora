"use server";

import { auth } from "@repo/auth/server";
import { getDashboardMetrics } from "@/lib/server/dashboard";
import {
  getCurrentOrganization,
  OrgUnauthenticatedError,
} from "@/lib/server/organization";
import {
  type DashboardMetricsRange,
  dashboardMetricsRangeSchema,
} from "@/models/dashboard";

export async function getDashboardMetricsAction(
  rawRange?: DashboardMetricsRange
) {
  const { userId } = await auth();
  if (!userId) {
    throw new OrgUnauthenticatedError();
  }
  const range = dashboardMetricsRangeSchema.parse(rawRange);
  const { organization } = await getCurrentOrganization();
  return getDashboardMetrics(organization.id, range);
}
