"use client";

import { useCallback, useEffect, useRef } from "react";
import { CHAT } from "@/lib/constants";
import { CHAT_POLL_BUMP_EVENT } from "@/lib/chat/poll-events";
import { apiClient } from "@/lib/api-client";
import type { MessageView } from "@/types/chat";

interface PollResponse {
  messages: MessageView[];
  typingUserIds: string[];
  serverTime: string;
}

interface UseChatLongPollOptions {
  conversationId: string;
  enabled?: boolean;
  onMessages: (messages: MessageView[]) => void;
  onTyping: (userIds: string[]) => void;
}

function pollTimeoutMs(): number {
  if (typeof document === "undefined") return CHAT.pollActiveTimeoutMs;
  return document.visibilityState === "visible"
    ? CHAT.pollActiveTimeoutMs
    : CHAT.pollBackgroundTimeoutMs;
}

export function useChatLongPoll({
  conversationId,
  enabled = true,
  onMessages,
  onTyping,
}: UseChatLongPollOptions) {
  const sinceRef = useRef<string>(new Date(0).toISOString());
  const abortRef = useRef<AbortController | null>(null);
  const bumpRef = useRef(0);
  const onMessagesRef = useRef(onMessages);
  const onTypingRef = useRef(onTyping);

  onMessagesRef.current = onMessages;
  onTypingRef.current = onTyping;

  const runPoll = useCallback(async () => {
    if (!enabled || !conversationId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const bumpAtStart = bumpRef.current;

    try {
      const params = new URLSearchParams({
        conversationId,
        since: sinceRef.current,
        timeoutMs: String(pollTimeoutMs()),
      });

      const result = await apiClient<PollResponse>(
        `/api/chat/poll?${params.toString()}`,
        { signal: controller.signal },
      );

      if (result.serverTime) {
        sinceRef.current = result.serverTime;
      }

      if (result.messages.length > 0) {
        onMessagesRef.current(result.messages);
      }
      onTypingRef.current(result.typingUserIds);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }

    if (
      !controller.signal.aborted &&
      enabled &&
      bumpRef.current === bumpAtStart
    ) {
      window.setTimeout(() => {
        void runPoll();
      }, 0);
    }
  }, [conversationId, enabled]);

  const schedulePoll = useCallback(() => {
    bumpRef.current += 1;
    abortRef.current?.abort();
    void runPoll();
  }, [runPoll]);

  useEffect(() => {
    sinceRef.current = new Date(0).toISOString();
    if (!enabled) return;

    void runPoll();

    const onBump = () => schedulePoll();
    const onVisible = () => {
      if (document.visibilityState === "visible") schedulePoll();
    };

    window.addEventListener(CHAT_POLL_BUMP_EVENT, onBump);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      abortRef.current?.abort();
      window.removeEventListener(CHAT_POLL_BUMP_EVENT, onBump);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [conversationId, enabled, runPoll, schedulePoll]);

  return { bumpPoll: schedulePoll };
}

export async function sendTypingState(
  conversationId: string,
  isTyping: boolean,
): Promise<void> {
  await apiClient("/api/chat/typing", {
    method: "POST",
    body: JSON.stringify({ conversationId, isTyping }),
  });
}

export async function sendMessageReceipts(
  conversationId: string,
  messageIds: string[],
  type: "delivered" | "seen",
): Promise<void> {
  if (messageIds.length === 0) return;
  await apiClient("/api/messages/receipts", {
    method: "POST",
    body: JSON.stringify({ conversationId, messageIds, type }),
  });
}
