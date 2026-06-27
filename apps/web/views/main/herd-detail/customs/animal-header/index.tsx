"use client";

import { useConfirm } from "@repo/design-system/components/composed/confirm-dialog";
import { TruncatedText } from "@repo/design-system/components/composed/truncated-text";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Wheat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCattleMutations } from "@/services/cattle/mutations";
import { useGlobalModal } from "@/stores/shared/modal-store";
import type { AnimalHeaderProps } from "@/types/main/herd-detail";

export function AnimalHeader({ animal }: AnimalHeaderProps) {
  const title = animal.name ?? animal.tag_number;
  const subtitle = animal.name ? animal.tag_number : null;
  const setModal = useGlobalModal((state) => state.setModal);
  const { onDelete } = useCattleMutations();
  const confirm = useConfirm();
  const router = useRouter();

  const handleEdit = () => {
    // Reuse the same dialog the herd list uses — props carries the
    // current animal, so the modal opens in "edit" mode pre-filled.
    setModal({ animalForm: { open: true, props: animal } });
  };

  const handleRemove = async () => {
    const result = await confirm({
      title: `Remove ${title}?`,
      description:
        "This permanently deletes the animal and its status history. This cannot be undone.",
      confirmText: "Remove",
      cancelText: "Cancel",
      loadingText: "Removing...",
      confirmButton: { variant: "destructive" },
    });
    if (!result.confirmed) {
      return;
    }
    confirm.setLoading(true);
    try {
      await onDelete.mutateAsync({ id: animal.id });
      result.close();
      // Bounce back to the list — the row is gone and visiting this URL
      // would just show the "not found" state.
      router.push("/herd");
    } catch {
      // Toast handled inside useCattleMutations.onDelete.
    } finally {
      confirm.setLoading(false);
    }
  };

  return (
    <header className="flex items-center justify-between gap-3 border-border border-b px-4 py-3">
      {/* `min-w-0` on the flex container lets the title shrink and */}
      {/* truncate instead of pushing the kebab off-screen on long names. */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          aria-label="Back to herd"
          asChild
          size="icon-sm"
          variant="ghost"
        >
          <Link href="/herd">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
          <Wheat className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <TruncatedText
            className="font-semibold text-base tracking-tight"
            text={title}
          />
          {subtitle ? (
            <TruncatedText
              className="font-medium text-muted-foreground text-xs tabular-nums"
              text={subtitle}
            />
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="More actions" size="icon-sm" variant="ghost">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={handleEdit}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={handleRemove}
          >
            <Trash2 />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
