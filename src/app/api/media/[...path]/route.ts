import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  requireUserId,
  unauthorizedResponse,
  UnauthorizedError,
} from "@/lib/api/require-auth";
import {
  getAppwriteFileView,
  isAppwriteFileKey,
} from "@/lib/upload/appwrite";
import { isAppwriteStorage, isR2Storage } from "@/lib/upload/storage-config";
import { getR2SignedGetUrl } from "@/lib/upload/r2";
import { resolveExistingUploadFile } from "@/lib/upload/storage";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
};

function contentTypeFor(relativePath: string, ext: string): string {
  if (ext === ".webm") {
    return relativePath.startsWith("audio/") ? "audio/webm" : "video/webm";
  }
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireUserId();
    const { path: segments } = await context.params;
    const relativePath = segments.join("/");

    if (isAppwriteStorage() && isAppwriteFileKey(relativePath)) {
      const { buffer, mimeType } = await getAppwriteFileView(relativePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (isR2Storage()) {
      const signedUrl = await getR2SignedGetUrl(relativePath);
      return NextResponse.redirect(signedUrl, {
        headers: { "Cache-Control": "private, max-age=3600" },
      });
    }

    const filepath = await resolveExistingUploadFile(relativePath);
    const buffer = await readFile(filepath);
    const ext = path.extname(filepath).toLowerCase();
    const contentType = contentTypeFor(relativePath, ext);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) return unauthorizedResponse();
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
}
