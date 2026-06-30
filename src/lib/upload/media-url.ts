/** Normalize stored media paths to authenticated API URLs. */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/api/media/")) return url;
  if (url.startsWith("/uploads/")) {
    return url.replace("/uploads/", "/api/media/");
  }
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return url;
}
