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
import { Pencil, Trash2 } from "lucide-react";

import { formatKg } from "@/lib/utils/weight";
import type { WeightMeasurementWithGain } from "@/models/weight";
import { useWeightMutations } from "@/services/weight/mutations";
import { useGlobalModal } from "@/stores/shared/modal-store";

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
  const setModal = useGlobalModal((state) => state.setModal);
  // Newest-first for the log, while the chart consumes the same series
  // oldest-first. Spread first so the source array stays untouched.
  const rows = [...series].reverse();

  const editMeasurement = (row: WeightMeasurementWithGain) =>
    setModal({ weightForm: { open: true, cattleId, editing: row } });

  return (
    <section className="rounded-md border border-border">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold text-sm">Weight history</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity date</TableHead>
            <TableHead className="text-right">Weight (kg)</TableHead>
            <TableHead className="text-right">Avg. daily gain (kg)</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-20 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="tabular-nums">
                {formatDate(row.measured_at)}
                {row.is_initial ? (
                  <span className="ml-2 text-muted-foreground text-xs">
                    (initial)
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatKg(row.weight_kg)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatKg(row.average_daily_gain_kg)}
              </TableCell>
              <TableCell className="max-w-48 truncate text-muted-foreground">
                {row.note ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-0.5">
                  <Button
                    aria-label="Edit measurement"
                    onClick={() => editMeasurement(row)}
                    size="icon"
                    variant="ghost"
                  >
                    <Pencil />
                  </Button>
                  {/* The initial (creation) weigh-in can't be deleted — only */}
                  {/* corrected — so the chart always keeps a starting point. */}
                  {row.is_initial ? null : (
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
                          <AlertDialogTitle>
                            Delete measurement?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the {formatDate(row.measured_at)}{" "}
                            weigh-in ({formatKg(row.weight_kg)} kg). This
                            can&rsquo;t be undone.
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
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
