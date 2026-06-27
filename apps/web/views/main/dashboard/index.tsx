"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import type { Filter } from "@repo/design-system/components/composed/filters";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { AlertTriangle, CalendarDays, Heart, Plus, Users } from "lucide-react";
import { useState } from "react";

import {
  type DashboardRangePreset,
  dashboardRangePresets,
} from "@/models/dashboard";
import { useDashboardMetrics } from "@/services/dashboard";
import { useHerdStore } from "@/stores/herd";
import { useGlobalModal } from "@/stores/shared/modal-store";

import { BreedComposition } from "./customs/breed-composition";
import { GenderRatio } from "./customs/gender-ratio";
import { MetricCard } from "./customs/metric-card";
import { RecentAdditions } from "./customs/recent-additions";
import { StatusBreakdown } from "./customs/status-breakdown";
import { AnimalFormModal } from "../herd/modals/create-animal-modal";

const DEFAULT_RANGE: DashboardRangePreset = "30d";

// Build a single-value Filter the way the design-system's Filters
// component would. The herd page's `mapToListInput` only reads `field`
// and `values[0].value`, so the operator + id can be any stable string
// — using a fixed "dashboard-<field>" id makes the filter idempotent
// when the user revisits from the dashboard.
function buildSingleFilter(
  field: "status" | "breed" | "gender",
  value: string,
  label: string
): Filter {
  return {
    field,
    id: `dashboard-${field}`,
    operator: "is",
    values: [{ value, label }],
  };
}

export function DashboardView() {
  const [range, setRange] = useState<DashboardRangePreset>(DEFAULT_RANGE);
  const { metrics } = useDashboardMetrics(range);
  const setModal = useGlobalModal((state) => state.setModal);
  const setHerdFilters = useHerdStore((state) => state.setFilters);

  const handleAddNew = () => {
    setModal({ animalForm: { open: true, props: null } });
  };

  const handleNavigateAll = () => {
    setHerdFilters([]);
  };

  const handleNavigateNeedsAttention = () => {
    setHerdFilters([buildSingleFilter("status", "sick", "Sick")]);
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <SubHeader
        onAddNew={handleAddNew}
        onRangeChange={setRange}
        range={range}
      />

      <DashboardBody
        metrics={metrics}
        onNavigateAll={handleNavigateAll}
        onNavigateNeedsAttention={handleNavigateNeedsAttention}
      />

      <AnimalFormModal />
    </div>
  );
}

type SubHeaderProps = {
  range: DashboardRangePreset;
  onRangeChange: (next: DashboardRangePreset) => void;
  onAddNew: () => void;
};

function SubHeader({ range, onRangeChange, onAddNew }: SubHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Select
        onValueChange={(value) => onRangeChange(value as DashboardRangePreset)}
        value={range}
      >
        <SelectTrigger aria-label="Date range" className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dashboardRangePresets.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={onAddNew}>
        <Plus />
        Add new animal
      </Button>
    </div>
  );
}

type DashboardBodyProps = {
  metrics: ReturnType<typeof useDashboardMetrics>["metrics"];
  onNavigateAll: () => void;
  onNavigateNeedsAttention: () => void;
};

function DashboardBody({
  metrics,
  onNavigateAll,
  onNavigateNeedsAttention,
}: DashboardBodyProps) {
  if (metrics.isPending) {
    return <DashboardSkeleton />;
  }

  if (metrics.isError || !metrics.data) {
    return (
      <Card className="bg-destructive/5 ring-destructive/40 dark:bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">
            Couldn't load dashboard
          </CardTitle>
          <CardDescription>
            {metrics.error?.message ?? "Failed to load dashboard metrics."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const data = metrics.data;
  const isEmpty = data.totalCount === 0;
  const archivedCount = data.totalCount - data.activeHerdSize;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emptyHint="Add animals to start tracking"
          hint={
            archivedCount > 0
              ? `${archivedCount} sold or deceased`
              : "All animals counted"
          }
          href="/herd"
          icon={<Users className="size-3.5" />}
          label="Total cattle"
          onClick={onNavigateAll}
          value={isEmpty ? null : data.totalCount}
        />
        <MetricCard
          emptyHint="No active animals yet"
          hint="Excludes sold and deceased"
          href="/herd"
          icon={<Heart className="size-3.5" />}
          label="Active herd size"
          onClick={onNavigateAll}
          value={isEmpty ? null : data.activeHerdSize}
        />
        <MetricCard
          emptyHint="Nothing flagged"
          hint={
            data.needsAttention > 0
              ? "Sick animals waiting on care"
              : "All clear for now"
          }
          href="/herd"
          icon={<AlertTriangle className="size-3.5" />}
          label="Needs attention"
          onClick={onNavigateNeedsAttention}
          tone={data.needsAttention > 0 ? "destructive" : "default"}
          value={isEmpty ? null : data.needsAttention}
        />
        <MetricCard
          emptyHint="Add birth dates to see this"
          hint="Across active animals only"
          href="/herd"
          icon={<CalendarDays className="size-3.5" />}
          label="Avg age"
          onClick={onNavigateAll}
          suffix="mo"
          value={data.avgAgeMonths}
        />
      </div>

      {/* Row 2 — Three composition widgets sharing the same row at lg+. */}
      {/* Stacks vertically below lg; pairs up at sm-md. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatusBreakdown data={data.byStatus} total={data.totalCount} />
        <GenderRatio data={data.byGender} />
        <BreedComposition data={data.byBreed} />
      </div>

      {/* Row 3 — Recent additions table, full width. */}
      <RecentAdditions rows={data.recentAdditions} />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-72" />
    </>
  );
}
