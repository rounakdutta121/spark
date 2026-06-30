export const FOLLOW_UPDATED_EVENT = "spark:follow-updated";

export function notifyFollowUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FOLLOW_UPDATED_EVENT));
  }
}
