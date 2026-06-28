"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { AlertCircle, Plus, Weight } from "lucide-react";

import type { CattleWithHistory } from "@/models/cattle";
import { useCattleWeightHistory } from "@/services/weight";
import { useGlobalModal } from "@/stores/shared/modal-store";

import { WeightChart } from "../weight-chart";
import { WeightHistoryTable } from "../weight-history-table";

export function WeightHistory({ animal }: { animal: CattleWithHistory }) {
  const { weightHistory } = useCattleWeightHistory(animal.id);
  const { setModal } = useGlobalModal();

  const openRecordModal = () =>
    setModal({
      weightForm: { open: true, cattleId: animal.id, editing: null },
    });

  if (weightHistory.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-80 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  if (weightHistory.isError) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Couldn&rsquo;t load weight history</EmptyTitle>
          <EmptyDescription>
            {weightHistory.error instanceof Error
              ? weightHistory.error.message
              : "Something went wrong reading this animal's weight history."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const series = weightHistory.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {series.length === 0
            ? "No weigh-ins recorded yet."
            : `${series.length} weigh-in${series.length === 1 ? "" : "s"} recorded.`}
        </p>
        <Button onClick={openRecordModal} size="sm">
          <Plus />
          Record weight
        </Button>
      </div>

      {series.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Weight />
            </EmptyMedia>
            <EmptyTitle>No weight recorded yet</EmptyTitle>
            <EmptyDescription>
              Record a weigh-in to start tracking this animal&rsquo;s growth
              over time.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <WeightChart animal={animal} series={series} />
          <WeightHistoryTable cattleId={animal.id} series={series} />
        </>
      )}
    </div>
  );
}
