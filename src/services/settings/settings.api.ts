import { apiClient } from "@/lib/api-client";

import type { PermissionLevel } from "@prisma/client";

export interface UserSettingsView {
  pushNotifications: boolean;
  emailNotifications: boolean;
  profileVisible: boolean;
  showDistance: boolean;
  showAge: boolean;
  isPrivateAccount: boolean;
  messagePermission: PermissionLevel;
  mentionPermission: PermissionLevel;
  tagPermission: PermissionLevel;
  commentPermission: PermissionLevel;
}

export function fetchSettings() {
  return apiClient<{ settings: UserSettingsView }>("/api/settings");
}

export function updateSettings(settings: Partial<UserSettingsView>) {
  return apiClient<{ settings: UserSettingsView }>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiClient<{ message: string }>("/api/settings/password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAccount() {
  return apiClient<{ deleted: boolean }>("/api/settings", {
    method: "DELETE",
  });
}

export function logoutAllDevices() {
  return apiClient<{ message: string }>("/api/settings/logout-all", {
    method: "POST",
  });
}
