"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../ui/button";

interface FilePreviewProps {
  children: ReactNode;
  fileName?: string;
  src: string;
}

function getPreviewUrl(src: string, fileName?: string): string {
  const lowerName = (fileName ?? src).toLowerCase();
  if (lowerName.endsWith(".pdf")) {
    return src;
  }
  if (
    lowerName.endsWith(".doc") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".ppt") ||
    lowerName.endsWith(".pptx") ||
    lowerName.endsWith(".xls") ||
    lowerName.endsWith(".xlsx")
  ) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`;
  }
  return src;
}

function FilePreview({ children, fileName, src }: FilePreviewProps) {
  const previewUrl = getPreviewUrl(src, fileName);

  return (
    <DialogPrimitive.Root data-slot="file-preview">
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=open]:animate-in"
          data-slot="file-preview-overlay"
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          data-slot="file-preview-content"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            {fileName ?? "File Preview"}
          </DialogPrimitive.Title>

          {/* Close button */}
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Close"
              className="absolute top-4 right-4 z-10 text-white/70 hover:bg-white/10 hover:text-white"
              size="icon"
              variant="ghost"
            >
              <XIcon className="size-5" />
            </Button>
          </DialogPrimitive.Close>

          {/* Backdrop close */}
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Close preview"
              className="absolute inset-0 z-0 h-full w-full cursor-default rounded-none opacity-0"
              variant="ghost"
            />
          </DialogPrimitive.Close>

          {/* File viewer */}
          <iframe
            className="relative z-10 h-[85vh] w-[85vw] rounded-lg border-0 bg-white"
            src={previewUrl}
            title={fileName ?? "File preview"}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export type { FilePreviewProps };
export { FilePreview };
