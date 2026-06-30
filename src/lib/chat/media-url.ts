import { MessageServiceError } from "@/services/chat/message.service";

const ALLOWED_PREFIXES = ["/api/media/", "/uploads/"];

export function assertAllowedChatMediaUrl(
  url: string | null | undefined,
  field: string,
): void {
  if (!url) return;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    throw new MessageServiceError(`External ${field} URLs are not allowed`, 400, "INVALID_MEDIA");
  }

  if (!ALLOWED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    throw new MessageServiceError(`Invalid ${field} URL`, 400, "INVALID_MEDIA");
  }
}
