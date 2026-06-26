"use server";

import { getDashboardMetrics } from "@/lib/server/dashboard";
import { getCurrentOrganization } from "@/lib/server/organization";

export async function getDashboardMetricsAction() {
  const { organization } = await getCurrentOrganization();
  return getDashboardMetrics(organization.id);
}
