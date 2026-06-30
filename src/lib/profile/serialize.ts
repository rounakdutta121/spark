import type { ProfileDto } from "@/types/profile";
import type { UpdateProfileInput } from "@/schemas/profile/profile.schema";
import type { UserSettingsDto } from "@/types/profile";

export function profileToFormState(profile: ProfileDto): UpdateProfileInput {
  return {
    username: profile.username,
    bio: profile.bio,
    occupation: profile.occupation,
    education: profile.education,
    city: profile.city,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
  };
}

export function buildProfileSavePayload(
  form: UpdateProfileInput,
  profile: ProfileDto,
  settings: UserSettingsDto,
): UpdateProfileInput {
  return {
    username: form.username?.trim() || null,
    bio: form.bio?.trim() || null,
    occupation: form.occupation?.trim() || null,
    education: form.education?.trim() || null,
    city: profile.city,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
    settings,
  };
}
