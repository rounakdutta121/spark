"use client";

import { Client, Permission, Role, Storage } from "appwrite";
import type { AppwritePresignPayload } from "@/lib/upload/appwrite-presign";

export async function uploadFileToAppwriteBrowser(
  config: AppwritePresignPayload,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);

  const storage = new Storage(client);

  await storage.createFile({
    bucketId: config.bucketId,
    fileId: config.fileId,
    file,
    permissions: [Permission.read(Role.any())],
    onProgress: onProgress
      ? (event) => {
          onProgress(Math.round(event.progress));
        }
      : undefined,
  });
}
