"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ConversationCard } from "@/features/chat/components/conversation-card";
import {
  InfiniteScrollSentinel,
  useDebouncedValue,
} from "@/components/layout/main-shell";
import { useInfiniteCursor } from "@/hooks/use-infinite-cursor";
import { fetchConversations } from "@/services/chat/chat.api";
import { useAuthContext } from "@/providers/auth-provider";
import type { ConversationListItem } from "@/types/chat";

function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-[76px] animate-pulse rounded-2xl bg-muted/40"
        />
      ))}
    </div>
  );
}

export function ChatList() {
  const { user } = useAuthContext();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  } = useInfiniteCursor<ConversationListItem>({
    fetchPage: async (cursor) => {
      const result = await fetchConversations({
        cursor,
        limit: 20,
        search: debouncedSearch || undefined,
      });
      return result;
    },
    getKey: (c) => c.id,
    reloadKey: debouncedSearch,
  });

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search conversations…"
          className="w-full rounded-2xl border border-white/10 bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#FF4458]/40"
        />
      </div>

      {error && (
        <p className="text-center text-sm text-destructive">
          {error}
          <button type="button" className="ml-2 underline" onClick={() => refresh()}>
            Retry
          </button>
        </p>
      )}

      {isLoading ? (
        <ChatListSkeleton />
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No conversations yet. Follow someone and send a message to get started!
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              viewerId={user?.id}
              isOnline={conversation.otherUser.isOnline ?? false}
            />
          ))}
          <InfiniteScrollSentinel
            onVisible={loadMore}
            disabled={!hasMore || isLoadingMore}
          />
        </div>
      )}
    </div>
  );
}
