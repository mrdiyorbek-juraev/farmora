"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { format, isValid, parseISO } from "date-fns";
import { AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { type ColDef, DataTable } from "@/components/data-table";
import type { CattleRow, Status } from "@/models/cattle";
import { useCattleList } from "@/services/cattle";
import { useHerdStore } from "@/stores/herd";

import { mapToListInput, useHerdFeatures } from "../../features";

const breedLabels: Record<string, string> = {
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

const acquisitionLabels: Record<string, string> = {
  born_on_farm: "Born on farm",
  purchased: "Purchased",
};

const genderLabels: Record<string, string> = {
  female: "Female",
  male: "Male",
};

const statusLabels: Record<Status, string> = {
  active: "Active",
  sick: "Sick",
  pregnant: "Pregnant",
  sold: "Sold",
  deceased: "Deceased",
};

const statusVariant: Record<
  Status,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  sick: "destructive",
  pregnant: "secondary",
  sold: "outline",
  deceased: "outline",
};

const EM_DASH = "—";

// Cattle dates land as ISO date strings (`yyyy-MM-dd`) when picked via the
// DateField and as full ISO timestamps for created_at-style fields. Parse
// both safely and bail to an em-dash on null/empty/invalid so the cell
// never reads "Invalid Date".
function formatDate(value: string | null | undefined) {
  if (!value) {
    return EM_DASH;
  }
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return EM_DASH;
  }
  return format(parsed, "MMM d, yyyy");
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

function formatWeight(value: number | null | undefined) {
  if (value == null) {
    return EM_DASH;
  }
  return `${numberFormatter.format(value)} kg`;
}

// Header component for the Tag column — renders the column label plus
// a "+" button that calls back into HerdView to open the create modal.
// AG Grid forwards `displayName` (the column's headerName) automatically;
// `onAddNew` arrives via `headerComponentParams` so the closure stays
// reactive when the parent prop changes.
function TagHeader(props: { displayName: string; onAddNew?: () => void }) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <span>{props.displayName}</span>
      {props.onAddNew ? (
        <Button
          aria-label="Add new animal"
          onClick={props.onAddNew}
          size="icon-xs"
          variant="outline"
        >
          <Plus />
        </Button>
      ) : null}
    </div>
  );
}

// All possible columns, keyed by ViewColumn id. HerdView's store decides
// which ones render and in what order.
const allColumnDefs: Record<string, ColDef<CattleRow>> = {
  tag_number: {
    field: "tag_number",
    headerName: "Tag",
    minWidth: 160,
    pinned: "left",
    headerComponent: TagHeader,
    cellRenderer: (params: { value: string | null; data?: CattleRow }) => {
      if (!params.value) {
        return EM_DASH;
      }
      // Render the tag as a real Next.js Link so right-click / cmd-click /
      // middle-click all work, and the URL preview shows in the status bar.
      if (params.data?.id) {
        return (
          <Link
            className="font-medium tabular-nums hover:underline"
            href={`/herd/${params.data.id}`}
          >
            {params.value}
          </Link>
        );
      }
      return <span className="font-medium tabular-nums">{params.value}</span>;
    },
  },
  name: {
    field: "name",
    headerName: "Name",
    minWidth: 160,
    valueFormatter: (params) => params.value ?? EM_DASH,
  },
  breed: {
    field: "breed",
    headerName: "Breed",
    minWidth: 140,
    cellRenderer: (params: { value: string | null }) => {
      if (!params.value) {
        return EM_DASH;
      }
      return (
        <Badge variant="secondary">
          {breedLabels[params.value] ?? params.value}
        </Badge>
      );
    },
  },
  gender: {
    field: "gender",
    headerName: "Gender",
    maxWidth: 120,
    minWidth: 100,
    cellRenderer: (params: { value: string | null }) => {
      if (!params.value) {
        return EM_DASH;
      }
      return (
        <Badge variant="outline">
          {genderLabels[params.value] ?? params.value}
        </Badge>
      );
    },
  },
  status: {
    field: "status",
    headerName: "Status",
    maxWidth: 140,
    minWidth: 110,
    cellRenderer: (params: { value: Status | null }) => {
      if (!params.value) {
        return EM_DASH;
      }
      return (
        <Badge variant={statusVariant[params.value]}>
          {statusLabels[params.value]}
        </Badge>
      );
    },
  },
  date_of_birth: {
    field: "date_of_birth",
    headerName: "DOB",
    minWidth: 140,
    cellClass: "tabular-nums",
    valueFormatter: (params) => formatDate(params.value),
  },
  weight_kg: {
    field: "weight_kg",
    headerName: "Weight",
    maxWidth: 140,
    minWidth: 110,
    cellClass: "tabular-nums",
    valueFormatter: (params) => formatWeight(params.value),
  },
  acquisition: {
    field: "acquisition",
    headerName: "Acquisition",
    minWidth: 150,
    cellRenderer: (params: { value: string | null }) => {
      if (!params.value) {
        return EM_DASH;
      }
      return (
        <Badge variant="outline">
          {acquisitionLabels[params.value] ?? params.value}
        </Badge>
      );
    },
  },
  acquired_date: {
    field: "acquired_date",
    headerName: "Acquired",
    minWidth: 140,
    cellClass: "tabular-nums",
    valueFormatter: (params) => formatDate(params.value),
  },
};

export function HerdTable() {
  const storeFilters = useHerdStore((state) => state.filters);
  const sorts = useHerdStore((state) => state.sorts);
  const columns = useHerdStore((state) => state.columns);
  const clearSelectionSignal = useHerdStore((state) => state.clearSignal);
  const onSelectionChange = useHerdStore((state) => state.setSelectedRows);
  const { handleAddNew } = useHerdFeatures();

  const filters = useMemo(
    () => mapToListInput(storeFilters, sorts),
    [storeFilters, sorts]
  );

  const { cattle } = useCattleList({ filters });

  const rows = useMemo<CattleRow[]>(
    () => cattle.data?.pages.flatMap((page) => page.rows) ?? [],
    [cattle.data]
  );

  const columnDefs = useMemo<ColDef<CattleRow>[]>(() => {
    const visible = columns
      .filter((column) => !column.isHidden)
      .map((column) => allColumnDefs[column.id])
      .filter((def): def is ColDef<CattleRow> => Boolean(def));

    const withHeader = visible.map((def) => {
      if (def.field !== "tag_number") {
        return def;
      }
      return {
        ...def,
        headerComponentParams: { onAddNew: handleAddNew },
      };
    });

    // Stretch the last column so it consumes leftover horizontal space.
    // Drop any `maxWidth` from that column too so flex can actually grow.
    return withHeader.map((def, index) => {
      if (index !== withHeader.length - 1) {
        return def;
      }
      const { maxWidth: _maxWidth, ...rest } = def;
      return { ...rest, flex: 1, minWidth: rest.minWidth ?? 160 };
    });
  }, [columns, handleAddNew]);

  if (cattle.isError) {
    return (
      <div className="p-4">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>Couldn&rsquo;t load the herd</EmptyTitle>
            <EmptyDescription>
              {cattle.error instanceof Error
                ? cattle.error.message
                : "Something went wrong loading your animals. Try again."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <DataTable
      clearSelectionSignal={clearSelectionSignal}
      columnDefs={columnDefs}
      loading={cattle.isPending}
      onSelectionChange={onSelectionChange}
      rowData={rows}
    />
  );
}
