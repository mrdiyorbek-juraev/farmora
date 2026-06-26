"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";

import { useCattleDetail } from "@/services/cattle";
import { AnimalFormModal } from "@/views/main/herd/modals/create-animal-modal";

import { AnimalHeader } from "./customs/animal-header";
import { AnimalMainContent } from "./customs/animal-main-content";
import { AnimalRecordDetails } from "./customs/animal-record-details";
import { AnimalSubHeader } from "./customs/animal-sub-header";

export function HerdDetailView({ id }: { id: string }) {
  const { cattle } = useCattleDetail(id);

  if (cattle.isPending) {
    return (
      <div className="flex flex-1 flex-col">
        <Skeleton className="h-16 w-full rounded-none" />
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
          <Skeleton className="m-4 h-96" />
          <Skeleton className="m-4 h-96" />
        </div>
      </div>
    );
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
         <div className="min-w-0 p-4">
          <AnimalMainContent animal={animal} />
        </div>
      </div>
      <AnimalFormModal />
    </div>
  );
}
