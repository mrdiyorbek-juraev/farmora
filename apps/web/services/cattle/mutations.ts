"use client";

import { useOrganization } from "@repo/auth/client";
import { toast } from "@repo/design-system/components/ui/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createCattleAction,
  deleteCattleAction,
  deleteManyCattleAction,
  updateCattleAction,
} from "@/app/_actions/cattle";
import type {
  CreateCattleInput,
  DeleteCattleInput,
  DeleteManyCattleInput,
  UpdateCattleInput,
} from "@/models/cattle";

import { activityKeys } from "../activity/keys";
import { dashboardKeys } from "../dashboard/keys";

import { cattleKeys } from "./keys";

type ToastId = string | number;

function extractMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }
  return undefined;
}

export const useCattleMutations = () => {
  const { organization } = useOrganization();
  const orgId = organization?.id ?? "";
  const queryClient = useQueryClient();

  // Cattle changes shift every dashboard metric (counts, breakdowns,
  // age buckets) and append a row to the activity feed, so the
  // cattle/dashboard/activity scopes always invalidate together.
  const invalidateScope = () => {
    queryClient.invalidateQueries({ queryKey: cattleKeys.all(orgId) });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all(orgId) });
    queryClient.invalidateQueries({ queryKey: activityKeys.all(orgId) });
  };

  // ── Create ──────────────────────────────────────────────────────

  const onCreate = useMutation({
    mutationFn: (values: CreateCattleInput) => createCattleAction(values),
    onMutate: () => {
      const toastId = toast.loading("Adding cattle...");
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      toast.success("Cattle added.", { id: context?.toastId as ToastId });
      invalidateScope();
    },
    onError: (error, _variables, context) => {
      toast.error("Failed to add cattle.", {
        description: extractMessage(error),
        id: context?.toastId as ToastId,
      });
    },
  });

  // ── Update ──────────────────────────────────────────────────────

  const onUpdate = useMutation({
    mutationFn: (values: UpdateCattleInput) => updateCattleAction(values),
    onMutate: () => {
      const toastId = toast.loading("Updating cattle...");
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      toast.success("Cattle updated.", { id: context?.toastId as ToastId });
      queryClient.invalidateQueries({
        queryKey: cattleKeys.detail(orgId, data.id),
      });
      invalidateScope();
    },
    onError: (error, _variables, context) => {
      toast.error("Failed to update cattle.", {
        description: extractMessage(error),
        id: context?.toastId as ToastId,
      });
    },
  });

  // ── Delete ──────────────────────────────────────────────────────

  const onDelete = useMutation({
    mutationFn: (values: DeleteCattleInput) => deleteCattleAction(values),
    onMutate: () => {
      const toastId = toast.loading("Removing cattle...");
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      toast.success("Cattle removed.", { id: context?.toastId as ToastId });
      queryClient.removeQueries({
        queryKey: cattleKeys.detail(orgId, data.id),
      });
      invalidateScope();
    },
    onError: (error, _variables, context) => {
      toast.error("Failed to remove cattle.", {
        description: extractMessage(error),
        id: context?.toastId as ToastId,
      });
    },
  });

  // ── Delete many ─────────────────────────────────────────────────

  const onDeleteMany = useMutation({
    mutationFn: (values: DeleteManyCattleInput) =>
      deleteManyCattleAction(values),
    onMutate: (values) => {
      const toastId = toast.loading(
        `Removing ${values.ids.length} cattle...`
      );
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      toast.success(
        `${data.deleted} cattle removed.`,
        { id: context?.toastId as ToastId }
      );
      for (const id of data.ids) {
        queryClient.removeQueries({
          queryKey: cattleKeys.detail(orgId, id),
        });
      }
      invalidateScope();
    },
    onError: (error, _variables, context) => {
      toast.error("Failed to remove cattle.", {
        description: extractMessage(error),
        id: context?.toastId as ToastId,
      });
    },
  });

  return { onCreate, onUpdate, onDelete, onDeleteMany };
};
