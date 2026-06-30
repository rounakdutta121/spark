import { UPLOAD } from "@/lib/constants";
import { UploadError } from "@/lib/upload/storage";

export type UploadPurpose =
  | "post-image"
  | "post-video"
  | "story-image"
  | "story-video"
  | "chat-image"
  | "chat-audio"
  | "avatar";

export function validateUploadForPurpose(file: File, purpose: UploadPurpose): void {
  switch (purpose) {
    case "post-image":
    case "story-image":
    case "avatar":
      if (!UPLOAD.allowedImageTypes.includes(file.type as (typeof UPLOAD.allowedImageTypes)[number])) {
        throw new UploadError("Invalid file type. Allowed: jpg, jpeg, png, webp", 400);
      }
      if (file.size > UPLOAD.maxFileSize) {
        throw new UploadError("File size exceeds 5MB limit", 400);
      }
      return;
    case "post-video":
      if (!UPLOAD.allowedVideoTypes.includes(file.type as (typeof UPLOAD.allowedVideoTypes)[number])) {
        throw new UploadError("Invalid video type. Allowed: mp4, webm, mov", 400);
      }
      if (file.size > UPLOAD.maxVideoSize) {
        throw new UploadError("Video file exceeds 50MB limit", 400);
      }
      return;
    case "story-video":
      if (!UPLOAD.allowedVideoTypes.includes(file.type as (typeof UPLOAD.allowedVideoTypes)[number])) {
        throw new UploadError("Invalid video type. Allowed: mp4, webm, mov", 400);
      }
      if (file.size > UPLOAD.maxStoryVideoSize) {
        throw new UploadError("Story video exceeds 100MB limit", 400);
      }
      return;
    case "chat-image":
      if (!UPLOAD.allowedImageTypes.includes(file.type as (typeof UPLOAD.allowedImageTypes)[number])) {
        throw new UploadError("Invalid file type. Allowed: jpg, jpeg, png, webp", 400);
      }
      if (file.size > UPLOAD.maxChatImageSize) {
        throw new UploadError("File size exceeds 10MB limit", 400);
      }
      return;
    case "chat-audio":
      if (!UPLOAD.allowedAudioTypes.includes(file.type as (typeof UPLOAD.allowedAudioTypes)[number])) {
        throw new UploadError("Invalid audio type", 400);
      }
      if (file.size > UPLOAD.maxChatImageSize) {
        throw new UploadError("Audio file too large", 400);
      }
      return;
    default:
      throw new UploadError("Invalid upload purpose", 400);
  }
}
