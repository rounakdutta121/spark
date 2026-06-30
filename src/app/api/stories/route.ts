import { NextRequest } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
  writeAccessErrorResponse,
} from "@/lib/api/require-auth";
import {
  createStory,
  createStoryFromMedia,
  getActiveStories,
  StoryServiceError,
} from "@/services/social/story.service";
import { MessageServiceError } from "@/services/chat/message.service";
import { assertAllowedChatMediaUrl } from "@/lib/chat/media-url";
import { UploadError } from "@/lib/upload/storage";

const createStoryJsonSchema = z.object({
  mediaUrl: z.string().min(1),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  videoTrimmed: z.boolean().optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const stories = await getActiveStories(userId);
    return successResponse({ stories });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return errorResponse("Failed to load stories", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireVerifiedUserId();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsed = createStoryJsonSchema.safeParse(body);
      if (!parsed.success) return validationErrorResponse(parsed.error);

      assertAllowedChatMediaUrl(parsed.data.mediaUrl, "image");
      const { story, videoTrimmed } = await createStoryFromMedia(userId, parsed.data);
      return successResponse({ story, videoTrimmed }, 201);
    }

    const form = await request.formData();
    const file = form.get("media");
    if (!(file instanceof File)) {
      return errorResponse("Media file required", 400);
    }

    const { story, videoTrimmed } = await createStory(userId, file);
    return successResponse({ story, videoTrimmed }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const writeErr = writeAccessErrorResponse(error);
    if (writeErr) return writeErr;
    if (error instanceof UploadError) {
      return errorResponse(error.message, error.statusCode);
    }
    if (error instanceof StoryServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    if (error instanceof MessageServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    return errorResponse("Failed to create story", 500);
  }
}
