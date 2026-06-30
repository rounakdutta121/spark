import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  authErrorResponse,
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import { messageQuerySchema, sendMessageSchema } from "@/lib/schemas/chat";
import { saveAudioFile, saveChatImage, UploadError } from "@/lib/upload/storage";
import { ChatAccessError } from "@/services/chat/access.service";
import {
  listMessages,
  MessageServiceError,
  sendMessage,
} from "@/services/chat/message.service";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireVerifiedUserId();
    const conversationId = request.nextUrl.searchParams.get("conversationId");

    if (!conversationId) {
      return errorResponse("conversationId is required", 400, "VALIDATION");
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = messageQuerySchema.safeParse(params);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const result = await listMessages(userId, conversationId, parsed.data);
    return successResponse(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const access = authErrorResponse(error);
    if (access) return access;
    if (error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("GET messages error:", error);
    return errorResponse("Failed to fetch messages", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireVerifiedUserId();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const conversationId = String(form.get("conversationId") ?? "");
      const type = String(form.get("type") ?? "IMAGE");
      const replyToId = form.get("replyToId");
      const file = form.get("file");

      if (!conversationId || !(file instanceof File)) {
        return errorResponse("Invalid upload", 400, "VALIDATION");
      }

      const imageUrl =
        type === "AUDIO"
          ? await saveAudioFile(file)
          : await saveChatImage(file);

      const message = await sendMessage(userId, {
        conversationId,
        type: type === "AUDIO" ? "AUDIO" : "IMAGE",
        imageUrl: type === "AUDIO" ? undefined : imageUrl,
        audioUrl: type === "AUDIO" ? imageUrl : undefined,
        replyToId: replyToId ? String(replyToId) : undefined,
      });

      return successResponse({ message }, 201);
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const message = await sendMessage(userId, parsed.data);
    return successResponse({ message }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const access = authErrorResponse(error);
    if (access) return access;
    if (error instanceof UploadError) {
      return errorResponse(error.message, error.statusCode);
    }
    if (error instanceof MessageServiceError || error instanceof ChatAccessError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    console.error("POST messages error:", error);
    return errorResponse("Failed to send message", 500);
  }
}
