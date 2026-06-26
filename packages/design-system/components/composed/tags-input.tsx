"use client";

import { cn } from "@repo/design-system/lib/utils";
import { X } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useId,
  useRef,
  useState,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────

interface TagsInputProps {
  /** Whether duplicates are allowed */
  allowDuplicates?: boolean;
  className?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Max number of tags allowed (0 = unlimited) */
  max?: number;
  /** Called when tags change (add/remove) */
  onValueChange: (tags: string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Custom validation — return false to reject a tag */
  validate?: (tag: string) => boolean;
  /** Controlled list of tag strings */
  value: string[];
}

// ─── TagsInput ──────────────────────────────────────────────────────

function TagsInput({
  allowDuplicates = false,
  className,
  disabled = false,
  max = 0,
  onValueChange,
  placeholder = "Add tag...",
  validate,
  value,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [focusedTagIndex, setFocusedTagIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const tagRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const id = useId();

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag) {
        return;
      }
      if (max > 0 && value.length >= max) {
        return;
      }
      if (!allowDuplicates && value.includes(tag)) {
        return;
      }
      if (validate && !validate(tag)) {
        return;
      }
      onValueChange([...value, tag]);
      setInputValue("");
      setFocusedTagIndex(-1);
    },
    [value, onValueChange, max, allowDuplicates, validate]
  );

  const removeTag = useCallback(
    (index: number) => {
      if (disabled) {
        return;
      }
      const next = value.filter((_, i) => i !== index);
      onValueChange(next);

      // Focus the previous tag, or the input if no tags left
      if (next.length === 0) {
        setFocusedTagIndex(-1);
        inputRef.current?.focus();
      } else {
        const newIndex = Math.min(index, next.length - 1);
        setFocusedTagIndex(newIndex);
        requestAnimationFrame(() => {
          tagRefs.current.get(newIndex)?.focus();
        });
      }
    },
    [value, onValueChange, disabled]
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputValue);
        return;
      }
      if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        e.preventDefault();
        const lastIndex = value.length - 1;
        setFocusedTagIndex(lastIndex);
        tagRefs.current.get(lastIndex)?.focus();
        return;
      }
      if (e.key === "ArrowLeft" && inputValue === "" && value.length > 0) {
        e.preventDefault();
        const lastIndex = value.length - 1;
        setFocusedTagIndex(lastIndex);
        tagRefs.current.get(lastIndex)?.focus();
      }
    },
    [inputValue, addTag, value.length]
  );

  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>, index: number) => {
      switch (e.key) {
        case "ArrowLeft": {
          e.preventDefault();
          if (index > 0) {
            setFocusedTagIndex(index - 1);
            tagRefs.current.get(index - 1)?.focus();
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (index < value.length - 1) {
            setFocusedTagIndex(index + 1);
            tagRefs.current.get(index + 1)?.focus();
          } else {
            setFocusedTagIndex(-1);
            inputRef.current?.focus();
          }
          break;
        }
        case "Backspace":
        case "Delete": {
          e.preventDefault();
          removeTag(index);
          break;
        }
        case "Home": {
          e.preventDefault();
          if (value.length > 0) {
            setFocusedTagIndex(0);
            tagRefs.current.get(0)?.focus();
          }
          break;
        }
        case "End": {
          e.preventDefault();
          setFocusedTagIndex(-1);
          inputRef.current?.focus();
          break;
        }
        default:
          break;
      }
    },
    [value.length, removeTag]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text/plain");
      if (text.includes(",")) {
        e.preventDefault();
        const tags = text
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        const newTags = [...value];
        for (const tag of tags) {
          if (max > 0 && newTags.length >= max) {
            break;
          }
          if (!allowDuplicates && newTags.includes(tag)) {
            continue;
          }
          if (validate && !validate(tag)) {
            continue;
          }
          newTags.push(tag);
        }
        onValueChange(newTags);
        setInputValue("");
      }
    },
    [value, onValueChange, max, allowDuplicates, validate]
  );

  const setTagRef = useCallback((index: number, el: HTMLSpanElement | null) => {
    if (el) {
      tagRefs.current.set(index, el);
    } else {
      tagRefs.current.delete(index);
    }
  }, []);

  return (
    <fieldset
      className={cn(
        "flex max-h-[120px] min-h-8 w-full flex-wrap content-center items-center gap-1 overflow-y-auto rounded-lg border border-input bg-transparent px-2.5 py-1 pt-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-input/30",
        className
      )}
      data-slot="tags-input"
      disabled={disabled}
    >
      {value.map((tag, index) => (
        <span
          aria-selected={focusedTagIndex === index}
          className={cn(
            "inline-flex max-w-full items-center gap-0.5 overflow-hidden rounded-md border bg-secondary/50 px-1.5 py-px text-xs leading-tight outline-none transition-colors",
            focusedTagIndex === index && "ring-1 ring-ring",
            disabled && "opacity-50"
          )}
          data-slot="tags-input-tag"
          key={`${id}-${tag}`}
          onKeyDown={(e) => handleTagKeyDown(e, index)}
          ref={(el) => setTagRef(index, el)}
          role="option"
          tabIndex={focusedTagIndex === index ? 0 : -1}
        >
          <div className="grid">
            <span className="truncate">{tag}</span>
          </div>
          {disabled ? null : (
            <button
              aria-label={`Remove ${tag}`}
              className="shrink-0 rounded-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              tabIndex={-1}
              type="button"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      <input
        aria-label={placeholder}
        className="min-w-0 flex-1 basis-[80px] bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
        disabled={disabled}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setFocusedTagIndex(-1)}
        onKeyDown={handleInputKeyDown}
        onPaste={handlePaste}
        placeholder={value.length === 0 ? placeholder : ""}
        ref={inputRef}
        type="text"
        value={inputValue}
      />
    </fieldset>
  );
}

export { TagsInput, type TagsInputProps };
