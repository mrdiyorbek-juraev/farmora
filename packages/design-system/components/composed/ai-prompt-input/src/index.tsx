"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/design-system/components/ui/input-group";
import { Kbd } from "@repo/design-system/components/ui/kbd";
import { Spinner } from "@repo/design-system/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { Sparkles, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

export interface AIPromptInputProps<T> {
  // Autofocus on mount. Defaults to true.
  autoFocus?: boolean;
  // Outer wrapper className escape hatch.
  className?: string;
  // Icon shown in the leading addon. Defaults to Sparkles.
  leadingIcon?: ReactNode;
  // Called when the user dismisses (Esc) or after a successful onResult.
  onClose: () => void;
  // Fires with whatever onSubmit resolved to. The component closes itself
  // immediately afterwards (consumer's onClose is then called).
  onResult: (result: T) => void;
  // Called when the user submits a non-empty prompt. The promise it returns
  // is awaited and forwarded to `onResult`. The consumer owns the actual
  // network call / mock — this component only manages prompt state, focus,
  // loading, and dismissal.
  onSubmit: (prompt: string) => Promise<T>;

  // Prompt placeholder. Defaults to a generic "Ask AI…".
  placeholder?: string;
  // `overlay` (default): position absolutely so the component takes over its
  // parent row, masking what's behind. The parent must be `position: relative`.
  // `inline`: sit in normal flow.
  variant?: "overlay" | "inline";
}

// Generic AI prompt input: leading icon + text field + trailing spinner while
// the submit promise is in flight. Enter submits, Esc dismisses. Designed to
// overlay another row (default) or sit inline (variant="inline").
//
// The consumer owns the data layer — pass an `onSubmit(prompt)` that returns
// whatever your AI/backend produces, and an `onResult(value)` to handle it.
export function AIPromptInput<T>({
  onSubmit,
  onResult,
  onClose,
  placeholder = "Ask AI…",
  leadingIcon,
  variant = "overlay",
  autoFocus = true,
  className,
}: AIPromptInputProps<T>) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const submit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await onSubmit(trimmed);
      onResult(result);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center bg-background",
        variant === "overlay" && "absolute inset-0 z-10",
        className
      )}
    >
      <InputGroup
        // The base InputGroup adds a focus ring/border via
        // `has-[…:focus-visible]:` modifiers. This overlay variant sits
        // flush in another row's chrome, so we suppress the ring and
        // keep the border off in every state. The `!` qualifiers are
        // required to beat the `has-` selector specificity.
        className="h-7 rounded-none border-0! bg-transparent! ring-0! hover:bg-transparent! has-[[data-slot=input-group-control]:focus-visible]:border-0! has-[[data-slot=input-group-control]:focus-visible]:ring-0!"
      >
        <InputGroupAddon className="size-7! justify-center pl-3.5">
          {leadingIcon ?? <Sparkles className="size-3.5!" />}
        </InputGroupAddon>
        <InputGroupInput
          className="bg-transparent!"
          disabled={isLoading}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder={placeholder}
          ref={inputRef}
          value={prompt}
        />
        {isLoading ? (
          <InputGroupAddon align="inline-end">
            <Spinner />
          </InputGroupAddon>
        ) : (
          <InputGroupAddon align="inline-end" className="pr-3.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Close AI prompt"
                  className="size-6"
                  onClick={onClose}
                  size="icon"
                  variant="ghost"
                >
                  <X className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="flex items-center gap-1.5"
                side="bottom"
              >
                <span>Close</span>
                <Kbd>Esc</Kbd>
              </TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        )}
      </InputGroup>
    </div>
  );
}
