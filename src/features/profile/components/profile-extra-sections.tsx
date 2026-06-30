"use client";

import type { ProfileDto } from "@/types/profile";
import { SectionCard } from "@/components/profile/section-card";
import { LocationPicker } from "@/components/profile/location-picker";
import type { LocationInput } from "@/schemas/profile/profile.schema";

interface ProfileExtraSectionsProps {
  profile: ProfileDto;
  saving: boolean;
  onSaveLocation: (data: LocationInput) => Promise<unknown>;
}

export function ProfileExtraSections({
  profile,
  saving,
  onSaveLocation,
}: ProfileExtraSectionsProps) {
  return (
    <SectionCard title="Location">
      <LocationPicker
        city={profile.city}
        country={profile.country}
        latitude={profile.latitude}
        longitude={profile.longitude}
        onSave={onSaveLocation}
        disabled={saving}
      />
    </SectionCard>
  );
}
