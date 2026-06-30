export const NOTIFICATIONS_UPDATED_EVENT = "spark:notifications-updated";

export function notifyNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  }
}
