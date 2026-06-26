"use client";

import { cn } from "@repo/design-system/lib/utils";

export type MetricCardProps = {
  label: string;
  value: number;
  description?: string;
  icon: React.ReactNode;
  tone?: "default" | "destructive";
  isLoading?: boolean;
};

const numberFormatter = new Intl.NumberFormat();

export function MetricCard({
  label,
  value,
  description,
  icon,
  tone = "default",
  isLoading,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border p-5",
        tone === "destructive" &&
          // Soft destructive surface so the "act today" card visually wins
          // without needing a red background that fights the rest of the
          // dashboard chrome.
          "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-muted-foreground text-sm">
          {label}
        </span>
        <span
          className={cn(
            "flex aspect-square size-8 items-center justify-center rounded-md bg-muted text-foreground",
            tone === "destructive" && "bg-destructive/15 text-destructive"
          )}
        >
          {icon}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            "font-semibold text-3xl tabular-nums tracking-tight",
            tone === "destructive" && "text-destructive"
          )}
        >
          {isLoading ? "—" : numberFormatter.format(value)}
        </span>
        {description ? (
          <span className="text-muted-foreground text-sm">{description}</span>
        ) : null}
      </div>
    </div>
  );
}
