"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@repo/design-system/components/ui/empty";
import { Input } from "@repo/design-system/components/ui/input";
import { MessageCircle, SendHorizontal, X } from "lucide-react";
import { useAskAi } from "./ask-ai-provider";

export function AskAi() {
  const { open, close } = useAskAi();

  if (!open) {
    return null;
  }

  return (
    <aside className="flex h-svh w-[380px]! shrink-0 flex-col border-l bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">AI Chat</span>
          <span className="text-muted-foreground text-xs">
            Powered by Inkeep AI
          </span>
        </div>
        <Button onClick={close} size="icon-sm" variant="ghost">
          <X />
          <span className="sr-only">Close AI chat</span>
        </Button>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageCircle />
            </EmptyMedia>
            <EmptyDescription>Start a new chat below.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t p-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <Input
          className="flex-1"
          name="question"
          placeholder="Ask a question"
        />
        <Button size="icon-sm" type="submit" variant="ghost">
          <SendHorizontal />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </aside>
  );
}
