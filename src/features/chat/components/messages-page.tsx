"use client";

import { ChatList } from "@/features/chat/components/chat-list";

export function MessagesPage() {
  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Chat with your matches in real time
        </p>
      </div>
      <ChatList />
    </div>
  );
}
