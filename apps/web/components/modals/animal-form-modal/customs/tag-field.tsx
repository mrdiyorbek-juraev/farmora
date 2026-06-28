"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@repo/design-system/components/ui/input-group";
import { FastField, type FastFieldProps } from "formik";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import {
  checkCattleTagAvailableAction,
  generateCattleTagAction,
} from "@/app/_actions/cattle";

import type { TagAvailability } from "../types";
import { FormRow } from "./form-row";

const CHECK_DEBOUNCE_MS = 400;

// Debounced server check so we don't fire on every keystroke. In edit mode,
// pass the row's own id as `excludeId` so the cattle's existing tag still
// reads as "available" until the farmer changes it.
function useTagAvailability(
  tag: string,
  excludeId: string | undefined
): TagAvailability {
  const [state, setState] = useState<TagAvailability>("idle");

  useEffect(() => {
    const trimmed = tag.trim();
    if (trimmed.length === 0) {
      setState("idle");
      return;
    }
    setState("checking");
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const { available } = await checkCattleTagAvailableAction({
          tag_number: trimmed,
          exclude_id: excludeId,
        });
        if (!cancelled) {
          setState(available ? "available" : "taken");
        }
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }, CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [tag, excludeId]);

  return state;
}

interface TagFieldProps {
  excludeId: string | undefined;
  onAvailabilityChange: (state: TagAvailability) => void;
}

// Lives inside Formik so it can read the tag value. Owns the debounced
// availability check and the Generate button, and reports its state up so
// the submit button can react.
export function TagField({ excludeId, onAvailabilityChange }: TagFieldProps) {
  return (
    <FastField name="tag_number">
      {({ field, meta, form }: FastFieldProps<string>) => (
        <TagFieldInner
          excludeId={excludeId}
          field={field}
          form={form}
          meta={meta}
          onAvailabilityChange={onAvailabilityChange}
        />
      )}
    </FastField>
  );
}

type TagFieldInnerProps = TagFieldProps & FastFieldProps<string>;

function TagFieldInner({
  excludeId,
  field,
  form,
  meta,
  onAvailabilityChange,
}: TagFieldInnerProps) {
  const availability = useTagAvailability(field.value, excludeId);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    onAvailabilityChange(availability);
  }, [availability, onAvailabilityChange]);

  const validationError = meta.touched ? meta.error : undefined;
  const takenError =
    availability === "taken"
      ? "This tag is already used in your herd."
      : undefined;
  const errorMessage = validationError ?? takenError;
  const showAvailable =
    availability === "available" && field.value.trim().length > 0;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { tag } = await generateCattleTagAction();
      form.setFieldValue("tag_number", tag);
      form.setFieldTouched("tag_number", true, false);
    } catch {
      // Toasting is handled at the mutations layer; a silent failure here
      // is fine — the farmer can retry or type a tag manually.
    } finally {
      setGenerating(false);
    }
  };

  return (
    <FormRow error={errorMessage} htmlFor="tag_number" label="Tag *">
      <InputGroup>
        <InputGroupInput
          {...field}
          aria-invalid={Boolean(errorMessage)}
          id="tag_number"
          placeholder="840-XXX-XXXX-XXXX or A-0001"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label="Generate tag"
            disabled={generating}
            onClick={handleGenerate}
            size="xs"
            type="button"
          >
            {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Generate
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {availability === "checking" ? (
        <p className="flex items-center gap-1 text-muted-foreground text-sm">
          <Loader2 className="size-3 animate-spin" /> Checking…
        </p>
      ) : null}
      {showAvailable ? (
        <p className="flex items-center gap-1 text-emerald-600 text-sm">
          <Check className="size-3" /> Available
        </p>
      ) : null}
    </FormRow>
  );
}
