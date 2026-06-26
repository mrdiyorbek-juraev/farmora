"use client";

import { cn } from "@repo/design-system/lib/utils";
import type * as React from "react";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full" data-slot="table-container">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        data-slot="table"
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      // Header rows never hover-highlight (no row-level interaction in
      // the head); consumers shouldn't have to add `hover:bg-transparent`
      // to every <TableRow> they put in here.
      className={cn("[&_tr]:border-b [&_tr]:hover:bg-transparent", className)}
      data-slot="table-header"
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      // Header cell defaults: caption typography + muted color + a
      // standard inline icon size for any nested <svg>, so consumers
      // don't repeat `text-caption text-muted-foreground` and `size-3`
      // on every header. The descendant selector (`_svg`) catches
      // icons wrapped in a label <span>; icons inside interactive
      // controls (Button, DropdownMenuTrigger…) carry their own size
      // class which wins via specificity.
      className={cn(
        "h-7 whitespace-nowrap px-2 text-left align-middle font-medium text-muted-foreground text-xs [&:has([role=checkbox])]:pr-0 [&_svg]:size-3 [&_svg]:text-muted-foreground",
        className
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      // Body cell defaults: muted color, body type matches the header
      // (`text-xs`) so a row reads as one continuous strip with no
      // size jump between header and body, and a standard inline
      // icon size for nested <svg>. Promoted text overrides with
      // `text-foreground`/`font-medium`. Icons inside controls
      // (Button, Tooltip…) keep their own sizing because those carry
      // size classes that win on specificity.
      className={cn(
        "whitespace-nowrap p-2 align-middle text-muted-foreground text-xs [&:has([role=checkbox])]:pr-0 [&_svg]:size-3 [&_svg]:text-muted-foreground",
        className
      )}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn("mt-4 text-muted-foreground text-sm", className)}
      data-slot="table-caption"
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
