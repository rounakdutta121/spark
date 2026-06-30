import { errorResponse, successResponse, validationErrorResponse } from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { deleteMessageSchema, editMessageSchema } from "@/lib/schemas/chat";
import { ChatAccessError } from "@/services/chat/access.service";
import {
  deleteMessage,
  editMessage,
  MessageServiceError,
} from "@/services/chat/message.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = editMessageSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const message = await editMessage(userId, id, parsed.data.text);
    return successResponse({ message });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof MessageServiceError || error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("PATCH message error:", error);
    return errorResponse("Failed to edit message", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = deleteMessageSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    await deleteMessage(userId, id, parsed.data.scope);
    return successResponse({ ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof MessageServiceError || error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("DELETE message error:", error);
    return errorResponse("Failed to delete message", 500);
  }
}
