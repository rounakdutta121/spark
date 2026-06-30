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
import { createAppwritePresign } from "@/lib/upload/appwrite-presign";
import {
  isAppwriteStorage,
  isR2Storage,
  mediaUrlForKey,
} from "@/lib/upload/storage-config";
import { createR2PresignedPutUrl } from "@/lib/upload/r2";
import { storageKeyForPurpose } from "@/lib/upload/storage";

const presignSchema = z.object({
  purpose: z.enum([
    "post-image",
    "post-video",
    "story-image",
    "story-video",
    "chat-image",
    "chat-audio",
    "avatar",
  ]),
  contentType: z.string().min(1),
  fileName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await requireUserId();

    const body = await request.json();
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { purpose, contentType } = parsed.data;

    if (isAppwriteStorage()) {
      const presign = createAppwritePresign();
      return successResponse(presign);
    }

    if (!isR2Storage()) {
      return errorResponse(
        "Direct uploads require STORAGE_PROVIDER=appwrite or r2",
        400,
      );
    }

    const key = storageKeyForPurpose(purpose, contentType);
    const uploadUrl = await createR2PresignedPutUrl(key, contentType);

    return successResponse({
      key,
      uploadUrl,
      mediaUrl: mediaUrlForKey(key),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    console.error("POST presign error:", error);
    return errorResponse("Failed to create upload URL", 500);
  }
}
