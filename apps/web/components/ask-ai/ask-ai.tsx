"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@repo/design-system/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@repo/design-system/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@repo/design-system/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@repo/design-system/components/ai-elements/reasoning";
import { Suggestion } from "@repo/design-system/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@repo/design-system/components/ai-elements/tool";
import { Button } from "@repo/design-system/components/ui/button";
import { MessageCircle, SparklesIcon, X } from "lucide-react";
import { useState } from "react";

import { useAskAi } from "./ask-ai-provider";
import {
  type ChatMessage,
  DEFAULT_PROMPTS,
  useFakeChat,
} from "./fake-chat";

export function AskAi() {
  const { open, close } = useAskAi();
  const { messages, status, send, reset } = useFakeChat();
  const [input, setInput] = useState("");

  if (!open) {
    return null;
  }

  const isEmpty = messages.length === 0;

  const handleSend = (text: string) => {
    send(text);
    setInput("");
  };

  return (
    <aside className="flex h-svh w-[380px]! shrink-0 flex-col border-l bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">AI Chat</span>
          <span className="text-muted-foreground text-xs">
            Powered by Inkeep AI
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isEmpty ? null : (
            <Button onClick={reset} size="sm" variant="ghost">
              New chat
            </Button>
          )}
          <Button onClick={close} size="icon-sm" variant="ghost">
            <X />
            <span className="sr-only">Close AI chat</span>
          </Button>
        </div>
      </header>

      <Conversation>
        <ConversationContent>
          {isEmpty ? (
            <ConversationEmptyState
              description="Ask about your herd, or pick a starter below."
              icon={<MessageCircle className="size-5" />}
              title="Start a new chat"
            />
          ) : (
            messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t p-3">
        {isEmpty ? (
          <div className="mb-3 flex flex-col gap-2">
            {DEFAULT_PROMPTS.map((prompt) => (
              <Suggestion
                className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                key={prompt}
                onClick={handleSend}
                suggestion={prompt}
              >
                <SparklesIcon className="size-4 shrink-0 text-muted-foreground" />
                {prompt}
              </Suggestion>
            ))}
          </div>
        ) : null}

        <PromptInput
          onSubmit={(message) => handleSend(message.text)}
        >
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Ask a question"
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <span className="px-1 text-muted-foreground text-xs">
                Demo — responses are simulated
              </span>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={status !== "ready" || !input.trim()}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </aside>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent>{message.text}</MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant">
      <MessageContent>
        {message.reasoning ? (
          <Reasoning isStreaming={message.reasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>{message.reasoning}</ReasoningContent>
          </Reasoning>
        ) : null}

        {message.tool ? (
          <Tool>
            <ToolHeader
              state={message.tool.state}
              toolName={message.tool.name}
              type="dynamic-tool"
            />
            <ToolContent>
              <ToolInput input={message.tool.input} />
              {message.tool.output ? (
                <ToolOutput
                  errorText={undefined}
                  output={message.tool.output}
                />
              ) : null}
            </ToolContent>
          </Tool>
        ) : null}

        {message.text ? (
          <MessageResponse>{message.text}</MessageResponse>
        ) : null}
      </MessageContent>
    </Message>
  );
}
