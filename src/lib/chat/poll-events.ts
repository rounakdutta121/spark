export const CHAT_POLL_BUMP_EVENT = "chat:poll-bump";

export function bumpChatPoll(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHAT_POLL_BUMP_EVENT));
}
