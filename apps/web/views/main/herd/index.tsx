"use client";

import { HerdSelectionToolbar } from "./customs/selection-toolbar";
import { HerdTable } from "./customs/table";
import { HerdToolbar } from "./customs/toolbar";

export function HerdView() {
  return (
    <div className="flex flex-1 flex-col">
      <HerdToolbar />
      <div className="flex-1 p-4">
        <HerdTable />
      </div>
      <HerdSelectionToolbar />
    </div>
  );
}
