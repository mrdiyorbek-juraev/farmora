"use client";

import { cn } from "@repo/design-system/lib/utils";
import * as TabsPrimitive from "@radix-ui/react-tabs";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn("group/tabs flex flex-col gap-2", className)}
      data-slot="tabs"
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: "default" | "underline";
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        "items-center text-muted-foreground",
        variant === "default" &&
          "inline-flex h-7 justify-center rounded-md bg-muted p-0.5",
        variant === "underline" && "flex h-auto justify-start gap-4",
        className
      )}
      data-slot="tabs-list"
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant = "default",
  isActive,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  variant?: "default" | "icon" | "underline";
  isActive?: boolean;
}) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium text-xs transition-all focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        variant === "default" &&
          "px-3 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
        variant === "icon" &&
          "size-6 p-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
        variant === "underline" &&
          "-mb-px rounded-md border border-transparent px-3 py-1.5 text-muted-foreground hover:text-foreground  data-[state=active]:border-green-600! data-[state=active]:text-green-600!",
        isActive === true && variant === "default" && "bg-primary text-foreground shadow-sm",
        isActive === true && variant === "icon" && "bg-primary text-primary-foreground shadow-sm",
        isActive === true &&
          variant === "underline" &&
          "rounded-md   border-b-green-600 text-foreground",
        className
      )}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("flex-1 outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
