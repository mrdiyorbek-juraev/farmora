"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { cn } from "@repo/design-system/lib/utils";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export type MetricCardDelta = {
  /** Signed change versus the previous period. */
  value: number;
  /** Which direction is the good one — null means neutral (no colour). */
  improvement: "up" | "down" | null;
  /** Caption shown next to the change, e.g. "vs prev 90 days". */
  caption?: string;
};

export type MetricCardProps = {
  label: string;
  value: number;
  description?: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "default" | "destructive";
  isLoading?: boolean;
  delta?: MetricCardDelta;
};

const numberFormatter = new Intl.NumberFormat();

function DeltaBadge({ value, improvement, caption }: MetricCardDelta) {
  const Icon = value === 0 ? Minus : value > 0 ? TrendingUp : TrendingDown;
  // Colour only when there's a defined "good" direction and the change
  // is non-zero; neutral metrics and flat periods stay muted.
  const isGood =
    improvement === null || value === 0
      ? null
      : (value > 0 ? "up" : "down") === improvement;

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "flex items-center gap-0.5 font-medium tabular-nums",
          isGood === null && "text-muted-foreground",
          isGood === true && "text-emerald-600 dark:text-emerald-500",
          isGood === false && "text-destructive"
        )}
      >
        <Icon className="size-3.5" />
        {value === 0 ? "No change" : numberFormatter.format(Math.abs(value))}
      </span>
      {caption ? (
        <span className="text-muted-foreground">{caption}</span>
      ) : null}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  description,
  hint,
  icon,
  tone = "default",
  isLoading,
  delta,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        tone === "destructive" &&
          "bg-destructive/5 ring-destructive/30 dark:bg-destructive/10"
      )}
    >
      <CardHeader>
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {label}
        </CardTitle>
        <CardAction>
          <span
            className={cn(
              "flex aspect-square size-8 items-center justify-center rounded-md bg-muted text-foreground",
              tone === "destructive" && "bg-destructive/15 text-destructive"
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
              "font-semibold text-3xl tabular-nums tracking-tight",
              tone === "destructive" && "text-destructive"
            )}
          >
            {isLoading ? "—" : numberFormatter.format(value)}
          </span>
          {hint ? (
            <span className="font-medium text-muted-foreground text-xs tabular-nums">
              {hint}
            </span>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-1.5">
        {delta && !isLoading ? <DeltaBadge {...delta} /> : null}
        {description ? (
          <span className="text-muted-foreground text-sm">{description}</span>
        ) : null}
      </CardFooter>
    </Card>
  );
}
