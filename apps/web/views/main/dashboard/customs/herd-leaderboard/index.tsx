"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { cn } from "@repo/design-system/lib/utils";
import { Grid2x2 } from "lucide-react";

import type { Breed } from "@/models/cattle";
import { type AgeBucket, ageBucketLabels } from "@/models/dashboard";
import type { HerdLeaderboardProps } from "@/types/main/dashboard";

const bucketOrder: AgeBucket[] = ["calf", "young", "adult", "mature"];

const breedLabels: Record<Breed, string> = {
  holstein: "Holstein",
  jersey: "Jersey",
  angus: "Angus",
  hereford: "Hereford",
  brown_swiss: "Brown Swiss",
  guernsey: "Guernsey",
  charolais: "Charolais",
  simmental: "Simmental",
  other: "Other",
};

const numberFormatter = new Intl.NumberFormat();
const ROW_LIMIT = 8;

export function HerdLeaderboard({ data }: HerdLeaderboardProps) {
  // Aggregate breed totals so we can rank rows by herd size, then
  // pivot into a row-per-breed × column-per-bucket matrix.
  const breedTotals = new Map<Breed, number>();
  const cellByKey = new Map<string, number>();
  for (const entry of data) {
    breedTotals.set(
      entry.breed,
      (breedTotals.get(entry.breed) ?? 0) + entry.count
    );
    cellByKey.set(`${entry.breed}|${entry.bucket}`, entry.count);
  }

  const breeds = Array.from(breedTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, ROW_LIMIT)
    .map(([breed]) => breed);

  // Max cell value seeds the heatmap tint so the busiest cohort sits
  // at 100% saturation and everything else scales relative to it.
  let max = 0;
  for (const value of cellByKey.values()) {
    if (value > max) {
      max = value;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Herd leaderboard</CardTitle>
        <CardDescription>
          Top breeds split across age cohorts — heatmap tint scales with cohort
          size.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {breeds.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Breed</TableHead>
                {bucketOrder.map((bucket) => (
                  <TableHead className="text-right" key={bucket}>
                    {ageBucketLabels[bucket]}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breeds.map((breed) => {
                const total = breedTotals.get(breed) ?? 0;
                return (
                  <TableRow key={breed}>
                    <TableCell className="font-medium text-foreground">
                      {breedLabels[breed]}
                    </TableCell>
                    {bucketOrder.map((bucket) => {
                      const count = cellByKey.get(`${breed}|${bucket}`) ?? 0;
                      return <HeatCell count={count} key={bucket} max={max} />;
                    })}
                    <TableCell className="text-right font-medium text-foreground tabular-nums">
                      {numberFormatter.format(total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

type HeatCellProps = {
  count: number;
  max: number;
};

function HeatCell({ count, max }: HeatCellProps) {
  // Floor non-zero cells at 15% alpha so they're still legible — full
  // transparency would make a "1 animal" cell vanish next to a busy
  // one.
  const ratio = max === 0 ? 0 : count / max;
  const alpha = count === 0 ? 0 : 0.15 + ratio * 0.55;
  return (
    <TableCell
      className={cn(
        "text-right tabular-nums",
        count === 0 ? "text-muted-foreground/60" : "text-foreground"
      )}
      style={{
        backgroundColor:
          count === 0
            ? undefined
            : `color-mix(in oklch, var(--chart-2) ${
                alpha * 100
              }%, transparent)`,
      }}
    >
      {count === 0 ? "—" : numberFormatter.format(count)}
    </TableCell>
  );
}

function EmptyState() {
  return (
    <Empty className="h-40 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Grid2x2 />
        </EmptyMedia>
        <EmptyTitle>No DOB recorded yet</EmptyTitle>
        <EmptyDescription>
          Add birth dates to populate the cohort table.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}