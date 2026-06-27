"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";

import { useCattleDetail } from "@/services/cattle";
import { AnimalHeader } from "./customs/animal-header";
import { AnimalMainContent } from "./customs/animal-main-content";
import { AnimalRecordDetails } from "./customs/animal-record-details";
import { AnimalSubHeader } from "./customs/animal-sub-header";
import { HerdDetailSkeleton } from "./customs/herd-detail-skeleton";

export function HerdDetailView({ id }: { id: string }) {
  const { cattle } = useCattleDetail(id);

  if (cattle.isPending) {
    return <HerdDetailSkeleton />;
  }

  if (cattle.isError || !cattle.data) {
    return (
      <div className="flex flex-1 flex-col p-4">
        <Card>
          <CardHeader>
            <CardTitle>Animal not found</CardTitle>
            <CardDescription>
              {cattle.error?.message ??
                "This animal doesn't exist in this organization, or you don't have access to it."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const animal = cattle.data;

  return (
    <div className="flex flex-1 flex-col">
      <AnimalHeader animal={animal} />
      <AnimalSubHeader animal={animal} />
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="min-w-0 border-border p-4 lg:border-r">
          <AnimalRecordDetails animal={animal} />
        </div>
        <div className="min-w-0 py-4">
          <AnimalMainContent animal={animal} />
        </div>
      </div>
    </div>
  );
}
