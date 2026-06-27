"use client";

import { useOrganization } from "@repo/auth/client";
import { toast } from "@repo/design-system/components/ui/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteWeightAction, recordWeightAction } from "@/app/_actions/weight";
import type { DeleteWeightInput, RecordWeightInput } from "@/models/weight";

import { activityKeys } from "../activity/keys";
import { cattleKeys } from "../cattle/keys";
import { dashboardKeys } from "../dashboard/keys";

import { weightKeys } from "./keys";

type ToastId = string | number;

function extractMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}

export const useWeightMutations = (cattleId: string) => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";
  const queryClient = useQueryClient();

  // A weight record refreshes the animal's series, updates its
  // denormalized current weight (cattle detail + list), and appends an
  // activity row — so the weight/cattle/dashboard/activity scopes
  // invalidate together.
  const invalidateScope = () => {
    queryClient.invalidateQueries({
      queryKey: weightKeys.history(orgId, cattleId),
    });
    queryClient.invalidateQueries({
      queryKey: cattleKeys.detail(orgId, cattleId),
    });
    queryClient.invalidateQueries({ queryKey: cattleKeys.all(orgId) });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all(orgId) });
    queryClient.invalidateQueries({ queryKey: activityKeys.all(orgId) });
  };

  // ── Record ──────────────────────────────────────────────────────

  const onRecord = useMutation({
    mutationFn: (values: RecordWeightInput) => recordWeightAction(values),
    onMutate: () => {
      const toastId = toast.loading("Recording weight...");
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      toast.success("Weight recorded.", { id: context?.toastId as ToastId });
      invalidateScope();
    },
    onError: (error, _variables, context) => {
      toast.error("Failed to record weight.", {
        description: extractMessage(error),
        id: context?.toastId as ToastId,
      });
    },
  });

  // ── Delete ──────────────────────────────────────────────────────

  const onDelete = useMutation({
    mutationFn: (values: DeleteWeightInput) => deleteWeightAction(values),
    onMutate: () => {
      const toastId = toast.loading("Removing measurement...");
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      toast.success("Measurement removed.", {
        id: context?.toastId as ToastId,
      });
      invalidateScope();
    },
    onError: (error, _variables, context) => {
      toast.error("Failed to remove measurement.", {
        description: extractMessage(error),
        id: context?.toastId as ToastId,
      });
    },
  });

  return { onRecord, onDelete };
};
