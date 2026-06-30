export type MessageType = "TEXT" | "IMAGE" | "AUDIO" | "GIF" | "SYSTEM";

export interface ChatUserPreview {
  id: string;
  name: string;
  photoUrl: string | null;
  isOnline?: boolean;
}

export interface ConversationListItem {
  id: string;
  otherUser: ChatUserPreview;
  lastMessage: MessagePreview | null;
  lastMessageAt: string;
  unreadCount: number;
}

export type ConversationDetail = ConversationListItem;

export interface MessagePreview {
  id: string;
  type: MessageType;
  text: string | null;
  senderId: string;
  isDeleted: boolean;
  createdAt: string;
}

export interface MessageReactionView {
  id: string;
  userId: string;
  emoji: string;
}

export interface ReplyPreview {
  id: string;
  type: MessageType;
  text: string | null;
  senderId: string;
  isDeleted: boolean;
}

export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  replyTo: ReplyPreview | null;
  isEdited: boolean;
  isDeleted: boolean;
  deletedForYou: boolean;
  deliveredAt: string | null;
  seenAt: string | null;
  createdAt: string;
  reactions: MessageReactionView[];
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface GifItem {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
}
