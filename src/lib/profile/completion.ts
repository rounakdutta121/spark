import type { ProfileCompletionBreakdown } from "@/types/profile";

export interface ProfileCompletionData {
  bio: string | null;
  username: string | null;
  occupation: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: { id: string }[];
}

const COMPLETION_FIELDS = [
  { key: "photos", label: "Profile photo", weight: 1 },
  { key: "username", label: "Username", weight: 1 },
  { key: "bio", label: "Bio", weight: 1 },
  { key: "location", label: "Location", weight: 1 },
  { key: "occupation", label: "Occupation", weight: 1 },
] as const;

function isFieldComplete(
  key: (typeof COMPLETION_FIELDS)[number]["key"],
  profile: ProfileCompletionData,
): boolean {
  switch (key) {
    case "photos":
      return profile.photos.length > 0;
    case "username":
      return !!profile.username?.trim();
    case "bio":
      return !!profile.bio?.trim();
    case "location":
      return !!(
        profile.city ||
        profile.country ||
        (profile.latitude != null && profile.longitude != null)
      );
    case "occupation":
      return !!profile.occupation?.trim();
    default:
      return false;
  }
}

export function calculateProfileCompletion(
  profile: ProfileCompletionData,
): ProfileCompletionBreakdown {
  const totalWeight = COMPLETION_FIELDS.reduce((sum, f) => sum + f.weight, 0);

  const items = COMPLETION_FIELDS.map((field) => ({
    key: field.key,
    label: field.label,
    completed: isFieldComplete(field.key, profile),
    weight: field.weight,
  }));

  const completedWeight = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  return {
    percentage: Math.round((completedWeight / totalWeight) * 100),
    items,
  };
}
