import { NextRequest } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  successResponse,
} from "@/lib/api/response";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import {
  addPhoto,
  deletePhoto,
  ProfileServiceError,
} from "@/services/profile/profile.service";
import { deletePhotoSchema } from "@/schemas/profile/profile.schema";
import { keyFromMediaUrl } from "@/lib/upload/storage-config";
import { saveUploadedImage, UploadError } from "@/lib/upload/storage";

const addPhotoJsonSchema = z.object({
  url: z.string().min(1),
  isPrimary: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const parsed = addPhotoJsonSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse("Invalid request", 400);
      }
      if (!keyFromMediaUrl(parsed.data.url)) {
        return errorResponse("Invalid photo URL", 400);
      }
      const profile = await addPhoto(userId, parsed.data.url, parsed.data.isPrimary ?? false);
      return successResponse({ profile }, 201);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("No file provided", 400);
    }

    const isPrimary = formData.get("isPrimary") === "true";
    const url = await saveUploadedImage(file);
    const profile = await addPhoto(userId, url, isPrimary);

    return successResponse({ profile }, 201);
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof UploadError || error instanceof ProfileServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("POST photo error:", error);
    return errorResponse("Failed to upload photo", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();
    const parsed = deletePhotoSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ?? "Invalid request",
        400,
      );
    }

    const profile = await deletePhoto(userId, parsed.data.photoId);
    return successResponse({ profile });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    if (error instanceof ProfileServiceError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error("DELETE photo error:", error);
    return errorResponse("Failed to delete photo", 500);
  }
}
