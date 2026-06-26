"use client";

import { cn } from "@repo/design-system/lib/utils";
import {
  type ComponentPropsWithoutRef,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

interface TruncatedTextProps extends ComponentPropsWithoutRef<"span"> {
  // Side the tooltip opens on. Defaults to "bottom" so the row
  // chrome above stays visible while reading the overflow content.
  side?: "top" | "right" | "bottom" | "left";
  // Plain text to show; the component decides whether to surface a
  // tooltip based on actual DOM overflow. Pass children only when you
  // need richer markup — the tooltip body falls back to children when
  // `text` is omitted.
  text?: string;
  // Tooltip body override. Defaults to `text` (or `children` as a
  // last resort when `text` is missing).
  tooltipContent?: React.ReactNode;
}

// Drop-in replacement for a span with `truncate`. Watches the rendered
// node and only opens a Tooltip when the text actually overflows its
// box — silent when content fits, so we don't get noisy hovers
// everywhere on the page. Uses ResizeObserver so column-width
// changes (drag-resize, ViewSettings toggle) re-evaluate overflow
// without a remount.
//
// The Tooltip is ALWAYS mounted around the span so the ref stays
// attached and Radix's hover state can manage open/close. The
// TooltipContent itself is only rendered when `isClipped` is true,
// which is what gates the visible tooltip.
export function TruncatedText({
  text,
  tooltipContent,
  side = "bottom",
  className,
  children,
  ...rest
}: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [isClipped, setIsClipped] = useState(false);

  // text/children are intentional deps — ResizeObserver only fires on
  // box-size changes, not content swaps. Re-measuring when text or
  // children change catches the "string updated but width unchanged"
  // overflow case.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const measure = () => {
      // scrollWidth > clientWidth on horizontal overflow. Add 1px
      // slack for sub-pixel rounding quirks (Firefox + scaled DPI).
      setIsClipped(el.scrollWidth - el.clientWidth > 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, children]);

  // Wrap in Provider so the component works regardless of where in
  // the tree it's mounted — there's no global TooltipProvider, and
  // table cells render across many independent surfaces. 300ms
  // matches the rest of the app's tooltip cadence.
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span ref={ref} {...rest} className={cn("truncate", className)}>
            {text ?? children}
          </span>
        </TooltipTrigger>
        {isClipped ? (
          <TooltipContent className="max-w-md text-left" side={side}>
            {tooltipContent ?? text ?? children}
          </TooltipContent>
        ) : null}
      </Tooltip>
    </TooltipProvider>
  );
}
