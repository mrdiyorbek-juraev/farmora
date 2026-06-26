"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";

// ─── Public types ───────────────────────────────────────────────────

export interface MeterSegment {
  /** Any valid CSS color (hex, oklch, var()). Used for both the segment fill and the legend dot. */
  color: string;
  /** Stable identifier — drives React keys, legend interactions, and `selectedIds`. */
  id: string;
  /** Human-readable label. Shown in the legend and the default tooltip. Caller controls casing. */
  label: string;
  /** Arbitrary passthrough — available on `renderTooltip(segment)` for caller-specific extras. */
  meta?: Record<string, unknown>;
  /** Numeric magnitude. Drives flex-grow + the default tooltip line. */
  value: number;
}

type MeterSize = "sm" | "md" | "lg";
type MeterRounded = "full" | "md" | "sm" | "none";
type LegendPosition = "bottom" | "top";
type LegendAlign = "start" | "center" | "end";

export interface MeterProps {
  // ─── Accessibility ───────────────────────────────────────────
  /** Labels the whole meter group. Default "Meter". */
  ariaLabel?: string;
  /** Per-segment SR text. Default `{label}: {value} ({percentage}%)`. */
  ariaValueFormatter?: (segment: MeterSegment, percentage: number) => string;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** Uncontrolled initial selection. Empty array means nothing is selected (all fully opaque). */
  defaultSelectedIds?: string[];

  // ─── Empty state ─────────────────────────────────────────────
  /** Rendered in place of the segments when every value is 0. */
  emptyState?: ReactNode;

  // ─── Interactivity ───────────────────────────────────────────
  /**
   * When true (default), hovering a legend item dims other segments
   * (and vice-versa), and clicking either a segment or a legend item
   * toggles its selection. When false, segments and legend items are
   * non-interactive divs.
   */
  interactive?: boolean;
  /** Legend horizontal alignment. Default `start`. */
  legendAlign?: LegendAlign;
  /** Where the legend sits relative to the bar. Default `bottom`. */
  legendPosition?: LegendPosition;
  /** Fires when a segment or legend item is clicked. */
  onSegmentClick?: (segment: MeterSegment) => void;
  /** Fires on hover enter/leave. `null` on leave. */
  onSegmentHover?: (segment: MeterSegment | null) => void;

  // ─── Tooltip ─────────────────────────────────────────────────
  /** Render the per-segment tooltip. Default renders `{label}` + `{value} items`. */
  renderTooltip?: (segment: MeterSegment) => ReactNode;
  /** Corner radius on the bar. Default `full`. */
  rounded?: MeterRounded;
  segments: MeterSegment[];
  /** Controlled selection — segments NOT in this list are visually dimmed. */
  selectedIds?: string[];
  /** Render the legend. Default `true`. */
  showLegend?: boolean;
  /** Disable tooltips entirely. Default `true`. */
  showTooltip?: boolean;

  // ─── Layout ──────────────────────────────────────────────────
  /** Bar thickness. `sm` = 1, `md` = 2 (default), `lg` = 3 (tailwind units). */
  size?: MeterSize;
}

// ─── Constants ──────────────────────────────────────────────────────

const SIZE_CLASS: Record<MeterSize, string> = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const ROUNDED_CLASS: Record<MeterRounded, string> = {
  full: "rounded-full",
  md: "rounded-md",
  sm: "rounded-sm",
  none: "rounded-none",
};

const LEGEND_ALIGN_CLASS: Record<LegendAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

// Minimum visual width so tiny non-zero segments stay clickable.
const SEGMENT_MIN_WIDTH = 4;

// ─── Implementation ────────────────────────────────────────────────

export function Meter({
  segments,
  size = "md",
  rounded = "full",
  showLegend = true,
  legendPosition = "bottom",
  legendAlign = "start",
  className,
  interactive = true,
  onSegmentClick,
  onSegmentHover,
  selectedIds: selectedIdsProp,
  defaultSelectedIds,
  renderTooltip,
  showTooltip = true,
  emptyState,
  ariaLabel = "Meter",
  ariaValueFormatter,
}: MeterProps) {
  const groupId = useId();

  const total = useMemo(
    () => segments.reduce((sum, s) => sum + Math.max(0, s.value), 0),
    [segments]
  );

  // Controlled / uncontrolled selection. Empty means "nothing selected
  // → all opaque"; non-empty means "only these are at full opacity".
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(
    defaultSelectedIds ?? []
  );
  const selectedIds = selectedIdsProp ?? internalSelectedIds;
  const hasSelection = selectedIds.length > 0;

  // Hover tracking is local — never propagates upward except via
  // `onSegmentHover`, since dimming is a presentational concern.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback(
    (segment: MeterSegment) => {
      if (!interactive) {
        return;
      }
      if (selectedIdsProp === undefined) {
        // Uncontrolled — toggle internal state.
        setInternalSelectedIds((prev) =>
          prev.includes(segment.id)
            ? prev.filter((id) => id !== segment.id)
            : [...prev, segment.id]
        );
      }
      onSegmentClick?.(segment);
    },
    [interactive, onSegmentClick, selectedIdsProp]
  );

  const handleHoverEnter = useCallback(
    (segment: MeterSegment) => {
      setHoveredId(segment.id);
      onSegmentHover?.(segment);
    },
    [onSegmentHover]
  );

  const handleHoverLeave = useCallback(() => {
    setHoveredId(null);
    onSegmentHover?.(null);
  }, [onSegmentHover]);

  const isDimmed = useCallback(
    (segmentId: string) => {
      // Hover wins: if anything is hovered and it isn't this segment, dim.
      if (hoveredId !== null && hoveredId !== segmentId) {
        return true;
      }
      // Otherwise: if a selection exists and this segment isn't in it, dim.
      if (hasSelection && !selectedIds.includes(segmentId)) {
        return true;
      }
      return false;
    },
    [hasSelection, hoveredId, selectedIds]
  );

  const legendNode = showLegend ? (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]",
        LEGEND_ALIGN_CLASS[legendAlign]
      )}
    >
      {segments.map((segment) => {
        const dimmed = isDimmed(segment.id);
        const content = (
          <>
            <span
              aria-hidden
              className="size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
          </>
        );

        if (!interactive) {
          return (
            <li
              className={cn(
                "flex items-center gap-1.5 transition-opacity",
                dimmed && "opacity-40"
              )}
              key={segment.id}
            >
              {content}
            </li>
          );
        }

        return (
          <li key={segment.id}>
            <button
              aria-pressed={
                hasSelection ? selectedIds.includes(segment.id) : undefined
              }
              className={cn(
                "flex cursor-pointer items-center gap-1.5 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                dimmed && "opacity-40"
              )}
              onClick={() => handleClick(segment)}
              onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClick(segment);
                }
              }}
              onMouseEnter={() => handleHoverEnter(segment)}
              onMouseLeave={handleHoverLeave}
              type="button"
            >
              {content}
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  const trackClass = cn(
    "flex w-full overflow-hidden bg-muted",
    SIZE_CLASS[size],
    ROUNDED_CLASS[rounded]
  );

  const visibleSegments = segments.filter((s) => Math.max(0, s.value) > 0);
  const trackNode =
    total === 0 ? (
      <fieldset
        aria-label={ariaLabel}
        className={cn("m-0 border-0 p-0", trackClass)}
      >
        {emptyState}
      </fieldset>
    ) : (
      <fieldset
        aria-label={ariaLabel}
        className={cn("m-0 border-0 p-0", trackClass)}
        id={groupId}
      >
        {visibleSegments.map((segment) => (
          <MeterSegmentNode
            ariaValueFormatter={ariaValueFormatter}
            dimmed={isDimmed(segment.id)}
            hasSelection={hasSelection}
            interactive={interactive}
            key={segment.id}
            onClick={handleClick}
            onHoverEnter={handleHoverEnter}
            onHoverLeave={handleHoverLeave}
            renderTooltip={renderTooltip}
            segment={segment}
            selected={selectedIds.includes(segment.id)}
            showTooltip={showTooltip}
            total={total}
          />
        ))}
      </fieldset>
    );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {legendPosition === "top" && legendNode}
      {trackNode}
      {legendPosition === "bottom" && legendNode}
    </div>
  );
}

// ─── Segment renderer ──────────────────────────────────────────────
//
// Extracted to keep the `<Meter>` body under the complexity budget.
// Owns the segment <button|div>, its tooltip wrapping, and the per-
// segment SR text. All meter-level state (hover, selection, totals)
// is passed in as props so this node stays a pure render.

interface MeterSegmentNodeProps {
  ariaValueFormatter?: MeterProps["ariaValueFormatter"];
  dimmed: boolean;
  hasSelection: boolean;
  interactive: boolean;
  onClick: (segment: MeterSegment) => void;
  onHoverEnter: (segment: MeterSegment) => void;
  onHoverLeave: () => void;
  renderTooltip?: MeterProps["renderTooltip"];
  segment: MeterSegment;
  selected: boolean;
  showTooltip: boolean;
  total: number;
}

function MeterSegmentNode({
  ariaValueFormatter,
  dimmed,
  hasSelection,
  interactive,
  onClick,
  onHoverEnter,
  onHoverLeave,
  renderTooltip,
  segment,
  selected,
  showTooltip,
  total,
}: MeterSegmentNodeProps) {
  const value = Math.max(0, segment.value);
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
  const segmentStyle: CSSProperties = {
    backgroundColor: segment.color,
    flexGrow: value,
    minWidth: `${SEGMENT_MIN_WIDTH}px`,
  };
  const segmentClass = cn(
    "h-full transition-opacity",
    dimmed && "opacity-40",
    interactive && "cursor-pointer"
  );
  const srText =
    ariaValueFormatter?.(segment, percentage) ??
    `${segment.label}: ${value} (${percentage}%)`;

  const element = interactive ? (
    <button
      aria-label={srText}
      aria-pressed={hasSelection ? selected : undefined}
      className={segmentClass}
      onClick={() => onClick(segment)}
      onMouseEnter={() => onHoverEnter(segment)}
      onMouseLeave={onHoverLeave}
      style={segmentStyle}
      type="button"
    />
  ) : (
    <div
      aria-label={srText}
      className={segmentClass}
      role="img"
      style={segmentStyle}
    />
  );

  if (!showTooltip) {
    return element;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      <TooltipContent>
        {renderTooltip ? (
          renderTooltip(segment)
        ) : (
          // Default tooltip body follows the same shape as the
          // Nivo-style tooltips used elsewhere (Sentiment,
          // highlight-flow): bold title + a muted, tabular-nums
          // value line. Callers can override the whole body via
          // `renderTooltip` while the outer `TooltipContent` chrome
          // (rounded border, bg-popover, shadow) stays consistent.
          <div className="flex min-w-[160px] flex-col">
            <div className="font-semibold">{segment.label}</div>
            <div className="text-muted-foreground tabular-nums">
              {value} item{value === 1 ? "" : "s"}
            </div>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
