export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/#([\w]{2,50})/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/@([\w.]{2,30})/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
