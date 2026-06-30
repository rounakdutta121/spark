export const STORIES_REFRESH_EVENT = "spark:stories-refresh";

export function notifyStoriesRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORIES_REFRESH_EVENT));
  }
}
