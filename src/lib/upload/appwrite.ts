import { Client, ID, Permission, Role, Storage } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

export const APPWRITE_FILE_PREFIX = "appwrite/";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required Appwrite environment variable: ${name}`);
  }
  return value;
}

let storageClient: Storage | null = null;

function getStorage(): Storage {
  if (storageClient) return storageClient;

  const client = new Client()
    .setEndpoint(requireEnv("APPWRITE_ENDPOINT"))
    .setProject(requireEnv("APPWRITE_PROJECT_ID"))
    .setKey(requireEnv("APPWRITE_API_KEY"));

  storageClient = new Storage(client);
  return storageClient;
}

export function getAppwriteBucketId(): string {
  return process.env.APPWRITE_BUCKET_ID ?? "6a4362790030c2e1da0b";
}

export function isAppwriteFileKey(key: string): boolean {
  return key.startsWith(APPWRITE_FILE_PREFIX);
}

export function appwriteFileIdFromKey(key: string): string | null {
  if (!isAppwriteFileKey(key)) return null;
  return key.slice(APPWRITE_FILE_PREFIX.length);
}

export function appwriteKeyForFileId(fileId: string): string {
  return `${APPWRITE_FILE_PREFIX}${fileId}`;
}

export async function uploadToAppwrite(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const storage = getStorage();
  const fileId = ID.unique();
  const file = InputFile.fromBuffer(buffer, filename);

  await storage.createFile({
    bucketId: getAppwriteBucketId(),
    fileId,
    file,
    permissions: [Permission.read(Role.any())],
  });

  return appwriteKeyForFileId(fileId);
}

export async function uploadFileToAppwrite(
  file: File,
  filename?: string,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadToAppwrite(
    buffer,
    filename ?? file.name ?? "upload",
    file.type || "application/octet-stream",
  );
}

export async function deleteFromAppwrite(key: string): Promise<void> {
  const fileId = appwriteFileIdFromKey(key);
  if (!fileId) return;

  try {
    await getStorage().deleteFile({
      bucketId: getAppwriteBucketId(),
      fileId,
    });
  } catch {
    // file may already be deleted
  }
}

export async function getAppwriteFileView(
  key: string,
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  const fileId = appwriteFileIdFromKey(key);
  if (!fileId) {
    throw new Error("Invalid Appwrite file key");
  }

  const storage = getStorage();
  const meta = await storage.getFile({
    bucketId: getAppwriteBucketId(),
    fileId,
  });
  const buffer = await storage.getFileView({
    bucketId: getAppwriteBucketId(),
    fileId,
  });

  return {
    buffer,
    mimeType: meta.mimeType ?? "application/octet-stream",
  };
}
