"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { differenceInMonths, format, isValid, parseISO } from "date-fns";

import type { Status } from "@/models/cattle";
import type { AnimalSubHeaderProps } from "@/types/main/herd-detail";

const statusLabels: Record<Status, string> = {
  active: "Active",
  sick: "Sick",
  pregnant: "Pregnant",
  sold: "Sold",
  deceased: "Deceased",
};

const statusVariant: Record<
  Status,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  sick: "destructive",
  pregnant: "secondary",
  sold: "outline",
  deceased: "outline",
};

function computeAgeLabel(dob: string | null | undefined): string | null {
  if (!dob) {
    return null;
  }
  const parsed = parseISO(dob);
  if (!isValid(parsed)) {
    return null;
  }
  const months = differenceInMonths(new Date(), parsed);
  if (months < 0) {
    return null;
  }
  if (months < 12) {
    return `${months} mo old`;
  }
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (remainder === 0) {
    return `${years} yr old`;
  }
  return `${years} yr ${remainder} mo old`;
}

export function AnimalSubHeader({ animal }: AnimalSubHeaderProps) {
  const age = computeAgeLabel(animal.date_of_birth);
  const addedAt = parseISO(animal.created_at);
  const addedLabel = isValid(addedAt)
    ? `Added ${format(addedAt, "MMM d, yyyy")}`
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-border border-b bg-muted/40 px-4 py-2">
      <Badge variant={statusVariant[animal.status]}>
        {statusLabels[animal.status]}
      </Badge>
      {age ? <Badge variant="outline">{age}</Badge> : null}
      {addedLabel ? (
        <span className="text-muted-foreground text-xs">{addedLabel}</span>
      ) : null}
    </div>
  );
}
