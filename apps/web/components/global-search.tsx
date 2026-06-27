"use client";

import { useOrganization } from "@repo/auth/client";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Kbd } from "@repo/design-system/components/ui/kbd";
import { Spinner } from "@repo/design-system/components/ui/spinner";
import { cn } from "@repo/design-system/lib/utils";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { differenceInYears, parseISO } from "date-fns";
import {
  ArrowRight,
  Mars,
  Search,
  SearchX,
  Sprout,
  Venus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { listCattleAction } from "@/app/_actions/cattle";
import { useDebounce } from "@/hooks/use-debounce";
import type { Breed, CattleRow, Gender, Status } from "@/models/cattle";
import { cattleKeys } from "@/services/cattle/keys";

const breedLabels: Record<Breed, string> = {
  holstein: "Holstein",
  jersey: "Jersey",
  angus: "Angus",
  hereford: "Hereford",
  brown_swiss: "Brown Swiss",
  guernsey: "Guernsey",
  charolais: "Charolais",
  simmental: "Simmental",
  other: "Other",
};

const statusLabels: Record<Status, string> = {
  active: "Active",
  sick: "Sick",
  pregnant: "Pregnant",
  sold: "Sold",
  deceased: "Deceased",
};

// Status pill tone — sick is the only one that uses destructive
// since it's the urgent operational state.
const statusToneClass: Record<Status, string> = {
  active:
    "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sick: "border-transparent bg-destructive/10 text-destructive",
  pregnant:
    "border-transparent bg-pink-500/10 text-pink-600 dark:text-pink-400",
  sold: "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400",
  deceased: "border-transparent bg-muted text-muted-foreground",
};

function GenderIcon({ gender }: { gender: Gender }) {
  return gender === "female" ? (
    <Venus className="size-3.5 text-pink-500" />
  ) : (
    <Mars className="size-3.5 text-blue-500" />
  );
}

function ageLabel(dob: string | null): string | null {
  if (!dob) {
    return null;
  }
  const parsed = parseISO(dob);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const years = differenceInYears(new Date(), parsed);
  if (years <= 0) {
    return "<1 yr";
  }
  return `${years} yr`;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // 200ms is small enough that results feel live, large enough that
  // each keystroke doesn't spawn its own server round-trip.
  const debouncedQuery = useDebounce(query.trim(), 200);
  const router = useRouter();
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";

  // Reset state whenever the dialog closes so re-opening starts blank
  // and doesn't flash the previous result list.
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  useHotkeys(
    "mod+k",
    (event) => {
      event.preventDefault();
      setOpen((prev) => !prev);
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  const listFilters = useMemo(
    () => ({
      search: debouncedQuery || undefined,
      limit: 15,
      offset: 0,
    }),
    [debouncedQuery]
  );

  const { data, isFetching, isError, error } = useQuery({
    queryKey: cattleKeys.list(orgId, listFilters),
    queryFn: () => listCattleAction(listFilters),
    enabled: open && Boolean(orgId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  // First render after opening has no `data` yet — distinguish that
  // from "data arrived and was empty" so the loading state doesn't
  // render an alarming "no animals yet" message.
  const isInitialLoad = open && !data && isFetching;

  const handleSelect = (id: string) => {
    setOpen(false);
    router.push(`/herd/${id}`);
  };

  const headingLabel = debouncedQuery
    ? `Results for "${debouncedQuery}"`
    : "Recent animals";

  return (
    <>
      <Button
        aria-label="Search animals"
        className="h-8 w-full max-w-sm justify-between gap-3 rounded-full bg-muted/40 px-3 font-normal text-muted-foreground hover:bg-muted/60"
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          <span>Search animals…</span>
        </span>
        <Kbd className="hidden h-5 px-1.5 text-[10px] sm:inline-flex">⌘K</Kbd>
      </Button>

      <CommandDialog
        className="w-[calc(100vw-2rem)] max-w-3xl sm:w-full"
        onOpenChange={setOpen}
        open={open}
      >
        {/* CommandDialog in this design system renders only Dialog + */}
        {/* DialogContent and does not provide the cmdk context, so we */}
        {/* wrap the inputs/list with <Command> ourselves — without it, */}
        {/* CommandInput crashes trying to subscribe to a missing store. */}
        <Command>
          <CommandInput
            onValueChange={setQuery}
            placeholder="Search by tag, name, breed…"
            value={query}
          />
          <CommandList className="max-h-[480px]">
            {(() => {
              if (isError) {
                return (
                  <ErrorState
                    message={
                      error instanceof Error
                        ? error.message
                        : "Failed to load animals."
                    }
                  />
                );
              }

              if (isInitialLoad) {
                return <LoadingState />;
              }

              if (rows.length === 0) {
                // Two distinct empty states: a query that matched
                // nothing vs. an org that hasn't logged any animals.
                return debouncedQuery ? (
                  <NoMatchesState query={debouncedQuery} />
                ) : (
                  <NoAnimalsState onClose={() => setOpen(false)} />
                );
              }

              return (
                <CommandGroup heading={headingLabel}>
                  {rows.map((row) => (
                    <ResultRow
                      key={row.id}
                      onSelect={() => handleSelect(row.id)}
                      row={row}
                    />
                  ))}
                </CommandGroup>
              );
            })()}
          </CommandList>

          {rows.length > 0 ? (
            <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
              <span>
                Showing {rows.length}
                {total > rows.length ? ` of ${total}` : ""}
              </span>
              <span className="flex items-center gap-2">
                <Kbd className="h-4 px-1 text-[10px]">↵</Kbd>
                <span>to open</span>
                <Kbd className="h-4 px-1 text-[10px]">esc</Kbd>
                <span>to close</span>
              </span>
            </div>
          ) : null}
        </Command>
      </CommandDialog>
    </>
  );
}

function LoadingState() {
  return (
    <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground text-sm">
      <Spinner className="size-4" />
      <span>Loading animals…</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-4 text-destructive text-sm">{message}</div>
  );
}

function NoMatchesState({ query }: { query: string }) {
  return (
    <Empty className="h-56 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No matches for &ldquo;{query}&rdquo;</EmptyTitle>
        <EmptyDescription>
          Try searching by a different tag number, name, or breed.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NoAnimalsState({ onClose }: { onClose: () => void }) {
  return (
    <Empty className="h-56 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sprout />
        </EmptyMedia>
        <EmptyTitle>No animals yet</EmptyTitle>
        <EmptyDescription>
          Once you add animals to your herd, they&rsquo;ll show up here for
          quick access.
        </EmptyDescription>
      </EmptyHeader>
      <Button
        onClick={() => {
          onClose();
        }}
        size="sm"
        variant="outline"
      >
        Close
      </Button>
    </Empty>
  );
}

type ResultRowProps = {
  row: CattleRow;
  onSelect: () => void;
};

function ResultRow({ row, onSelect }: ResultRowProps) {
  const age = ageLabel(row.date_of_birth);
  const subtitle = [
    breedLabels[row.breed],
    age,
    row.weight_kg ? `${row.weight_kg} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <CommandItem
      onSelect={onSelect}
      value={`${row.tag_number} ${row.name ?? ""} ${row.breed}`}
    >
      <div className="flex w-full items-center gap-3">
        <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-muted font-medium text-muted-foreground text-xs">
          #{row.tag_number}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-foreground">
              {row.name ?? `Tag ${row.tag_number}`}
            </span>
            <GenderIcon gender={row.gender} />
          </div>
          <span className="truncate text-muted-foreground text-xs">
            {subtitle || "—"}
          </span>
        </div>
        <Badge
          className={cn("rounded-full", statusToneClass[row.status])}
          variant="outline"
        >
          {statusLabels[row.status]}
        </Badge>
        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
    </CommandItem>
  );
}
