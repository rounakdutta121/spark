"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { ProfileCard } from "@/components/profile/profile-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthError } from "@/components/auth/auth-error";
import { PageLoader } from "@/components/shared/loading";
import { ProfileProgressSection } from "@/features/profile/components/profile-progress-section";
import { ProfilePhotosSection } from "@/features/profile/components/profile-photos-section";
import { ProfileBasicSection } from "@/features/profile/components/profile-basic-section";
import { ProfileExtraSections } from "@/features/profile/components/profile-extra-sections";
import {
  buildProfileSavePayload,
  profileToFormState,
} from "@/lib/profile/serialize";
import type { UpdateProfileInput } from "@/schemas/profile/profile.schema";
import type { UserSettingsDto } from "@/types/profile";

export function ProfileEditPage() {
  const {
    profile,
    loading,
    saving,
    error,
    save,
    uploadPhoto,
    removePhoto,
    reorderPhotos,
    saveLocation,
  } = useProfile();

  const [form, setForm] = useState<UpdateProfileInput>({});
  const [settings, setSettings] = useState<UserSettingsDto | null>(null);
  const initializedForUser = useRef<string | null>(null);

  const patchForm = useCallback((patch: Partial<UpdateProfileInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (initializedForUser.current === profile.userId) return;

    initializedForUser.current = profile.userId;
    setForm(profileToFormState(profile));
    setSettings(profile.settings);
  }, [profile]);

  useEffect(() => {
    return () => {
      initializedForUser.current = null;
    };
  }, []);

  if (loading || !profile || !settings) {
    return <PageLoader label="Loading profile…" />;
  }

  const handleSave = async () => {
    try {
      const updated = await save(buildProfileSavePayload(form, profile, settings));
      setForm(profileToFormState(updated));
      setSettings(updated.settings);
      toast.success("Profile saved!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save profile";
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update how you appear on Spark
        </p>
      </div>

      {error && <AuthError message={error} />}

      <ProfileCard profile={profile} />
      <ProfileProgressSection profile={profile} />

      <ProfilePhotosSection
        profile={profile}
        saving={saving}
        onUpload={uploadPhoto}
        onDelete={removePhoto}
        onReorder={reorderPhotos}
      />

      <ProfileBasicSection form={form} onChange={patchForm} />

      <ProfileExtraSections
        profile={profile}
        saving={saving}
        onSaveLocation={saveLocation}
      />

      <div className="sticky bottom-4">
        <AuthButton
          type="button"
          loading={saving}
          loadingText="Saving..."
          onClick={handleSave}
        >
          Save profile
        </AuthButton>
      </div>
    </div>
  );
}
