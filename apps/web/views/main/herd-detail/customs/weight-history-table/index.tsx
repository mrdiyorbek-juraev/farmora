"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { format, isValid, parseISO } from "date-fns";
import { Trash2 } from "lucide-react";

import { formatLb } from "@/lib/utils/weight";
import type { WeightMeasurementWithGain } from "@/models/weight";
import { useWeightMutations } from "@/services/weight/mutations";

interface WeightHistoryTableProps {
  cattleId: string;
  /** Oldest-first series from listWeightHistory. */
  series: WeightMeasurementWithGain[];
}

function formatDate(value: string): string {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : "—";
}

export function WeightHistoryTable({
  cattleId,
  series,
}: WeightHistoryTableProps) {
  const { onDelete } = useWeightMutations(cattleId);
  // Newest-first for the log, while the chart consumes the same series
  // oldest-first. Spread first so the source array stays untouched.
  const rows = [...series].reverse();

  return (
    <section className="rounded-md border border-border">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold text-sm">Weight history</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity date</TableHead>
            <TableHead className="text-right">Weight (lb)</TableHead>
            <TableHead className="text-right">Avg. daily gain (lb)</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-12 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="tabular-nums">
                {formatDate(row.measured_at)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatLb(row.weight_kg)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatLb(row.average_daily_gain_kg)}
              </TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">
                {row.note ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      aria-label="Delete measurement"
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete measurement?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the {formatDate(row.measured_at)} weigh-in
                        ({formatLb(row.weight_kg)} lb). This can&rsquo;t be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete.mutate({ id: row.id })}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
