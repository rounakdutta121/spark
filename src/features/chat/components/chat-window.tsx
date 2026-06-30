"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { bumpChatPoll } from "@/lib/chat/poll-events";
import { ROUTES } from "@/lib/constants";
import { groupByDay } from "@/lib/date-format";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProfileTap } from "@/components/profile/profile-tap";
import { DateSeparator } from "@/features/chat/components/date-separator";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import { MessageComposer } from "@/features/chat/components/message-composer";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { InfiniteScrollSentinel } from "@/components/layout/main-shell";
import { useInfiniteCursor } from "@/hooks/use-infinite-cursor";
import {
  sendMessageReceipts,
  sendTypingState,
  useChatLongPoll,
} from "@/hooks/use-chat-long-poll";
import { useAuthContext } from "@/providers/auth-provider";
import {
  deleteMessage,
  editMessage,
  fetchConversation,
  fetchMessages,
  reactToMessage,
  sendTextMessage,
  uploadChatMedia,
} from "@/services/chat/chat.api";
import type { ConversationDetail, MessageView } from "@/types/chat";

interface ChatWindowProps {
  conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user } = useAuthContext();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [replyTo, setReplyTo] = useState<MessageView | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const initialScroll = useRef(true);

  const {
    items: olderMessages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error: messagesError,
  } = useInfiniteCursor<MessageView>({
    fetchPage: async (cursor) =>
      fetchMessages({ conversationId, cursor, limit: 30 }),
    getKey: (m) => m.id,
    enabled: !!conversationId,
  });

  useEffect(() => {
    setUnavailable(false);
    void fetchConversation(conversationId)
      .then((r) => setConversation(r.conversation))
      .catch((err) => {
        if (err instanceof ApiError && err.statusCode === 404) {
          setUnavailable(true);
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Failed to load conversation",
        );
      });
  }, [conversationId]);

  useEffect(() => {
    if (!messagesError) return;
    if (messagesError.includes("not found") || messagesError.includes("Not found")) {
      setUnavailable(true);
    }
  }, [messagesError]);

  useEffect(() => {
    if (!olderMessages.length) return;
    setMessages((prev) => {
      const map = new Map<string, MessageView>();
      for (const m of [...olderMessages, ...prev]) map.set(m.id, m);
      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, [olderMessages]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (initialScroll.current && messages.length > 0) {
      scrollToBottom(false);
      initialScroll.current = false;
    }
  }, [messages.length, scrollToBottom]);

  const upsertMessage = useCallback((msg: MessageView) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === msg.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = msg;
        return next;
      }
      return [...prev, msg].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  const handlePollMessages = useCallback(
    (incoming: MessageView[]) => {
      for (const msg of incoming) {
        upsertMessage(msg);
        if (msg.senderId !== user?.id) {
          void sendMessageReceipts(conversationId, [msg.id], "delivered");
          void sendMessageReceipts(conversationId, [msg.id], "seen");
        }
      }
      if (incoming.length > 0) scrollToBottom();
    },
    [conversationId, scrollToBottom, upsertMessage, user?.id],
  );

  useChatLongPoll({
    conversationId,
    onMessages: handlePollMessages,
    onTyping: setTypingUserIds,
  });

  const grouped = useMemo(() => groupByDay(messages), [messages]);

  const sendOptimistic = async (
    fn: () => Promise<{ message: MessageView }>,
    optimistic: MessageView,
  ) => {
    setSending(true);
    upsertMessage(optimistic);
    scrollToBottom();
    try {
      const { message } = await fn();
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? message : m)),
      );
      bumpChatPoll();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleSendText = (text: string, replyToId?: string) => {
    if (!user) return;
    const clientId = `tmp-${Date.now()}`;
    const optimistic: MessageView = {
      id: clientId,
      conversationId,
      senderId: user.id,
      type: "TEXT",
      text,
      imageUrl: null,
      audioUrl: null,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            type: replyTo.type,
            text: replyTo.text,
            senderId: replyTo.senderId,
            isDeleted: replyTo.isDeleted,
          }
        : null,
      isEdited: false,
      isDeleted: false,
      deletedForYou: false,
      deliveredAt: null,
      seenAt: null,
      createdAt: new Date().toISOString(),
      reactions: [],
    };

    void sendOptimistic(
      () => sendTextMessage({ conversationId, text, replyToId }),
      optimistic,
    );
    setReplyTo(null);
  };

  const handleSendImage = (file: File, replyToId?: string) => {
    if (!user) return;
    void sendOptimistic(
      () => uploadChatMedia({ conversationId, file, type: "IMAGE", replyToId }),
      {
        id: `tmp-img-${Date.now()}`,
        conversationId,
        senderId: user.id,
        type: "IMAGE",
        text: null,
        imageUrl: URL.createObjectURL(file),
        audioUrl: null,
        replyTo: null,
        isEdited: false,
        isDeleted: false,
        deletedForYou: false,
        deliveredAt: null,
        seenAt: null,
        createdAt: new Date().toISOString(),
        reactions: [],
      },
    );
  };

  const handleSendAudio = (file: File, replyToId?: string) => {
    if (!user) return;
    void sendOptimistic(
      () => uploadChatMedia({ conversationId, file, type: "AUDIO", replyToId }),
      {
        id: `tmp-aud-${Date.now()}`,
        conversationId,
        senderId: user.id,
        type: "AUDIO",
        text: null,
        imageUrl: null,
        audioUrl: URL.createObjectURL(file),
        replyTo: null,
        isEdited: false,
        isDeleted: false,
        deletedForYou: false,
        deliveredAt: null,
        seenAt: null,
        createdAt: new Date().toISOString(),
        reactions: [],
      },
    );
  };

  const handleEdit = async () => {
    if (!editingId || !editText.trim()) return;
    try {
      const { message } = await editMessage(editingId, editText.trim());
      upsertMessage(message);
      setEditingId(null);
      setEditText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Edit failed");
    }
  };

  const handleDelete = async (
    message: MessageView,
    scope: "self" | "everyone",
  ) => {
    try {
      await deleteMessage(message.id, scope);
      if (scope === "everyone") {
        upsertMessage({
          ...message,
          isDeleted: true,
          text: null,
          imageUrl: null,
          audioUrl: null,
        });
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleReact = async (message: MessageView, emoji: string) => {
    try {
      const { message: updated } = await reactToMessage(message.id, emoji);
      upsertMessage(updated);
    } catch {
      toast.error("Reaction failed");
    }
  };

  const typingStart = useCallback(() => {
    void sendTypingState(conversationId, true);
  }, [conversationId]);

  const typingStop = useCallback(() => {
    void sendTypingState(conversationId, false);
  }, [conversationId]);

  const isTyping = conversation
    ? typingUserIds.includes(conversation.otherUser.id)
    : false;
  const isOnline = conversation?.otherUser.isOnline ?? false;

  if (unavailable) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Conversation unavailable</p>
        <p className="text-sm text-muted-foreground">
          This person may have deleted their account. Your message history was
          removed.
        </p>
        <Link
          href={ROUTES.messages}
          className="rounded-full bg-[#FF4458] px-5 py-2 text-sm font-medium text-white"
        >
          Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-background px-3 py-3">
        <Link
          href={ROUTES.messages}
          className="rounded-full p-2 hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        {conversation && (
          <ProfileTap userId={conversation.otherUser.id} className="flex min-w-0 flex-1 items-center gap-3">
            <UserAvatar
              name={conversation.otherUser.name}
              photoUrl={conversation.otherUser.photoUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{conversation.otherUser.name}</p>
              <p className="text-xs text-muted-foreground">
                {isTyping ? "typing…" : isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </ProfileTap>
        )}
      </header>

      <div
        ref={listRef}
        className="relative min-h-0 overflow-y-auto overscroll-contain px-3 py-4"
        onScroll={(e) => {
          const el = e.currentTarget;
          const nearBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          setShowScrollBtn(!nearBottom);
          if (el.scrollTop < 80 && hasMore && !isLoadingMore) loadMore();
        }}
      >
        {isLoading && <LoadingSkeleton variant="chat" className="py-4" />}
        <InfiniteScrollSentinel onVisible={loadMore} disabled={!hasMore || isLoadingMore} />

        {grouped.map((group) => (
          <div key={group.label}>
            <DateSeparator label={group.label} />
            <div className="space-y-2">
              {group.items.map((message) =>
                editingId === message.id ? (
                  <div key={message.id} className="flex gap-2 px-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      className="rounded-full bg-[#FF4458] px-3 text-sm text-white"
                      onClick={handleEdit}
                    >
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user?.id}
                    onReply={setReplyTo}
                    onEdit={(m) => {
                      setEditingId(m.id);
                      setEditText(m.text ?? "");
                    }}
                    onDelete={handleDelete}
                    onReact={handleReact}
                  />
                ),
              )}
            </div>
          </div>
        ))}

        {isTyping && <TypingIndicator name={conversation?.otherUser.name} />}
        <div ref={bottomRef} />

        {showScrollBtn && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="sticky bottom-4 left-full z-10 -ml-12 rounded-full bg-background/90 p-2 shadow-lg backdrop-blur"
          >
            <ChevronDown className="size-5" />
          </button>
        )}
      </div>

      <MessageComposer
        disabled={sending}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        onSendAudio={handleSendAudio}
        onTypingStart={typingStart}
        onTypingStop={typingStop}
      />
    </div>
  );
}
