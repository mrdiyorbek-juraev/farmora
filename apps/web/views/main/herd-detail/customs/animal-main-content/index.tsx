"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { format, isValid, parseISO } from "date-fns";
import { Activity, FileText, History, StickyNote } from "lucide-react";

import type { CattleWithHistory, Status } from "@/models/cattle";

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

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return "—";
  }
  return format(parsed, "MMM d, yyyy 'at' h:mm a");
}

export type AnimalMainContentProps = {
  animal: CattleWithHistory;
};

export function AnimalMainContent({ animal }: AnimalMainContentProps) {
  return (
    <Tabs className="flex h-full flex-col" defaultValue="history">
      <TabsList className="self-start">
        <TabsTrigger value="activity">
          <Activity />
          Activity
        </TabsTrigger>
        <TabsTrigger value="history">
          <History />
          Status history
        </TabsTrigger>
        <TabsTrigger value="notes">
          <StickyNote />
          Notes
        </TabsTrigger>
        <TabsTrigger value="files">
          <FileText />
          Files
        </TabsTrigger>
      </TabsList>

      <TabsContent className="mt-4 flex-1" value="activity">
        <EmptyState
          description="Future home for vaccinations, weigh-ins, treatments, and other timestamped events."
          title="No activity yet"
        />
      </TabsContent>

      <TabsContent className="mt-4 flex-1" value="history">
        {animal.status_history.length === 0 ? (
          <EmptyState
            description="Every time you change this animal's status it'll show up here."
            title="No status changes recorded yet."
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {animal.status_history.map((entry) => (
              <li
                className="flex flex-col gap-1 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                key={entry.id}
              >
                <div className="flex items-center gap-2">
                  {entry.from_status ? (
                    <Badge variant="outline">
                      {statusLabels[entry.from_status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">—</Badge>
                  )}
                  <span className="text-muted-foreground text-sm">→</span>
                  <Badge variant={statusVariant[entry.to_status]}>
                    {statusLabels[entry.to_status]}
                  </Badge>
                  {entry.note ? (
                    <span className="text-muted-foreground text-sm">
                      · {entry.note}
                    </span>
                  ) : null}
                </div>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {formatDateTime(entry.changed_at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </TabsContent>

      <TabsContent className="mt-4 flex-1" value="notes">
        {animal.notes ? (
          <div className="rounded-md border border-border p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {animal.notes}
            </p>
          </div>
        ) : (
          <EmptyState
            description="Add a note to this animal from the Edit panel."
            title="No notes yet"
          />
        )}
      </TabsContent>

      <TabsContent className="mt-4 flex-1" value="files">
        <EmptyState
          description="Vet reports, registration certificates, and photos will land here."
          title="No files attached"
        />
      </TabsContent>
    </Tabs>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed p-6 text-center">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
