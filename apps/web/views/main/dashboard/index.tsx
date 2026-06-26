"use client";

import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { AlertTriangle, Heart } from "lucide-react";

import { useDashboardMetrics } from "@/services/dashboard";

import { AgeDistribution } from "./customs/age-distribution";
import { BreedComposition } from "./customs/breed-composition";
import { GenderRatio } from "./customs/gender-ratio";
import { MetricCard } from "./customs/metric-card";
import { StatusBreakdown } from "./customs/status-breakdown";

export function DashboardView() {
  const { metrics } = useDashboardMetrics();

  if (metrics.isPending) {
    return <DashboardSkeleton />;
  }

  if (metrics.isError || !metrics.data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive text-sm">
          {metrics.error?.message ?? "Failed to load dashboard metrics."}
        </div>
      </div>
    );
  }

  const data = metrics.data;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Top row — "act today". Needs-attention sits front-and-center, */}
      {/* with the active herd size as the always-visible headline number. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricCard
          description="Act today — sick animals waiting on care."
          icon={<AlertTriangle className="size-4" />}
          label="Needs attention"
          tone="destructive"
          value={data.needsAttention}
        />
        <MetricCard
          description={`The headline number — excludes ${data.totalCount - data.activeHerdSize} sold or deceased.`}
          icon={<Heart className="size-4" />}
          label="Active herd size"
          value={data.activeHerdSize}
        />
      </div>

      {/* Operational snapshot. */}
      <StatusBreakdown data={data.byStatus} total={data.totalCount} />

      {/* Planning metrics — age / gender / breed sit side-by-side at lg. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AgeDistribution data={data.byAge} />
        <GenderRatio data={data.byGender} />
        <BreedComposition data={data.byBreed} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
