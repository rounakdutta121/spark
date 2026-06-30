import type { NotificationType } from "@prisma/client";
import type { SocialUserPreview } from "@/types/social";

export function buildNotificationSummary(
  type: NotificationType | string,
  actor: SocialUserPreview | null,
  body: string | null,
): string {
  const name = actor?.name ?? "Someone";

  switch (type) {
    case "LIKE":
      return `${name} liked your post`;
    case "COMMENT":
      return body ? `${name} commented: ${body}` : `${name} commented on your post`;
    case "REPLY":
      return body ? `${name} replied: ${body}` : `${name} replied to your comment`;
    case "FOLLOW":
      return `${name} started following you`;
    case "FOLLOW_REQUEST":
      return `${name} requested to follow you`;
    case "STORY":
      return `${name} added a new story`;
    case "STORY_COMMENT":
      return body ? `${name} commented on your story: ${body}` : `${name} commented on your story`;
    case "STORY_REACTION":
      return body ? `${name} reacted ${body} to your story` : `${name} reacted to your story`;
    case "MESSAGE":
      return body ? `${name}: ${body}` : `${name} sent you a message`;
    case "MENTION":
      return `${name} mentioned you`;
    default:
      return body ?? "New notification";
  }
}

export function notificationLink(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  if (typeof data.conversationId === "string") {
    return `/conversations/${data.conversationId}`;
  }
  if (typeof data.storyId === "string") {
    return "/feed";
  }
  if (typeof data.postId === "string") {
    return "/feed";
  }
  if (typeof data.userId === "string") {
    return `/u/${data.userId}`;
  }
  return null;
}
