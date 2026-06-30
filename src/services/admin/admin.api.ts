import { apiClient } from "@/lib/api-client";

export function fetchAdminStats() {
  return apiClient<{
    stats: {
      users: number;
      posts: number;
      messages: number;
      reports: number;
      pendingReports: number;
    };
  }>("/api/admin/stats");
}

export function fetchAdminUsers(q?: string) {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiClient<{ users: AdminUser[] }>(`/api/admin/users${query}`);
}

export function banUser(id: string, isActive: boolean) {
  return apiClient<{ user: { id: string; isActive: boolean } }>(
    `/api/admin/users/${id}`,
    { method: "PATCH", body: JSON.stringify({ isActive }) },
  );
}

export function adminDeleteUser(id: string) {
  return apiClient<{ deleted: boolean }>(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}

export function fetchAdminReports(status?: string) {
  const query = status ? `?status=${status}` : "";
  return apiClient<{ reports: AdminReport[] }>(`/api/admin/reports${query}`);
}

export function updateReport(id: string, status: "REVIEWED" | "DISMISSED") {
  return apiClient<{ report: AdminReport }>(`/api/admin/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function adminDeletePhoto(photoId: string) {
  return apiClient<{ deleted: boolean }>(`/api/admin/photos/${photoId}`, {
    method: "DELETE",
  });
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  profile: { verified: boolean } | null;
}

export interface AdminReport {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  reported: { id: string; name: string; email: string };
}
