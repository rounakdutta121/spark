import { ID } from "node-appwrite";
import {
  appwriteKeyForFileId,
  getAppwriteBucketId,
} from "@/lib/upload/appwrite";
import { mediaUrlForKey } from "@/lib/upload/storage-config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required Appwrite environment variable: ${name}`);
  }
  return value;
}

export interface AppwritePresignPayload {
  endpoint: string;
  projectId: string;
  bucketId: string;
  fileId: string;
}

export function createAppwritePresign(): {
  key: string;
  mediaUrl: string;
  uploadUrl: string;
  appwrite: AppwritePresignPayload;
} {
  const fileId = ID.unique();
  const key = appwriteKeyForFileId(fileId);

  return {
    key,
    uploadUrl: "",
    mediaUrl: mediaUrlForKey(key),
    appwrite: {
      endpoint: requireEnv("APPWRITE_ENDPOINT"),
      projectId: requireEnv("APPWRITE_PROJECT_ID"),
      bucketId: getAppwriteBucketId(),
      fileId,
    },
  };
}
