"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Mirrors the `ai` package's ChatStatus so <PromptInputSubmit /> can
// drive its spinner/stop affordance without pulling the dep in here.
export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

// The assistant turn moves through these phases so the UI can show a
// thinking state, then a tool-running state, then the streamed answer.
export type AssistantPhase = "thinking" | "tooling" | "responding" | "done";

// Subset of the AI Elements tool states we actually drive.
export type ToolState = "input-available" | "output-available";

export type AssistantTool = {
  name: string;
  state: ToolState;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
};

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      phase: AssistantPhase;
      reasoning: string;
      reasoningStreaming: boolean;
      tool: AssistantTool | null;
      text: string;
    };

type Script = {
  reasoning: string;
  tool: { name: string; input: Record<string, unknown> };
  output: Record<string, unknown>;
  answer: string;
};

// The three starter prompts surfaced above the composer.
export const DEFAULT_PROMPTS = [
  "How many animals need attention today?",
  "Show my herd's age distribution",
  "Which animals should I consider for culling?",
] as const;

const SCRIPTS: Record<string, Script> = {
  [DEFAULT_PROMPTS[0]]: {
    reasoning:
      "The user wants today's urgent items. I'll pull the live herd metrics and focus on animals flagged sick or due for a vet check, then weigh them against the active herd to gauge urgency.",
    tool: {
      name: "query_herd_metrics",
      input: { metric: "needs_attention", window: "today" },
    },
    output: {
      sick: 2,
      active: 8,
      flagged: ["Bessie #014", "Daisy #027"],
    },
    answer:
      "**2 animals need attention today.**\n\n- **Bessie (#014)** — marked *sick* 2 days ago, due for a follow-up.\n- **Daisy (#027)** — flagged *sick* this morning.\n\nThat's 2 of your 8 active animals (25%). I'd see Daisy first since the flag is fresh. Want me to draft a vet check-in note?",
  },
  [DEFAULT_PROMPTS[1]]: {
    reasoning:
      "I'll read the age-bucket breakdown derived from each animal's date of birth and summarise where the herd sits for breeding and culling planning.",
    tool: {
      name: "query_age_distribution",
      input: { group_by: "age_bucket" },
    },
    output: { calf: 1, young: 2, adult: 5, mature: 2 },
    answer:
      "Here's how your **10 animals** break down by age:\n\n| Stage | Count | Range |\n| --- | --- | --- |\n| Calf | 1 | < 6 mo |\n| Young | 2 | 6 mo – 1 yr |\n| Adult | 5 | 1 – 5 yr |\n| Mature | 2 | 5+ yr |\n\nYour herd skews **adult** — a healthy breeding core. The 2 mature animals are the ones to watch for culling decisions over the coming season.",
  },
  [DEFAULT_PROMPTS[2]]: {
    reasoning:
      "Culling is a per-animal call. I'll combine age, status, and recent health flags to surface candidates, while being clear this is a suggestion to review, not a decision.",
    tool: {
      name: "rank_cull_candidates",
      input: { signals: ["age", "health", "status"] },
    },
    output: {
      candidates: [
        { tag: "#003", reason: "6.5 yr, mature" },
        { tag: "#019", reason: "repeat sick flags" },
      ],
    },
    answer:
      "Based on age and health signals, **2 candidates** stand out:\n\n1. **#003** — 6.5 yrs (mature), past peak breeding age.\n2. **#019** — two *sick* flags in the last quarter.\n\nThis is a starting point, not a verdict — pair it with production and calving history before you decide. Want a printable shortlist?",
  },
};

const FALLBACK: Script = {
  reasoning:
    "I'll interpret the question against the current herd records and pull the most relevant metric to give a grounded answer.",
  tool: { name: "search_herd_records", input: { query: "" } },
  output: { matched_records: 10 },
  answer:
    "I'm a demo assistant wired to your herd dashboard. In the full version I'd answer this straight from your live cattle records. For now, try one of the suggested questions to see how a grounded response comes together.",
};

function scriptFor(text: string): Script {
  const direct = SCRIPTS[text];
  if (direct) {
    return direct;
  }
  return { ...FALLBACK, tool: { ...FALLBACK.tool, input: { query: text } } };
}

// Pacing for the simulated turn (ms).
const THINK_MS = 1100;
const TOOL_MS = 1200;
const WORD_MS = 45;

export function useFakeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const counter = useRef(0);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  }, []);

  // Stop any in-flight simulation when the panel unmounts.
  useEffect(() => clearTimers, [clearTimers]);

  const patchAssistant = useCallback(
    (id: string, patch: Partial<Extract<ChatMessage, { role: "assistant" }>>) =>
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id && message.role === "assistant"
            ? { ...message, ...patch }
            : message
        )
      ),
    []
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || status !== "ready") {
        return;
      }

      clearTimers();
      const script = scriptFor(text);
      counter.current += 1;
      const userId = `u-${counter.current}`;
      counter.current += 1;
      const aiId = `a-${counter.current}`;

      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", text },
        {
          id: aiId,
          role: "assistant",
          phase: "thinking",
          reasoning: script.reasoning,
          reasoningStreaming: true,
          tool: null,
          text: "",
        },
      ]);
      setStatus("submitted");

      // Phase 1 → 2: stop "thinking", start the tool running.
      timers.current.push(
        setTimeout(() => {
          patchAssistant(aiId, {
            phase: "tooling",
            reasoningStreaming: false,
            tool: {
              name: script.tool.name,
              state: "input-available",
              input: script.tool.input,
              output: null,
            },
          });
        }, THINK_MS)
      );

      // Phase 2 → 3: tool completes, stream the answer word by word.
      timers.current.push(
        setTimeout(() => {
          patchAssistant(aiId, {
            phase: "responding",
            tool: {
              name: script.tool.name,
              state: "output-available",
              input: script.tool.input,
              output: script.output,
            },
          });
          setStatus("streaming");

          const words = script.answer.split(" ");
          let index = 0;
          const step = () => {
            index += 1;
            patchAssistant(aiId, { text: words.slice(0, index).join(" ") });
            if (index < words.length) {
              timers.current.push(setTimeout(step, WORD_MS));
            } else {
              patchAssistant(aiId, { phase: "done" });
              setStatus("ready");
            }
          };
          step();
        }, THINK_MS + TOOL_MS)
      );
    },
    [status, clearTimers, patchAssistant]
  );

  const reset = useCallback(() => {
    clearTimers();
    setMessages([]);
    setStatus("ready");
  }, [clearTimers]);

  return { messages, status, send, reset };
}
