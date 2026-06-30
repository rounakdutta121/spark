import { NextRequest } from "next/server";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import {
  requireVerifiedUserId,
  unauthorizedResponse,
  UnauthorizedError,
  writeAccessErrorResponse,
} from "@/lib/api/require-auth";
import {
  createPostJsonSchema,
  createPostSchema,
} from "@/schemas/social/post.schema";
import {
  createPost,
  createPostWithMedia,
  PostServiceError,
} from "@/services/social/post.service";
import { UploadError } from "@/lib/upload/storage";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireVerifiedUserId();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsed = createPostJsonSchema.safeParse(body);
      if (!parsed.success) return validationErrorResponse(parsed.error);

      const { media, ...input } = parsed.data;
      const post = await createPostWithMedia(
        userId,
        input,
        media.map((m, order) => ({ ...m, order })),
      );
      return successResponse({ post }, 201);
    }

    const form = await request.formData();
    const caption = form.get("caption")?.toString();
    const location = form.get("location")?.toString();
    const visibility = form.get("visibility")?.toString();
    const status = form.get("status")?.toString();
    const files = form.getAll("media").filter((f): f is File => f instanceof File);

    const parsed = createPostSchema.safeParse({
      caption,
      location,
      visibility,
      status,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error);
    if (files.length === 0) {
      return errorResponse("At least one photo or video is required", 400);
    }

    const post = await createPost(userId, parsed.data, files);
    return successResponse({ post }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    const writeErr = writeAccessErrorResponse(error);
    if (writeErr) return writeErr;
    if (error instanceof PostServiceError) {
      return errorResponse(error.message, error.statusCode, error.code);
    }
    if (error instanceof UploadError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("POST post error:", error);
    return errorResponse("Failed to create post", 500);
  }
}
