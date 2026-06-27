"use client";

import { Skeleton } from "@repo/design-system/components/ui/skeleton";

/**
 * Loading state shaped like the real herd-detail layout: page header
 * with back / icon / title / kebab, status sub-header, two-column
 * grid (record sidebar + tabbed main area). Matches the post-load
 * geometry so the page doesn't jump when data resolves.
 */
export function HerdDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeaderSkeleton />
      <SubHeaderSkeleton />
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="min-w-0 border-border p-4 lg:border-r">
          <RecordDetailsSkeleton />
        </div>
        <div className="min-w-0 p-4">
          <MainContentSkeleton />
        </div>
      </div>
    </div>
  );
}

function PageHeaderSkeleton() {
  return (
    <header className="flex items-center justify-between gap-3 border-border border-b px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="size-7 rounded-md" />
    </header>
  );
}

function SubHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-border border-b bg-muted/40 px-4 py-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

function RecordDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 pb-1">
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Ten rows matches the live editable list (tag, name, breed, */}
      {/* gender, status, DOB, weight, acquisition, acquired, last   */}
      {/* updated) so the sidebar height doesn't change on resolve.   */}
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          className="grid grid-cols-[120px_1fr] items-center gap-3 py-1.5"
          // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton row count
          key={index}
        >
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3.5 rounded-sm" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded" />
        </div>
      ))}
    </div>
  );
}

function MainContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Tab strip — four pills matching Activity / Status / Notes / Files. */}
      <div className="flex gap-1 self-start rounded-md bg-muted p-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            className="h-7 w-24 rounded"
            // biome-ignore lint/suspicious/noArrayIndexKey: stable tab count
            key={index}
          />
        ))}
      </div>

      {/* Timeline-style placeholder so the activity tab — the default — */}
      {/* doesn't flash with an unrelated layout before resolving. */}
      <ol className="flex flex-col">
        {Array.from({ length: 5 }).map((_, index) => (
          <li
            className="relative flex gap-3 pb-5"
            // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton count
            key={index}
          >
            {index === 4 ? null : (
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
    </div>
  );
}
