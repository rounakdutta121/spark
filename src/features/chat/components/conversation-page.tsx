"use client";

import { ChatWindow } from "@/features/chat/components/chat-window";

interface ConversationPageProps {
  conversationId: string;
}

export function ConversationPage({ conversationId }: ConversationPageProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background lg:static lg:min-h-[calc(100vh-8rem)]">
      <div className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-3xl lg:rounded-2xl lg:border lg:border-white/10 lg:shadow-sm">
        <ChatWindow conversationId={conversationId} />
      </div>
    </div>
  );
}
