"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { DialogFooter } from "@repo/design-system/components/ui/dialog";
import { Label } from "@repo/design-system/components/ui/label";
import { Switch } from "@repo/design-system/components/ui/switch";

import type { TagAvailability } from "../types";

interface AnimalFormFooterProps {
  createMore: boolean;
  isEdit: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  onCancel: () => void;
  onCreateMoreChange: (next: boolean) => void;
  tagAvailability: TagAvailability;
}

export function AnimalFormFooter({
  isEdit,
  createMore,
  onCreateMoreChange,
  tagAvailability,
  isSubmitting,
  isValid,
  onCancel,
}: AnimalFormFooterProps) {
  const submitDisabled =
    isSubmitting ||
    !isValid ||
    tagAvailability === "taken" ||
    tagAvailability === "checking";

  return (
    <DialogFooter className="items-center gap-3 sm:justify-between">
      {/* Create-more only makes sense when adding new animals — in edit */}
      {/* mode we always close after a successful save. */}
      {isEdit ? (
        <div />
      ) : (
        <div className="flex items-center gap-2">
          <Switch
            checked={createMore}
            id="create_more"
            onCheckedChange={onCreateMoreChange}
          />
          <Label className="cursor-pointer" htmlFor="create_more">
            Create more
          </Label>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={submitDisabled} type="submit">
          {isEdit ? "Save changes" : "Add animal"}
        </Button>
      </div>
    </DialogFooter>
  );
}
