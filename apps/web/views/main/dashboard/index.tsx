"use client";

import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { differenceInCalendarDays, format, subDays } from "date-fns";
import { AlertTriangle, Baby, Heart } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  DashboardMetricsRange,
  HeadlineCounts,
} from "@/models/dashboard";
import { useDashboardMetrics } from "@/services/dashboard";
import { useGlobalModal } from "@/stores/shared/modal-store";

import { AnimalFormModal } from "../herd/modals/create-animal-modal";
import { ActiveRateGauge } from "./customs/active-rate-gauge";
import { AgeDistribution } from "./customs/age-distribution";
import { BreedComposition } from "./customs/breed-composition";
import { DashboardToolbar } from "./customs/dashboard-toolbar";
import type { DashboardDateRange } from "./customs/date-range-picker";
import { GenderRatio } from "./customs/gender-ratio";
import { HerdLeaderboard } from "./customs/herd-leaderboard";
import { MetricCard } from "./customs/metric-card";
import { StatusBreakdown } from "./customs/status-breakdown";

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
});

function defaultRange(): DashboardDateRange {
  return { from: subDays(new Date(), 89), to: new Date() };
}

function toQueryRange(range: DashboardDateRange): DashboardMetricsRange {
  return {
    from: format(range.from, "yyyy-MM-dd"),
    to: format(range.to, "yyyy-MM-dd"),
  };
}

// Muted section heading that makes the urgency hierarchy explicit:
// act-on-these sits above at-a-glance sits above planning charts.
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      {children}
    </h2>
  );
}


function buildDelta(
  current: number,
  previous: HeadlineCounts | null,
  key: keyof HeadlineCounts,
  improvement: "up" | "down" | null,
  caption: string
) {
  if (!previous) {
    return undefined;
  }
  return { value: current - previous[key], improvement, caption };
}

export function DashboardView() {
  const [range, setRange] = useState<DashboardDateRange>(defaultRange);
  const queryRange = useMemo(() => toQueryRange(range), [range]);
  const { metrics } = useDashboardMetrics(queryRange);
  const setModal = useGlobalModal((state) => state.setModal);

  const handleAddNew = () => {
    setModal({ animalForm: { open: true, props: null } });
  };

  if (metrics.isPending) {
    return (
      <div className="flex h-[calc(100svh-3rem)] flex-col">
        <DashboardToolbar
          onAddNew={handleAddNew}
          onRangeChange={setRange}
          range={range}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DashboardSkeleton />
        </div>
        <AnimalFormModal />
      </div>
    );
  }

  if (metrics.isError || !metrics.data) {
    return (
      <div className="flex h-[calc(100svh-3rem)] flex-col">
        <DashboardToolbar
          onAddNew={handleAddNew}
          onRangeChange={setRange}
          range={range}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive text-sm">
            {metrics.error?.message ?? "Failed to load dashboard metrics."}
          </div>
        </div>
        <AnimalFormModal />
      </div>
    );
  }

  const data = metrics.data;
  const activeShare =
    data.totalCount === 0 ? 0 : data.activeHerdSize / data.totalCount;
  const terminalCount = data.totalCount - data.activeHerdSize;

  // Window length drives the "vs prev Nd" caption on the trend badges.
  const spanDays = differenceInCalendarDays(range.to, range.from) + 1;
  const deltaCaption = `vs prev ${spanDays}d`;

  return (
    // Bound the view to the viewport minus the SiteHeader (h-12, 3rem)
    // so the inner column can own the vertical scroll instead of the
    // page itself growing past the viewport.
    <div className="flex h-[calc(100svh-3rem)] flex-col">
      <DashboardToolbar
        onAddNew={handleAddNew}
        onRangeChange={setRange}
        range={range}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          <SectionLabel>Act on these</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              delta={buildDelta(
                data.needsAttention,
                data.previous,
                "needsAttention",
                "down",
                deltaCaption
              )}
              description="Act today — sick animals waiting on care."
              icon={
                data.needsAttention > 0 ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <Heart className="size-4" />
                )
              }
              label="Needs attention"
              tone={data.needsAttention > 0 ? "destructive" : "default"}
              value={data.needsAttention}
            />
            <MetricCard
              delta={buildDelta(
                data.pregnantCount,
                data.previous,
                "pregnantCount",
                null,
                deltaCaption
              )}
              description="Expected calves — schedule check-ins and pen space."
              icon={<Baby className="size-4" />}
              label="Pregnant"
              value={data.pregnantCount}
            />
          </div>
        </div>

        {/* Tier 2 — the headline facts. Correct numbers a farmer       */}
        {/* references (herd size, active rate), not daily action items. */}
        <div className="flex flex-col gap-3">
          <SectionLabel>Herd at a glance</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              delta={buildDelta(
                data.activeHerdSize,
                data.previous,
                "activeHerdSize",
                "up",
                deltaCaption
              )}
              description={
                terminalCount === 0
                  ? "Every animal in the herd is still active."
                  : `The headline number — excludes ${terminalCount} sold or deceased.`
              }
              hint={
                data.totalCount === 0
                  ? undefined
                  : percentFormatter.format(activeShare)
              }
              icon={<Heart className="size-4" />}
              label="Active herd size"
              value={data.activeHerdSize}
            />
            <ActiveRateGauge active={data.activeHerdSize} total={data.totalCount} />
          </div>
        </div>

        {/* Tier 3 — composition & planning. Awareness metrics, not     */}
        {/* daily actions, so they sit below the fold by design.        */}
        <div className="flex flex-col gap-3">
          <SectionLabel>Composition & planning</SectionLabel>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StatusBreakdown data={data.byStatus} total={data.totalCount} />
            </div>
            <BreedComposition data={data.byBreed} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AgeDistribution data={data.byAge} />
            </div>
            <GenderRatio data={data.byGender} />
          </div>

          {/* Breed × Age leaderboard sits full-width at the bottom. */}
          <HerdLeaderboard data={data.byBreedAge} />
        </div>
      </div>

      <AnimalFormModal />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}