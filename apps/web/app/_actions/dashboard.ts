"use server";

import {
  type DashboardMetricsRange,
  getDashboardMetrics,
} from "@/lib/server/dashboard";
import { getCurrentOrganization } from "@/lib/server/organization";

export async function getDashboardMetricsAction(range?: DashboardMetricsRange) {
  const { organization } = await getCurrentOrganization();
  return getDashboardMetrics(organization.id, range);
}
