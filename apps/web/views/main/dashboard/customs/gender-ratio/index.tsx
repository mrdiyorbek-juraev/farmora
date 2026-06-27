"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";

import type { Gender } from "@/models/cattle";
import type { GenderCount } from "@/models/dashboard";

const genderOrder: Gender[] = ["female", "male"];

const genderLabels: Record<Gender, string> = {
  female: "Female",
  male: "Male",
};

// Reuse the chart palette so the segments line up tonally with the
// status / breed widgets. Female stays the dominant breeding-herd colour,
// male picks up a neutral counterpoint.
const genderColors: Record<Gender, string> = {
  female: "var(--chart-9)",
  male: "var(--chart-8)",
};

export type GenderRatioProps = {
  data: GenderCount[];
};

export function GenderRatio({ data }: GenderRatioProps) {
  const byGender = new Map(data.map((entry) => [entry.gender, entry.count]));
  const rows = genderOrder.map((gender) => {
    const count = byGender.get(gender) ?? 0;
    return {
      gender,
      label: genderLabels[gender],
      color: genderColors[gender],
      count,
    };
  });

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const segments = rows.filter((row) => row.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gender ratio</CardTitle>
        <CardDescription>Herd balance &amp; breeding needs.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div
              aria-label="Gender ratio"
              className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
              role="img"
            >
              {segments.map((row) => (
                <div
                  key={row.gender}
                  style={{
                    backgroundColor: row.color,
                    width: `${(row.count / total) * 100}%`,
                  }}
                  title={`${row.label}: ${row.count} (${Math.round(
                    (row.count / total) * 100
                  )}%)`}
                />
              ))}
            </div>
            <ul className="flex flex-col gap-2">
              {rows.map((row) => {
                const share = total > 0 ? row.count / total : 0;
                return (
                  <li
                    className="flex items-center justify-between gap-2 text-sm"
                    key={row.gender}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="text-foreground">{row.label}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.count}{" "}
                      <span className="text-muted-foreground/70">
                        ({Math.round(share * 100)}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed p-6 text-center">
      <p className="font-medium text-sm">No animals yet</p>
      <p className="text-muted-foreground text-sm">
        Add animals to see your gender ratio.
      </p>
    </div>
  );
}
