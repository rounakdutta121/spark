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
import { isAppwriteStorage, mediaUrlForKey } from "@/lib/upload/storage-config";
import { uploadFileToAppwrite } from "@/lib/upload/appwrite";
import { UploadError } from "@/lib/upload/storage";
import {
  validateUploadForPurpose,
  type UploadPurpose,
} from "@/lib/upload/validate-upload";

const uploadSchema = z.object({
  purpose: z.enum([
    "post-image",
    "post-video",
    "story-image",
    "story-video",
    "chat-image",
    "chat-audio",
    "avatar",
  ]),
});

/** Small files only — large uploads should use presign + direct Appwrite/R2. */
const VERCEL_SAFE_MAX_BYTES = 4 * 1024 * 1024;

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    await requireUserId();

    if (!isAppwriteStorage()) {
      return errorResponse(
        "Direct file uploads are only available when STORAGE_PROVIDER=appwrite",
        400,
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    const purpose = form.get("purpose");

    const parsed = uploadSchema.safeParse({ purpose });
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }
    if (!(file instanceof File)) {
      return errorResponse("File is required", 400);
    }

    validateUploadForPurpose(file, parsed.data.purpose as UploadPurpose);

    if (file.size > VERCEL_SAFE_MAX_BYTES) {
      return errorResponse(
        "File too large for server upload. Use direct upload (presign) for files over 4MB.",
        413,
        "USE_PRESIGN",
      );
    }

    const key = await uploadFileToAppwrite(file);
    return successResponse({
      key,
      mediaUrl: mediaUrlForKey(key),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof UploadError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("POST upload/file error:", error);
    return errorResponse("Failed to upload file", 500);
  }
}
