"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";

export type MetricCardProps = {
  label: string;
  // `null` means "no data" — renders the empty placeholder. A real `0`
  // (e.g. zero sick animals while the herd is healthy) still shows "0".
  value: number | null;
  // Optional suffix appended to the value (e.g. "mo" for months).
  suffix?: string;
  // Short hint line beneath the number — keep to one line.
  hint?: string;
  // Optional change chip on the same row as the value (e.g. "+6.4%").
  // Caller decides tone via `changeTone`.
  change?: string;
  changeTone?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  tone?: "default" | "destructive";
  // Shown beneath the empty placeholder ("—") when `value` is null.
  emptyHint?: string;
  // When provided, the whole card becomes a Link target. `onClick` runs
  // BEFORE navigation so callers can pre-populate a Zustand store with
  // the matching filter and have it ready by the time the destination
  // route mounts.
  href?: string;
  onClick?: () => void;
};

const numberFormatter = new Intl.NumberFormat();

export function MetricCard({
  label,
  value,
  suffix,
  hint,
  change,
  changeTone = "neutral",
  icon,
  tone = "default",
  emptyHint = "No data yet",
  href,
  onClick,
}: MetricCardProps) {
  const isDestructive = tone === "destructive";
  const isEmpty = value === null;

  const card = (
    <Card
      className={cn(
        isDestructive &&
          "bg-destructive/5 ring-destructive/40 dark:bg-destructive/10",
        href &&
          "cursor-pointer transition-colors hover:ring-foreground/25 dark:hover:ring-foreground/20"
      )}
      size="sm"
    >
      <CardHeader>
        <CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {label}
        </CardTitle>
        <CardAction>
          <span
            className={cn(
              "flex aspect-square size-7 items-center justify-center rounded-md bg-muted text-foreground",
              isDestructive && "bg-destructive/15 text-destructive"
            )}
          >
            {icon}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-semibold text-2xl tabular-nums tracking-tight",
              isDestructive && "text-destructive",
              isEmpty && "text-muted-foreground"
            )}
          >
            {isEmpty ? "—" : numberFormatter.format(value)}
            {!isEmpty && suffix ? (
              <span className="ml-1 font-medium text-muted-foreground text-sm">
                {suffix}
              </span>
            ) : null}
          </span>
          {!isEmpty && change ? (
            <span
              className={cn(
                "font-medium text-xs",
                changeTone === "positive" && "text-emerald-500",
                changeTone === "negative" && "text-destructive",
                changeTone === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </span>
          ) : null}
        </div>
        <span className="text-muted-foreground text-xs">
          {isEmpty ? emptyHint : hint}
        </span>
      </CardContent>
    </Card>
  );

  if (!href) {
    return card;
  }

  return (
    <Link
      aria-label={`${label} — view in herd list`}
      className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      href={href}
      onClick={onClick}
    >
      {card}
    </Link>
  );
}
