"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { cn } from "@repo/design-system/lib/utils";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import {
  Activity as ActivityIcon,
  AlertCircle,
  Building2,
  ClipboardEdit,
  PackagePlus,
  PencilLine,
  Stethoscope,
  StickyNote,
  Trash2,
  UserMinus,
  UserPlus,
  Weight,
} from "lucide-react";

import type { ActivityRow, ActivityType } from "@/models/activity";
import type { Status } from "@/models/cattle";
import { useCattleActivity } from "@/services/activity";
import type { ActivityLogProps } from "@/types/main/herd-detail";

const statusLabels: Record<Status, string> = {
  active: "Active",
  sick: "Sick",
  pregnant: "Pregnant",
  sold: "Sold",
  deceased: "Deceased",
};

// Status pill tone — same palette the global search uses so the same
// status reads identically across the app.
const statusToneClass: Record<Status, string> = {
  active:
    "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sick: "border-transparent bg-destructive/10 text-destructive",
  pregnant:
    "border-transparent bg-pink-500/10 text-pink-600 dark:text-pink-400",
  sold: "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400",
  deceased: "border-transparent bg-muted text-muted-foreground",
};

type IconTone = "neutral" | "success" | "warning" | "destructive" | "info";

const iconToneClass: Record<IconTone, string> = {
  neutral: "bg-muted text-foreground ring-border",
  success:
    "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  warning:
    "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  destructive: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400",
};

// Icon + tone presentation per activity type. Centralized so a new
// type only needs one entry to render correctly.
const typePresentation: Record<
  ActivityType,
  { tone: IconTone; icon: React.ReactNode }
> = {
  cattle_created: {
    tone: "neutral",
    icon: <PackagePlus className="size-4" />,
  },
  cattle_updated: { tone: "neutral", icon: <PencilLine className="size-4" /> },
  cattle_deleted: { tone: "destructive", icon: <Trash2 className="size-4" /> },
  status_changed: {
    tone: "info",
    icon: <ClipboardEdit className="size-4" />,
  },
  weight_recorded: { tone: "info", icon: <Weight className="size-4" /> },
  note_added: { tone: "neutral", icon: <StickyNote className="size-4" /> },
  member_added: { tone: "success", icon: <UserPlus className="size-4" /> },
  member_removed: {
    tone: "warning",
    icon: <UserMinus className="size-4" />,
  },
  organization_updated: {
    tone: "neutral",
    icon: <Building2 className="size-4" />,
  },
};

function safeDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function formatExact(value: string): string {
  const d = safeDate(value);
  if (!d) {
    return "—";
  }
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

function formatRelative(value: string): string {
  const d = safeDate(value);
  if (!d) {
    return "";
  }
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Status-change activities ship `{ from, to }` in metadata so we can
 * render the same colored badge transition the global search uses.
 * Type-narrow defensively — metadata is jsonb so the shape is best-
 * effort until we layer per-type zod schemas on top.
 */
function parseStatusMeta(
  metadata: ActivityRow["metadata"]
): { from?: Status; to?: Status } | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const meta = metadata as Record<string, unknown>;
  const from = typeof meta.from === "string" ? (meta.from as Status) : undefined;
  const to = typeof meta.to === "string" ? (meta.to as Status) : undefined;
  if (!(from || to)) {
    return null;
  }
  return { from, to };
}

export function ActivityLog({ cattleId }: ActivityLogProps) {
  const { activity } = useCattleActivity(cattleId);

  if (activity.isPending) {
    return <ActivityLogSkeleton />;
  }

  if (activity.isError) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Couldn&rsquo;t load activity</EmptyTitle>
          <EmptyDescription>
            {activity.error instanceof Error
              ? activity.error.message
              : "Something went wrong reading this animal's activity feed."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const events = activity.data ?? [];

  if (events.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ActivityIcon />
          </EmptyMedia>
          <EmptyTitle>No activity yet</EmptyTitle>
          <EmptyDescription>
            Births, status changes, and other timestamped events will appear
            here as the record evolves.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {events.map((event, index) => (
        <ActivityRowItem
          event={event}
          isLast={index === events.length - 1}
          key={event.id}
        />
      ))}
    </ol>
  );
}

type ActivityRowItemProps = {
  event: ActivityRow;
  isLast: boolean;
};

function ActivityRowItem({ event, isLast }: ActivityRowItemProps) {
  const presentation = typePresentation[event.type];
  const statusMeta =
    event.type === "status_changed" ? parseStatusMeta(event.metadata) : null;

  return (
    <li className="relative flex gap-3 pb-5">
      {/* Rail connector — drawn for every event except the last so */}
      {/* the timeline ends at the bottommost dot. */}
      {isLast ? null : (
        <span
          aria-hidden
          className="absolute top-9 bottom-0 left-[15px] w-px bg-border"
        />
      )}
      <span
        className={cn(
          "relative z-10 mt-0.5 flex aspect-square size-8 shrink-0 items-center justify-center rounded-full ring-1",
          iconToneClass[presentation.tone]
        )}
      >
        {presentation.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="font-medium text-foreground text-sm">{event.title}</p>
          <time
            className="text-muted-foreground text-xs tabular-nums"
            dateTime={event.created_at}
            title={formatExact(event.created_at)}
          >
            {formatRelative(event.created_at)}
          </time>
        </div>

        {statusMeta ? (
          <div className="flex flex-wrap items-center gap-2">
            {statusMeta.from ? (
              <Badge
                className={cn(
                  "rounded-full",
                  statusToneClass[statusMeta.from]
                )}
                variant="outline"
              >
                {statusLabels[statusMeta.from]}
              </Badge>
            ) : null}
            {statusMeta.from && statusMeta.to ? (
              <span className="text-muted-foreground">→</span>
            ) : null}
            {statusMeta.to ? (
              <Badge
                className={cn("rounded-full", statusToneClass[statusMeta.to])}
                variant="outline"
              >
                {statusLabels[statusMeta.to]}
              </Badge>
            ) : null}
          </div>
        ) : null}

        {event.description ? (
          <p className="text-muted-foreground text-sm">{event.description}</p>
        ) : null}

        <p className="text-muted-foreground text-xs tabular-nums">
          {formatExact(event.created_at)}
        </p>
      </div>
    </li>
  );
}

function ActivityLogSkeleton() {
  return (
    <ol className="relative flex flex-col">
      {Array.from({ length: 4 }).map((_, index) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton count
          key={index}
          className="relative flex gap-3 pb-5"
        >
          {index === 3 ? null : (
            <span
              aria-hidden
              className="absolute top-9 bottom-0 left-[15px] w-px bg-border"
            />
          )}
          <Skeleton className="z-10 size-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-32" />
          </div>
        </li>
      ))}
    </ol>
  );
}
