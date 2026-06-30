"use client";

import type { ProfileDto } from "@/types/profile";
import { calculateProfileCompletion } from "@/lib/profile/completion";
import { ProgressBar } from "@/components/profile/progress-bar";
import { SectionCard } from "@/components/profile/section-card";

interface ProfileProgressSectionProps {
  profile: ProfileDto;
}

export function ProfileProgressSection({ profile }: ProfileProgressSectionProps) {
  const completion = calculateProfileCompletion({
    bio: profile.bio,
    username: profile.username,
    occupation: profile.occupation,
    city: profile.city,
    country: profile.country,
    latitude: profile.latitude,
    longitude: profile.longitude,
    photos: profile.photos,
  });

  return (
    <SectionCard title="Profile Progress">
      <ProgressBar value={profile.profileCompletion} />
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {completion.items.map((item) => (
          <li
            key={item.key}
            className={`flex items-center gap-2 text-sm ${
              item.completed ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                item.completed ? "bg-[#FF4458]" : "bg-muted"
              }`}
            />
            {item.label}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
