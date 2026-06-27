"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { cn } from "@repo/design-system/lib/utils";
import { differenceInMonths, parseISO } from "date-fns";

import type { Breed, Status } from "@/models/cattle";
import type { RecentAdditionItem } from "@/models/dashboard";

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

const statusLabels: Record<Status, string> = {
  active: "Active",
  sick: "Sick",
  pregnant: "Pregnant",
  sold: "Sold",
  deceased: "Deceased",
};

// Map cattle status to a Badge variant. `destructive` reserved for the
// urgent "sick" state; healthy / breeding statuses use the neutral
// `secondary` so they don't fight the chart palette.
const statusVariant: Record<
  Status,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "secondary",
  sick: "destructive",
  pregnant: "default",
  sold: "outline",
  deceased: "outline",
};

export type RecentAdditionsProps = {
  rows: RecentAdditionItem[];
};

export function RecentAdditions({ rows }: RecentAdditionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent additions</CardTitle>
        <CardDescription>The last few animals added to the herd.</CardDescription>
        {rows.length > 0 ? (
          <CardAction>
            <Badge className="tabular-nums" variant="outline">
              Last {rows.length}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground">
                    {row.tag_number}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-foreground",
                      !row.name && "text-muted-foreground"
                    )}
                  >
                    {row.name ?? "—"}
                  </TableCell>
                  <TableCell>{breedLabels[row.breed]}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>
                      {statusLabels[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAge(row.date_of_birth)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function formatAge(dob: string | null): string {
  if (!dob) {
    return "—";
  }
  const parsed = parseISO(dob);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }
  const months = differenceInMonths(new Date(), parsed);
  if (months < 0) {
    return "—";
  }
  if (months < 24) {
    return `${months} mo`;
  }
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} yr` : `${years}y ${rem}m`;
}

function EmptyState() {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed p-6 text-center">
      <p className="font-medium text-sm">No animals yet</p>
      <p className="text-muted-foreground text-sm">
        Add your first animal and it'll show up here.
      </p>
    </div>
  );
}
