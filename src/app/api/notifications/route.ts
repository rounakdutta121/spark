import { z } from "zod";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import {
  listNotifications,
  markNotificationsRead,
  getUnreadNotificationCount,
} from "@/services/social/notification-list.service";

const markSchema = z.object({
  ids: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("countOnly") === "1") {
      const unreadCount = await getUnreadNotificationCount(userId);
      return successResponse({ unreadCount });
    }

    const cursor = searchParams.get("cursor") ?? undefined;
    const result = await listNotifications(userId, cursor);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to load notifications", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = markSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    await markNotificationsRead(userId, parsed.data.ids);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to update notifications", 500);
  }
}
