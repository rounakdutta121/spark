"use client";

import { ChatList } from "@/features/chat/components/chat-list";
import { PageHeading } from "@/components/layout/page-heading";

export function MessagesPage() {
  return (
    <div className="space-y-2">
      <PageHeading
        title="Messages"
        subtitle="Chat with people you follow in real time"
        className="space-y-1"
      />
      <ChatList />
    </div>
  );
}
