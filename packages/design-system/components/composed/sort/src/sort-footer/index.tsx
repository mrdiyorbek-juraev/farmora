"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { HelpCircle, Plus } from "lucide-react";
import { useState } from "react";
import { SortFieldPicker } from "../field-picker";
import type {
  SortFieldConfig,
  SortFieldsConfig,
  SortI18nConfig,
} from "../types";

interface SortFooterProps {
  allUsed: boolean;
  excludeKeys: Set<string>;
  fields: SortFieldsConfig;
  i18n: SortI18nConfig;
  learnHref?: string;
  onLearnClick?: () => void;
  onPick: (field: SortFieldConfig) => void;
}

// Footer for the populated sort list. Internals are locked at xs density
// regardless of the consumer's trigger size — every popover interaction
// stays tight to the IDE rhythm.
//
// Only renders when there's at least one action to show — when every
// field is already used AND no Learn link is configured, the entire row
// (including its top border) is omitted so the list doesn't end with an
// empty bordered strip.
export function SortFooter({
  allUsed,
  excludeKeys,
  fields,
  i18n,
  learnHref,
  onLearnClick,
  onPick,
}: SortFooterProps) {
  const [addingMore, setAddingMore] = useState(false);
  const showLearn = Boolean(learnHref || onLearnClick);

  if (allUsed && !showLearn) {
    return null;
  }

  const handlePick = (field: SortFieldConfig) => {
    onPick(field);
    setAddingMore(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 border-border/50 border-t p-2">
      {allUsed ? null : (
        <Popover onOpenChange={setAddingMore} open={addingMore}>
          <PopoverTrigger asChild>
            <Button size="xs" variant="ghost">
              <Plus />
              {i18n.addSort}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-fit p-0">
            <SortFieldPicker
              excludeKeys={excludeKeys}
              fields={fields}
              i18n={i18n}
              onPick={handlePick}
            />
          </PopoverContent>
        </Popover>
      )}

      {showLearn ? (
        <Button
          asChild={Boolean(learnHref)}
          className="text-muted-foreground"
          onClick={onLearnClick}
          size="xs"
          variant="ghost"
        >
          {learnHref ? (
            <a href={learnHref} rel="noopener" target="_blank">
              <HelpCircle />
              {i18n.learnAboutSorting}
            </a>
          ) : (
            <span>
              <HelpCircle />
              {i18n.learnAboutSorting}
            </span>
          )}
        </Button>
      ) : null}
    </div>
  );
}
