"use server";

import { getDashboardMetrics } from "@/lib/server/dashboard";
import { getCurrentOrganization } from "@/lib/server/organization";
import type { DashboardDateRange } from "@/models/dashboard";

export async function getDashboardMetricsAction(
  dateRange?: DashboardDateRange | null
) {
  const { organization } = await getCurrentOrganization();
  return getDashboardMetrics(organization.id, dateRange);
}
