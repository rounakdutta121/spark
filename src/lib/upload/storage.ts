import { access } from "fs/promises";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { UPLOAD } from "@/lib/constants";
import { STORY_MAX_VIDEO_SECONDS } from "@/lib/social/story-constants";
import { prepareStoryVideo, VideoProcessingError } from "@/lib/upload/video-trim";
import { logger } from "@/lib/logger";
import {
  isAppwriteStorage,
  isR2Storage,
  keyFromMediaUrl,
  mediaUrlForKey,
} from "@/lib/upload/storage-config";
import { deleteFromAppwrite, uploadToAppwrite } from "@/lib/upload/appwrite";
import { deleteFromR2, uploadToR2 } from "@/lib/upload/r2";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const LEGACY_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export class UploadError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

function mediaUrlFor(relativePath: string): string {
  return mediaUrlForKey(relativePath);
}

function isPathInsideRoot(filePath: string, root: string): boolean {
  const resolved = path.resolve(filePath);
  const resolvedRoot = path.resolve(root);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

export async function resolveExistingUploadFile(relativePath: string): Promise<string> {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new UploadError("Invalid path", 400);
  }

  const candidates = [
    path.join(UPLOAD_DIR, normalized),
    path.join(LEGACY_UPLOAD_DIR, normalized),
  ];

  for (const candidate of candidates) {
    if (!isPathInsideRoot(candidate, UPLOAD_DIR) && !isPathInsideRoot(candidate, LEGACY_UPLOAD_DIR)) {
      continue;
    }
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try next location
    }
  }

  throw new UploadError("Not found", 404);
}

export function validateImageFile(file: File): void {
  if (!UPLOAD.allowedImageTypes.includes(file.type as (typeof UPLOAD.allowedImageTypes)[number])) {
    throw new UploadError(
      "Invalid file type. Allowed: jpg, jpeg, png, webp",
      400,
    );
  }

  if (file.size > UPLOAD.maxFileSize) {
    throw new UploadError("File size exceeds 5MB limit", 400);
  }
}

export function validateVideoFile(file: File): void {
  if (!UPLOAD.allowedVideoTypes.includes(file.type as (typeof UPLOAD.allowedVideoTypes)[number])) {
    throw new UploadError(
      "Invalid video type. Allowed: mp4, webm, mov",
      400,
    );
  }

  if (file.size > UPLOAD.maxVideoSize) {
    throw new UploadError("Video file exceeds 50MB limit", 400);
  }
}

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

async function saveBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (isAppwriteStorage()) {
    const filename = key.split("/").pop() ?? "file";
    const appwriteKey = await uploadToAppwrite(buffer, filename, contentType);
    logger.debug("Appwrite upload", { key: appwriteKey, bytes: buffer.length });
    return mediaUrlFor(appwriteKey);
  }

  if (isR2Storage()) {
    await uploadToR2(key, buffer, contentType);
    logger.debug("R2 upload", { key, bytes: buffer.length });
    return mediaUrlFor(key);
  }

  const filepath = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(filepath), { recursive: true });
  await writeFile(filepath, buffer);
  logger.debug("Local upload", { key, bytes: buffer.length });
  return mediaUrlFor(key);
}

export async function saveUploadedImage(file: File): Promise<string> {
  validateImageFile(file);

  const raw = Buffer.from(await file.arrayBuffer());
  const compressed = await compressImage(raw);
  const key = `images/${randomUUID()}.webp`;

  return saveBuffer(key, compressed, "image/webp");
}

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export async function saveUploadedVideo(file: File): Promise<string> {
  validateVideoFile(file);

  const ext = VIDEO_EXT[file.type] ?? ".mp4";
  const key = `video/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  return saveBuffer(key, buffer, file.type || "video/mp4");
}

export function validateStoryVideoFile(file: File): void {
  if (!UPLOAD.allowedVideoTypes.includes(file.type as (typeof UPLOAD.allowedVideoTypes)[number])) {
    throw new UploadError(
      "Invalid video type. Allowed: mp4, webm, mov",
      400,
    );
  }

  if (file.size > UPLOAD.maxStoryVideoSize) {
    throw new UploadError("Story video exceeds 100MB limit", 400);
  }
}

export async function saveUploadedStoryVideo(
  file: File,
): Promise<{ url: string; trimmed: boolean }> {
  validateStoryVideoFile(file);

  const ext = VIDEO_EXT[file.type] ?? ".mp4";
  const raw = Buffer.from(await file.arrayBuffer());

  let output = raw;
  let trimmed = false;

  if (!isR2Storage() && !isAppwriteStorage()) {
    try {
      const prepared = await prepareStoryVideo(raw, ext, STORY_MAX_VIDEO_SECONDS);
      output = Buffer.from(prepared.buffer);
      trimmed = prepared.trimmed;
    } catch (error) {
      if (error instanceof VideoProcessingError) {
        throw new UploadError(error.message, 400);
      }
      throw error;
    }
  }

  const key = `video/${randomUUID()}.mp4`;
  const url = await saveBuffer(key, output, trimmed ? "video/mp4" : file.type || "video/mp4");

  return { url, trimmed };
}

export async function saveStoryMedia(
  file: File,
): Promise<{ url: string; type: "IMAGE" | "VIDEO"; videoTrimmed?: boolean }> {
  if (file.type.startsWith("video/")) {
    const { url, trimmed } = await saveUploadedStoryVideo(file);
    return { url, type: "VIDEO", videoTrimmed: trimmed };
  }

  const url = await saveUploadedImage(file);
  return { url, type: "IMAGE" };
}

export async function saveStoryMediaFromUrl(
  mediaUrl: string,
  mediaType: "IMAGE" | "VIDEO",
  videoTrimmed?: boolean,
): Promise<{ url: string; type: "IMAGE" | "VIDEO"; videoTrimmed?: boolean }> {
  return { url: mediaUrl, type: mediaType, videoTrimmed };
}

export async function savePostMedia(
  file: File,
): Promise<{ url: string; type: "IMAGE" | "VIDEO" }> {
  if (file.type.startsWith("video/")) {
    return { url: await saveUploadedVideo(file), type: "VIDEO" };
  }
  return { url: await saveUploadedImage(file), type: "IMAGE" };
}

export function validateChatImageFile(file: File): void {
  if (!UPLOAD.allowedImageTypes.includes(file.type as (typeof UPLOAD.allowedImageTypes)[number])) {
    throw new UploadError(
      "Invalid file type. Allowed: jpg, jpeg, png, webp",
      400,
    );
  }

  if (file.size > UPLOAD.maxChatImageSize) {
    throw new UploadError("File size exceeds 10MB limit", 400);
  }
}

export async function saveChatImage(file: File): Promise<string> {
  validateChatImageFile(file);
  return saveUploadedImage(file);
}

const AUDIO_EXT: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/mp4": ".m4a",
  "audio/wav": ".wav",
};

export function validateAudioFile(file: File): void {
  if (!UPLOAD.allowedAudioTypes.includes(file.type as (typeof UPLOAD.allowedAudioTypes)[number])) {
    throw new UploadError("Invalid audio type", 400);
  }

  if (file.size > UPLOAD.maxChatImageSize) {
    throw new UploadError("Audio file too large", 400);
  }
}

export async function saveAudioFile(file: File): Promise<string> {
  validateAudioFile(file);

  const ext = AUDIO_EXT[file.type] ?? ".webm";
  const key = `audio/${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  return saveBuffer(key, buffer, file.type || "audio/webm");
}

export async function deleteUploadedImage(url: string): Promise<void> {
  const key = keyFromMediaUrl(url);
  if (!key) return;

  if (isAppwriteStorage()) {
    try {
      await deleteFromAppwrite(key);
    } catch {
      // file may already be deleted
    }
    return;
  }

  if (isR2Storage()) {
    try {
      await deleteFromR2(key);
    } catch {
      // object may already be deleted
    }
    return;
  }

  try {
    const filepath = await resolveExistingUploadFile(key);
    await unlink(filepath);
  } catch {
    // File may already be deleted
  }
}

export function storageKeyForPurpose(
  purpose: string,
  contentType: string,
): string {
  if (purpose.includes("video") || contentType.startsWith("video/")) {
    const ext = VIDEO_EXT[contentType] ?? ".mp4";
    return `video/${randomUUID()}${ext}`;
  }
  if (purpose.includes("audio") || contentType.startsWith("audio/")) {
    const ext = AUDIO_EXT[contentType] ?? ".webm";
    return `audio/${randomUUID()}${ext}`;
  }
  return `images/${randomUUID()}.webp`;
}
