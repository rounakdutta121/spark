const HTML_TAG = /<[^>]*>/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeMessageText(text: string): string {
  return text.replace(HTML_TAG, "").replace(CONTROL_CHARS, "").trim();
}

export function isValidEmoji(emoji: string): boolean {
  return [...emoji].length <= 4 && emoji.length <= 8;
}
