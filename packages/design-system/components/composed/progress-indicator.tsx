"use client";

import { cn } from "@repo/design-system/lib/utils";
import { AlertCircle, Check, Circle } from "lucide-react";
import { createContext, useContext } from "react";

// ─── Types & Context ──────────────────────────────────────────────────────────

type TStepStatus =
  | "complete"
  | "current"
  | "incomplete"
  | "error"
  | "disabled";

type TProgressIndicatorContext = {
  orientation: "horizontal" | "vertical";
  interactive: boolean;
};

const ProgressIndicatorContext = createContext<TProgressIndicatorContext>({
  orientation: "horizontal",
  interactive: false,
});

function useProgressIndicator() {
  return useContext(ProgressIndicatorContext);
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function ProgressIndicator({
  className,
  orientation = "horizontal",
  interactive = false,
  ...props
}: React.ComponentProps<"ol"> & {
  orientation?: "horizontal" | "vertical";
  interactive?: boolean;
}) {
  return (
    <ProgressIndicatorContext.Provider value={{ orientation, interactive }}>
      <ol
        aria-label="Progress"
        className={cn(
          "flex",
          orientation === "horizontal"
            ? "w-full flex-row items-stretch"
            : "flex-col",
          className
        )}
        data-orientation={orientation}
        data-slot="progress-indicator"
        {...props}
      />
    </ProgressIndicatorContext.Provider>
  );
}

// ─── Step ─────────────────────────────────────────────────────────────────────

const STEP_BAR_VARIANTS: Record<TStepStatus, string> = {
  complete: "bg-primary",
  current: "bg-primary",
  incomplete: "bg-border",
  error: "bg-destructive",
  disabled: "bg-border opacity-50",
};

const STEP_LABEL_VARIANTS: Record<TStepStatus, string> = {
  complete: "text-foreground",
  current: "font-medium text-foreground",
  incomplete: "text-muted-foreground",
  error: "font-medium text-destructive",
  disabled: "text-muted-foreground opacity-50",
};

function ProgressIndicatorStep({
  status = "incomplete",
  className,
  children,
  onClick,
  ...props
}: Omit<React.ComponentProps<"li">, "onClick"> & {
  status?: TStepStatus;
  onClick?: () => void;
}) {
  const { orientation, interactive } = useProgressIndicator();
  const isClickable = interactive && status !== "disabled" && Boolean(onClick);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (!isClickable) {
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <li
      aria-current={status === "current" ? "step" : undefined}
      aria-disabled={status === "disabled"}
      aria-invalid={status === "error"}
      className={cn(
        "relative flex",
        orientation === "horizontal"
          ? "min-w-0 flex-1 flex-col"
          : "flex-row gap-3",
        isClickable && "cursor-pointer",
        className
      )}
      data-slot="progress-indicator-step"
      data-status={status}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {/* Active bar (horizontal: top, vertical: left) */}
      <div
        aria-hidden="true"
        className={cn(
          "transition-colors",
          orientation === "horizontal"
            ? cn("mb-2 h-0.5 w-full", STEP_BAR_VARIANTS[status])
            : cn("order-1 ml-[9px] w-0.5 flex-1", STEP_BAR_VARIANTS[status])
        )}
      />

      <div
        className={cn(
          "flex gap-2",
          orientation === "horizontal"
            ? "items-start"
            : "items-start"
        )}
      >
        <ProgressIndicatorStepIcon status={status} />
        <div className={cn("flex min-w-0 flex-col gap-0.5")}>
          <div
            className={cn("text-caption leading-tight", STEP_LABEL_VARIANTS[status])}
          >
            {children}
          </div>
        </div>
      </div>
    </li>
  );
}

// ─── Step Icon ────────────────────────────────────────────────────────────────

function ProgressIndicatorStepIcon({ status }: { status: TStepStatus }) {
  if (status === "complete") {
    return (
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded-full border border-primary text-primary"
      >
        <Check className="size-3" strokeWidth={2.5} />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span
        aria-hidden="true"
        className="relative flex size-4 shrink-0 items-center justify-center rounded-full border border-primary"
      >
        <span className="size-2 rounded-full bg-primary" />
      </span>
    );
  }

  if (status === "error") {
    return (
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded-full text-destructive"
      >
        <AlertCircle className="size-4" />
      </span>
    );
  }

  if (status === "disabled") {
    return (
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded-full border border-border border-dashed opacity-50"
      />
    );
  }

  // incomplete
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center text-muted-foreground"
    >
      <Circle className="size-4" strokeDasharray="2 2" />
    </span>
  );
}

// ─── Step Label ───────────────────────────────────────────────────────────────

function ProgressIndicatorStepLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("block", className)}
      data-slot="progress-indicator-step-label"
      {...props}
    />
  );
}

// ─── Step Helper Text ─────────────────────────────────────────────────────────

function ProgressIndicatorStepHelperText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("block text-[11px] text-muted-foreground", className)}
      data-slot="progress-indicator-step-helper"
      {...props}
    />
  );
}

export {
  ProgressIndicator,
  ProgressIndicatorStep,
  ProgressIndicatorStepHelperText,
  ProgressIndicatorStepLabel,
};
