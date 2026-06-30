import { apiClient } from "@/lib/api-client";
import {
  shouldUseClientUpload,
  uploadFileToStorage,
} from "@/lib/upload/client-upload";
import type {
  ConversationDetail,
  ConversationListItem,
  CursorPage,
  GifItem,
  MessageView,
} from "@/types/chat";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

export function fetchConversations(params?: {
  cursor?: string;
  limit?: number;
  search?: string;
}) {
  return apiClient<CursorPage<ConversationListItem>>(
    `/api/conversations${buildQuery(params ?? {})}`,
  );
}

export function fetchConversation(id: string) {
  return apiClient<{ conversation: ConversationDetail }>(
    `/api/conversations/${id}`,
  );
}

export function fetchMessages(params: {
  conversationId: string;
  cursor?: string;
  limit?: number;
}) {
  return apiClient<CursorPage<MessageView>>(
    `/api/messages${buildQuery(params)}`,
  );
}

export function sendTextMessage(input: {
  conversationId: string;
  type?: "TEXT" | "GIF";
  text: string;
  replyToId?: string;
}) {
  return apiClient<{ message: MessageView }>("/api/messages", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function uploadChatMedia(input: {
  conversationId: string;
  file: File;
  type: "IMAGE" | "AUDIO";
  replyToId?: string;
}) {
  const upload = async () => {
    if (shouldUseClientUpload(input.file)) {
      const purpose = input.type === "AUDIO" ? "chat-audio" : "chat-image";
      const mediaUrl = await uploadFileToStorage(input.file, purpose);
      return apiClient<{ message: MessageView }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversationId: input.conversationId,
          type: input.type,
          imageUrl: input.type === "IMAGE" ? mediaUrl : undefined,
          audioUrl: input.type === "AUDIO" ? mediaUrl : undefined,
          replyToId: input.replyToId,
        }),
      });
    }

    const form = new FormData();
    form.set("conversationId", input.conversationId);
    form.set("type", input.type);
    form.set("file", input.file);
    if (input.replyToId) form.set("replyToId", input.replyToId);

    const response = await fetch("/api/messages", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? "Upload failed");
    }
    return data.data as { message: MessageView };
  };

  return upload();
}

export function editMessage(id: string, text: string) {
  return apiClient<{ message: MessageView }>(`/api/messages/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ text }),
  });
}

export function deleteMessage(id: string, scope: "self" | "everyone") {
  return apiClient<{ ok: boolean }>(`/api/messages/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ scope }),
  });
}

export function reactToMessage(messageId: string, emoji: string) {
  return apiClient<{ message: MessageView }>("/api/messages/reaction", {
    method: "POST",
    body: JSON.stringify({ messageId, emoji }),
  });
}

export function searchGifs(query?: string) {
  return apiClient<{ gifs: GifItem[] }>(
    `/api/gifs/search${buildQuery({ q: query })}`,
  );
}
