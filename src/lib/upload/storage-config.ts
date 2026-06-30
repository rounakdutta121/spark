export function isR2Storage(): boolean {
  return process.env.STORAGE_PROVIDER === "r2";
}

export function isAppwriteStorage(): boolean {
  return process.env.STORAGE_PROVIDER === "appwrite";
}

export function isRemoteStorage(): boolean {
  return isR2Storage() || isAppwriteStorage();
}

export function mediaUrlForKey(key: string): string {
  return `/api/media/${key.replace(/\\/g, "/")}`;
}

export function keyFromMediaUrl(url: string): string | null {
  if (url.startsWith("/api/media/")) {
    return url.slice("/api/media/".length);
  }
  if (url.startsWith("/uploads/")) {
    return url.slice("/uploads/".length);
  }
  return null;
}
