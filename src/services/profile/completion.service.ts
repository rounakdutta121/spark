import type { Profile } from "@prisma/client";
import { calculateProfileCompletion as calc } from "@/lib/profile/completion";
import type { ProfileCompletionBreakdown } from "@/types/profile";

interface CompletionInput {
  profile: Profile & {
    photos: { id: string }[];
    interests: { interestId: string }[];
  };
}

export function calculateProfileCompletion(
  input: CompletionInput,
): ProfileCompletionBreakdown {
  return calc({
    bio: input.profile.bio,
    username: input.profile.username,
    occupation: input.profile.occupation,
    city: input.profile.city,
    country: input.profile.country,
    latitude: input.profile.latitude,
    longitude: input.profile.longitude,
    photos: input.profile.photos,
  });
}
