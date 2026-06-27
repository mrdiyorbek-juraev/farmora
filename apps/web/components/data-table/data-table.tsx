"use client";

import { useTheme } from "@repo/design-system";
import { cn } from "@repo/design-system/lib/utils";
import {
  AllCommunityModule,
  type ColDef,
  type GridApi,
  type GridOptions,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

// `useSyncExternalStore` lets the SSR render and the first client render
// agree on a value without the useState+useEffect ping-pong that flashes
// the wrong theme on mount.
const noopSubscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

ModuleRegistry.registerModules([AllCommunityModule]);

// ─── Themes ────────────────────────────────────────────────────────
// Built with themeQuartz.withParams so we can swap on next-themes
// `resolvedTheme` without re-mounting the grid. Colors lean on
// shadcn-equivalent neutrals so the table sits inside the rest of
// the UI without an obvious AG Grid skin.

const sharedThemeParams = {
  fontFamily: "inherit",
  fontSize: 13,
  rowHeight: 40,
  headerHeight: 36,
  borderRadius: 8,
  wrapperBorderRadius: 12,
  spacing: 6,
  headerFontWeight: 600,
} as const;

const lightTheme = themeQuartz.withParams({
  ...sharedThemeParams,
  accentColor: "rgb(15, 23, 42)",
  backgroundColor: "rgb(255, 255, 255)",
  chromeBackgroundColor: "rgb(250, 250, 250)",
  headerBackgroundColor: "rgb(250, 250, 250)",
  headerTextColor: "rgb(82, 82, 91)",
  foregroundColor: "rgb(15, 23, 42)",
  borderColor: "rgb(229, 231, 235)",
  rowBorder: { style: "solid", width: 1, color: "rgb(243, 244, 246)" },
  columnBorder: { style: "solid", width: 1, color: "rgb(243, 244, 246)" },
  headerColumnBorder: {
    style: "solid",
    width: 1,
    color: "rgb(229, 231, 235)",
  },
  headerColumnBorderHeight: "60%",
  oddRowBackgroundColor: "rgb(255, 255, 255)",
  rowHoverColor: "rgb(248, 250, 252)",
  selectedRowBackgroundColor: "rgba(15, 23, 42, 0.04)",
  columnHoverColor: "rgb(248, 250, 252)",
  menuBackgroundColor: "rgb(255, 255, 255)",
  menuTextColor: "rgb(15, 23, 42)",
  menuBorder: { style: "solid", width: 1, color: "rgb(229, 231, 235)" },
  menuShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  popupShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  inputBackgroundColor: "rgb(255, 255, 255)",
  tooltipBackgroundColor: "rgb(255, 255, 255)",
});

const darkTheme = themeQuartz.withParams({
  ...sharedThemeParams,
  accentColor: "rgb(226, 232, 240)",
  backgroundColor: "rgb(10, 10, 11)",
  chromeBackgroundColor: "rgb(17, 17, 19)",
  headerBackgroundColor: "rgb(17, 17, 19)",
  headerTextColor: "rgb(161, 161, 170)",
  foregroundColor: "rgb(226, 232, 240)",
  borderColor: "rgb(39, 39, 42)",
  rowBorder: { style: "solid", width: 1, color: "rgb(28, 28, 31)" },
  columnBorder: { style: "solid", width: 1, color: "rgb(28, 28, 31)" },
  headerColumnBorder: { style: "solid", width: 1, color: "rgb(39, 39, 42)" },
  headerColumnBorderHeight: "60%",
  oddRowBackgroundColor: "rgb(10, 10, 11)",
  rowHoverColor: "rgb(24, 24, 27)",
  selectedRowBackgroundColor: "rgba(226, 232, 240, 0.06)",
  columnHoverColor: "rgb(24, 24, 27)",
  menuBackgroundColor: "rgb(17, 17, 19)",
  menuTextColor: "rgb(226, 232, 240)",
  menuBorder: { style: "solid", width: 1, color: "rgb(39, 39, 42)" },
  menuShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
  popupShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
  inputBackgroundColor: "rgb(24, 24, 27)",
  tooltipBackgroundColor: "rgb(17, 17, 19)",
});

const defaultColDefBase: ColDef = {
  resizable: true,
  sortable: true,
  // Column-header filter UI is replaced by the page-level <Filters>
  // toolbar — drop the funnel button from every header.
  filter: false,
  suppressHeaderMenuButton: true,
  suppressHeaderFilterButton: true,
  minWidth: 120,
  suppressMovable: false,
};

export type DataTableProps<T> = {
  rowData: T[] | undefined;
  columnDefs: ColDef<T>[];
  loading?: boolean;
  className?: string;
  onRowClicked?: (row: T) => void;
  /** Fires whenever the set of selected rows changes (header + per-row clicks). */
  onSelectionChange?: (rows: T[]) => void;
  /**
   * Increment to imperatively clear AG Grid's selection from a parent — useful
   * after a bulk delete or when a "Clear selection" affordance fires.
   */
  clearSelectionSignal?: number;
  gridOptions?: Omit<GridOptions<T>, "rowData" | "columnDefs">;
  /** Defaults to true — checkbox column on the first cell + header. */
  selectable?: boolean;
};

export function DataTable<T>({
  rowData,
  columnDefs,
  loading,
  className,
  onRowClicked,
  onSelectionChange,
  clearSelectionSignal,
  gridOptions,
  selectable = true,
}: DataTableProps<T>) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noopSubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const gridApiRef = useRef<GridApi<T> | null>(null);

  useEffect(() => {
    if (clearSelectionSignal === undefined) {
      return;
    }
    gridApiRef.current?.deselectAll();
  }, [clearSelectionSignal]);

  const theme = useMemo(() => {
    if (!mounted) {
      return lightTheme;
    }
    return resolvedTheme === "dark" ? darkTheme : lightTheme;
  }, [mounted, resolvedTheme]);

  const defaultColDef = useMemo<ColDef<T>>(
    () => defaultColDefBase as ColDef<T>,
    []
  );

  const finalColumnDefs = useMemo<ColDef<T>[]>(() => {
    if (!selectable || columnDefs.length === 0) {
      return columnDefs;
    }
    const [first, ...rest] = columnDefs;
    return [
      {
        ...first,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
      },
      ...rest,
    ];
  }, [columnDefs, selectable]);

  return (
    <div className={cn("h-full w-full", className)}>
      <AgGridReact<T>
        animateRows
        columnDefs={finalColumnDefs}
        defaultColDef={defaultColDef}
        loading={loading}
        onRowClicked={
          onRowClicked
            ? (event) => {
                if (event.data) {
                  onRowClicked(event.data);
                }
              }
            : undefined
        }
        onGridReady={(event) => {
          gridApiRef.current = event.api;
        }}
        onSelectionChanged={
          onSelectionChange
            ? (event) => onSelectionChange(event.api.getSelectedRows() as T[])
            : undefined
        }
        rowData={rowData}
        rowSelection={selectable ? "multiple" : undefined}
        suppressCellFocus
        theme={theme}
        {...gridOptions}
      />
    </div>
  );
}
