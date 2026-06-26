"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Minus, Plus, RotateCw, XIcon } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { Button } from "../ui/button";

interface ImagePreviewProps {
  children: ReactNode;
  src: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function ImagePreview({ children, src }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const resetState = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const rotate = useCallback(() => {
    setRotation((r) => r + 90);
  }, []);

  return (
    <DialogPrimitive.Root
      data-slot="image-preview"
      onOpenChange={(open) => {
        if (open) {
          resetState();
        }
      }}
    >
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=open]:animate-in"
          data-slot="image-preview-overlay"
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center outline-none"
          data-slot="image-preview-content"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            Image Preview
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

          {/* Backdrop close — invisible button behind everything */}
          <DialogPrimitive.Close asChild>
            <Button
              aria-label="Close preview"
              className="absolute inset-0 z-0 h-full w-full cursor-default rounded-none opacity-0"
              variant="ghost"
            />
          </DialogPrimitive.Close>

          {/* Image */}
          <div className="relative z-10 flex items-center justify-center">
            {/* biome-ignore lint/performance/noImgElement: design system component, not a Next.js page */}
            {/* biome-ignore lint/correctness/useImageSize: dimensions unknown, sized via max-h/max-w */}
            <img
              alt="Preview"
              className="max-h-[80vh] max-w-[80vw] select-none object-contain transition-transform duration-200"
              draggable={false}
              src={src}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
            />
          </div>

          {/* Toolbar */}
          <div className="absolute bottom-6 z-10 flex items-center gap-1 rounded-lg border border-white/10 bg-black/60 px-2 py-1 backdrop-blur-sm">
            <Button
              aria-label="Zoom out"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              disabled={zoom <= MIN_ZOOM}
              onClick={zoomOut}
              size="icon"
              variant="ghost"
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-10 text-center text-white/70 text-xs">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              aria-label="Zoom in"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              disabled={zoom >= MAX_ZOOM}
              onClick={zoomIn}
              size="icon"
              variant="ghost"
            >
              <Plus className="size-4" />
            </Button>
            <div className="mx-1 h-4 w-px bg-white/20" />
            <Button
              aria-label="Rotate"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              onClick={rotate}
              size="icon"
              variant="ghost"
            >
              <RotateCw className="size-4" />
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export type { ImagePreviewProps };
export { ImagePreview };
