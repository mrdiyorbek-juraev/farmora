"use client";

import { ResponsiveLine } from "@nivo/line";
import { format, isValid, parseISO } from "date-fns";

import { formatLb, kgToLb } from "@/lib/utils/weight";
import type { CattleWithHistory } from "@/models/cattle";
import type { WeightMeasurementWithGain } from "@/models/weight";

import { nivoTheme } from "../../../dashboard/customs/nivo-theme";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Age checkpoints (in days) surfaced under the chart, mirroring the
// "Weight (lb 200/400/600 days)" growth markers in the design.
const AGE_MARKERS = [200, 400, 600] as const;

interface WeightChartProps {
  animal: CattleWithHistory;
  /** Oldest-first weight series, as returned by listWeightHistory. */
  series: WeightMeasurementWithGain[];
}

/**
 * Weight (in kg) recorded nearest to the animal's given age, used for the
 * growth markers. Returns null when there's no measurement to anchor to.
 */
function weightAtAge(
  dob: Date,
  series: WeightMeasurementWithGain[],
  ageDays: number
): number | null {
  const targetMs = dob.getTime() + ageDays * MS_PER_DAY;
  let best: { kg: number; diff: number } | null = null;
  for (const point of series) {
    const measured = parseISO(point.measured_at);
    if (!isValid(measured)) {
      continue;
    }
    const diff = Math.abs(measured.getTime() - targetMs);
    if (!best || diff < best.diff) {
      best = { kg: point.weight_kg, diff };
    }
  }
  return best?.kg ?? null;
}

export function WeightChart({ animal, series }: WeightChartProps) {
  const dob = parseISO(animal.date_of_birth);
  const dobValid = isValid(dob);

  const points = series
    .map((point) => ({
      x: point.measured_at,
      y: Number(kgToLb(point.weight_kg).toFixed(3)),
    }))
    .filter((point) => {
      const parsed = parseISO(point.x);
      return isValid(parsed);
    });

  const currentKg =
    series.length > 0 ? (series.at(-1)?.weight_kg ?? null) : null;

  return (
    <section className="rounded-md border border-border p-4">
      <h3 className="font-semibold text-sm">Weight over time</h3>

      <div className="mt-4 h-64 w-full">
        <ResponsiveLine
          animate
          axisBottom={{
            format: (value: string | number | Date) => {
              const date =
                value instanceof Date ? value : parseISO(String(value));
              return isValid(date) ? format(date, "MM/dd/yy") : "";
            },
            tickPadding: 8,
            tickRotation: 0,
            tickSize: 0,
            tickValues: 5,
          }}
          axisLeft={{
            tickPadding: 8,
            tickSize: 0,
            tickValues: 5,
          }}
          colors={["var(--chart-1)"]}
          curve="monotoneX"
          data={[{ id: "weight", data: points }]}
          enableGridX={false}
          enableGridY
          enablePoints
          margin={{ top: 16, right: 24, bottom: 32, left: 48 }}
          pointBorderColor={{ from: "serieColor" }}
          pointBorderWidth={2}
          pointColor="var(--background)"
          pointSize={8}
          theme={nivoTheme}
          tooltip={({ point }) => (
            <div className="flex flex-col gap-0.5 whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-popover-foreground text-xs shadow-md">
              <span className="text-muted-foreground">
                {(() => {
                  const date = parseISO(String(point.data.x));
                  return isValid(date) ? format(date, "MMM d, yyyy") : "";
                })()}
              </span>
              <span className="font-medium tabular-nums">
                {Number(point.data.y).toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}{" "}
                lb
              </span>
            </div>
          )}
          useMesh
          xFormat="time:%Y-%m-%d"
          xScale={{
            format: "%Y-%m-%d",
            precision: "day",
            type: "time",
            useUTC: false,
          }}
          yScale={{ max: "auto", min: 0, type: "linear" }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Marker label="Current weight (lb)" value={formatLb(currentKg)} />
        {AGE_MARKERS.map((age) => (
          <Marker
            key={age}
            label={`Weight (lb ${age} days)`}
            value={dobValid ? formatLb(weightAtAge(dob, series, age)) : "—"}
          />
        ))}
      </dl>
    </section>
  );
}

function Marker({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium text-sm tabular-nums">{value}</dd>
    </div>
  );
}
