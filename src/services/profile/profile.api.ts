import { apiClient } from "@/lib/api-client";
import {
  shouldUseClientUpload,
  uploadFileToStorage,
} from "@/lib/upload/client-upload";
import type { SocialProfileView } from "@/features/social/components/social-profile-dialog";
import type {
  InterestOption,
  ProfileDto,
} from "@/types/profile";
import type {
  LocationInput,
  UpdateProfileInput,
} from "@/schemas/profile/profile.schema";

export function fetchProfile() {
  return apiClient<{ profile: ProfileDto }>("/api/profile").then(
    (data) => data.profile,
  );
}

export function fetchInterests() {
  return apiClient<{ interests: InterestOption[] }>("/api/interests").then(
    (data) => data.interests,
  );
}

export function updateProfileApi(input: UpdateProfileInput) {
  return apiClient<{ profile: ProfileDto }>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  }).then((data) => data.profile);
}

export async function uploadPhotoApi(file: File, isPrimary = false) {
  if (shouldUseClientUpload(file)) {
    const url = await uploadFileToStorage(file, "avatar");
    const response = await fetch("/api/profile/photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, isPrimary }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? "Upload failed");
    }
    return data.data.profile as ProfileDto;
  }

  const form = new FormData();
  form.set("file", file);
  form.set("isPrimary", String(isPrimary));

  const response = await fetch("/api/profile/photo", {
    method: "POST",
    body: form,
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error ?? "Upload failed");
  }
  return data.data.profile as ProfileDto;
}

export function deletePhotoApi(photoId: string) {
  return apiClient<{ profile: ProfileDto }>("/api/profile/photo", {
    method: "DELETE",
    body: JSON.stringify({ photoId }),
  }).then((data) => data.profile);
}

export function reorderPhotosApi(photoIds: string[]) {
  return apiClient<{ profile: ProfileDto }>("/api/profile/photo/order", {
    method: "PUT",
    body: JSON.stringify({ photoIds }),
  }).then((data) => data.profile);
}

export function updateLocationApi(input: LocationInput) {
  return apiClient<{ profile: ProfileDto }>("/api/location", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((data) => data.profile);
}

export function fetchUserProfile(userId: string) {
  return apiClient<{ profile: SocialProfileView }>(`/api/users/${userId}/profile`);
}
