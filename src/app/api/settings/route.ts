import {
  errorResponse,
  successResponse,
  validationErrorResponse,
  clearAuthCookiesOnResponse,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { notificationSettingsSchema } from "@/lib/schemas/moderation.schema";
import {
  deleteAccount,
  updateNotificationSettings,
} from "@/services/account/account.service";

export async function GET() {
  try {
    const userId = await requireUserId();
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    return successResponse({
      settings: settings ?? {
        pushNotifications: true,
        emailNotifications: true,
        profileVisible: true,
        showDistance: true,
        showAge: true,
        isPrivateAccount: false,
        messagePermission: "EVERYONE",
        mentionPermission: "EVERYONE",
        tagPermission: "EVERYONE",
        commentPermission: "EVERYONE",
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to load settings", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = notificationSettingsSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const settings = await updateNotificationSettings(userId, parsed.data);
    return successResponse({ settings });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to update settings", 500);
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    await deleteAccount(userId);
    const response = successResponse({ deleted: true });
    return clearAuthCookiesOnResponse(response);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to delete account", 500);
  }
}
