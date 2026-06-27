import type { ReactNode } from "react";

import type {
  AgeBucketCount,
  BreedAgeCount,
  BreedCount,
  GenderCount,
  StatusCount,
} from "@/models/dashboard";

export interface DashboardDateRange {
  from: Date;
  to: Date;
}

export interface DateRangePickerProps {
  value: DashboardDateRange;
  onChange: (next: DashboardDateRange) => void;
}

export interface DashboardToolbarProps {
  range: DashboardDateRange;
  onRangeChange: (next: DashboardDateRange) => void;
  onAddNew: () => void;
}

export interface ActiveRateGaugeProps {
  active: number;
  total: number;
}

export interface AgeDistributionProps {
  data: AgeBucketCount[];
}

export interface BreedCompositionProps {
  data: BreedCount[];
}

export interface GenderRatioProps {
  data: GenderCount[];
}

export interface HerdLeaderboardProps {
  data: BreedAgeCount[];
}

export interface StatusBreakdownProps {
  data: StatusCount[];
  total: number;
}

export interface MetricCardDelta {
  /** Signed change versus the previous period. */
  value: number;
  /** Which direction is the good one — null means neutral (no colour). */
  improvement: "up" | "down" | null;
  /** Caption shown next to the change, e.g. "vs prev 90 days". */
  caption?: string;
}

export interface MetricCardProps {
  label: string;
  value: number;
  description?: string;
  hint?: string;
  icon: ReactNode;
  tone?: "default" | "destructive";
  isLoading?: boolean;
  delta?: MetricCardDelta;
}
