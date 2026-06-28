"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { format, isValid, parseISO } from "date-fns";
import {
  Cake,
  CalendarCheck,
  Clock,
  Dna,
  Handshake,
  HeartPulse,
  PawPrint,
  Plus,
  Tag,
  VenusAndMars,
  Weight,
} from "lucide-react";
import { useCallback } from "react";

import { formatKg } from "@/lib/utils/weight";
import type {
  Acquisition,
  Breed,
  Gender,
  Status,
  UpdateCattleInput,
} from "@/models/cattle";
import { useCattleMutations } from "@/services/cattle/mutations";
import { useGlobalModal } from "@/stores/shared/modal-store";
import type { AnimalRecordDetailsProps } from "@/types/main/herd-detail";

import { EditableDateRow } from "../editable-date-row";
import { EditableSelectRow } from "../editable-select-row";
import { EditableTextRow, ReadOnlyTextRow } from "../editable-text-row";

const breedOptions: { value: Breed; label: string }[] = [
  { value: "holstein", label: "Holstein" },
  { value: "jersey", label: "Jersey" },
  { value: "angus", label: "Angus" },
  { value: "hereford", label: "Hereford" },
  { value: "brown_swiss", label: "Brown Swiss" },
  { value: "guernsey", label: "Guernsey" },
  { value: "charolais", label: "Charolais" },
  { value: "simmental", label: "Simmental" },
  { value: "other", label: "Other" },
];

const genderOptions: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

const statusOptions: { value: Status; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "sick", label: "Sick" },
  { value: "pregnant", label: "Pregnant" },
  { value: "sold", label: "Sold" },
  { value: "deceased", label: "Deceased" },
];

const acquisitionOptions: { value: Acquisition; label: string }[] = [
  { value: "born_on_farm", label: "Born on farm" },
  { value: "purchased", label: "Purchased" },
];

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

export function AnimalRecordDetails({ animal }: AnimalRecordDetailsProps) {
  const { onUpdate } = useCattleMutations();
  const setModal = useGlobalModal((state) => state.setModal);

  const openRecordWeight = () =>
    setModal({
      weightForm: { open: true, cattleId: animal.id, editing: null },
    });

  const handleSave = useCallback(
    <K extends keyof UpdateCattleInput>(
      field: K,
      value: UpdateCattleInput[K]
    ) => {
      return onUpdate.mutateAsync({
        id: animal.id,
        [field]: value,
      } as UpdateCattleInput);
    },
    [animal.id, onUpdate]
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 pb-1 font-medium text-sm">
        Record details
      </div>

      <EditableTextRow
        icon={<Tag className="size-3.5" />}
        label="Tag"
        maxLength={64}
        onSave={(next) => handleSave("tag_number", next)}
        placeholder="A-0001"
        tabular
        value={animal.tag_number}
      />
      <EditableTextRow
        icon={<PawPrint className="size-3.5" />}
        label="Name"
        maxLength={120}
        onSave={(next) => handleSave("name", next.length > 0 ? next : null)}
        placeholder="Add name"
        value={animal.name ?? ""}
      />
      <EditableSelectRow
        icon={<Dna className="size-3.5" />}
        label="Breed"
        onSave={(next) => handleSave("breed", next as Breed)}
        options={breedOptions}
        renderValue={(value) => (
          <Badge variant="secondary">
            {breedOptions.find((option) => option.value === value)?.label ??
              value}
          </Badge>
        )}
        value={animal.breed}
      />
      <EditableSelectRow
        icon={<VenusAndMars className="size-3.5" />}
        label="Gender"
        onSave={(next) => handleSave("gender", next as Gender)}
        options={genderOptions}
        renderValue={(value) => (
          <Badge variant="outline">
            {genderOptions.find((option) => option.value === value)?.label ??
              value}
          </Badge>
        )}
        value={animal.gender}
      />
      <EditableSelectRow
        icon={<HeartPulse className="size-3.5" />}
        label="Status"
        onSave={(next) => handleSave("status", next as Status)}
        options={statusOptions}
        renderValue={(value) => {
          const status = value as Status;
          return (
            <Badge variant={statusVariant[status]}>
              {statusOptions.find((option) => option.value === status)?.label ??
                status}
            </Badge>
          );
        }}
        value={animal.status}
      />
      <EditableDateRow
        disableFuture
        icon={<Cake className="size-3.5" />}
        label="Date of birth"
        onSave={(next) => handleSave("date_of_birth", next ?? "")}
        placeholder="Pick birth date"
        value={animal.date_of_birth}
      />
      {/* Weight is read-only here — it's the latest weigh-in, owned by the */}
      {/* Weight history tab. Editing it directly would be overwritten the */}
      {/* next time a measurement is recorded, so we record one instead. */}
      <ReadOnlyTextRow
        icon={<Weight className="size-3.5" />}
        label="Weight"
        tabular
        value={
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium tabular-nums">
              {animal.weight_kg == null
                ? "—"
                : `${formatKg(animal.weight_kg)} kg`}
            </span>
            <Button
              className="h-6 px-2 text-xs"
              onClick={openRecordWeight}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Plus className="size-3" />
              Record
            </Button>
          </div>
        }
      />
      <EditableSelectRow
        icon={<Handshake className="size-3.5" />}
        label="Acquisition"
        onSave={(next) => handleSave("acquisition", next as Acquisition)}
        options={acquisitionOptions}
        renderValue={(value) => (
          <Badge variant="outline">
            {acquisitionOptions.find((option) => option.value === value)
              ?.label ?? value}
          </Badge>
        )}
        value={animal.acquisition}
      />
      <EditableDateRow
        disableFuture
        icon={<CalendarCheck className="size-3.5" />}
        label="Acquired"
        onSave={(next) => handleSave("acquired_date", next)}
        placeholder="Pick acquired date"
        value={animal.acquired_date}
      />
      <ReadOnlyTextRow
        icon={<Clock className="size-3.5" />}
        label="Last updated"
        tabular
        value={formatDateTime(animal.updated_at)}
      />
    </div>
  );
}
