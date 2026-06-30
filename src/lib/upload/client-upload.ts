import { apiClient } from "@/lib/api-client";
import type { AppwritePresignPayload } from "@/lib/upload/appwrite-presign";
import { uploadFileToAppwriteBrowser } from "@/lib/upload/appwrite-browser-upload";

export type UploadPurpose =
  | "post-image"
  | "post-video"
  | "story-image"
  | "story-video"
  | "chat-image"
  | "chat-audio"
  | "avatar";

interface PresignResponse {
  key: string;
  uploadUrl: string;
  mediaUrl: string;
  appwrite?: AppwritePresignPayload;
}

interface DirectUploadResponse {
  key: string;
  mediaUrl: string;
}

function remoteStorageProvider(): string | undefined {
  return process.env.NEXT_PUBLIC_STORAGE_PROVIDER;
}

const SMALL_FILE_BYTES = 4 * 1024 * 1024;

export async function uploadFileToStorage(
  file: File,
  purpose: UploadPurpose,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const provider = remoteStorageProvider();

  if (provider === "appwrite" && file.size <= SMALL_FILE_BYTES) {
    const form = new FormData();
    form.set("file", file);
    form.set("purpose", purpose);

    const response = await fetch("/api/upload/file", {
      method: "POST",
      body: form,
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      if (data.code === "USE_PRESIGN" || response.status === 413) {
        // fall through to presign direct upload
      } else {
        throw new Error(data.error ?? "Failed to upload file");
      }
    } else {
      return (data.data as DirectUploadResponse).mediaUrl;
    }
  }

  const presign = await apiClient<PresignResponse>("/api/upload/presign", {
    method: "POST",
    body: JSON.stringify({
      purpose,
      contentType: file.type,
      fileName: file.name,
    }),
  });

  if (presign.appwrite) {
    await uploadFileToAppwriteBrowser(presign.appwrite, file, onProgress);
    return presign.mediaUrl;
  }

  if (!presign.uploadUrl) {
    throw new Error("Storage provider did not return an upload URL");
  }

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!put.ok) {
    throw new Error("Failed to upload file to storage");
  }

  return presign.mediaUrl;
}

export function shouldUseClientUpload(file: File): boolean {
  if (typeof window === "undefined") return false;
  const provider = remoteStorageProvider();
  if (provider === "appwrite" || provider === "r2") return true;
  return file.type.startsWith("video/") || file.size > SMALL_FILE_BYTES;
}
