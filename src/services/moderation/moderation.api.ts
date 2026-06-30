import { apiClient } from "@/lib/api-client";

export function blockUser(userId: string) {
  return apiClient<{ blocked: boolean }>(`/api/users/${userId}/block`, {
    method: "POST",
  });
}

export function unblockUser(userId: string) {
  return apiClient<{ unblocked: boolean }>(`/api/users/${userId}/block`, {
    method: "DELETE",
  });
}

export function fetchBlockedUsers() {
  return apiClient<{
    blocked: {
      userId: string;
      name: string;
      photoUrl: string | null;
      blockedAt: string;
    }[];
  }>("/api/users/blocked");
}

export function reportUser(
  userId: string,
  input: { reason: string; details?: string },
) {
  return apiClient<{ reportId: string }>(`/api/users/${userId}/report`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
