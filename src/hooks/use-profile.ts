"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProfileDto } from "@/types/profile";
import type { UpdateProfileInput, LocationInput } from "@/schemas/profile/profile.schema";
import {
  deletePhotoApi,
  fetchProfile,
  reorderPhotosApi,
  updateLocationApi,
  updateProfileApi,
  uploadPhotoApi,
} from "@/services/profile/profile.api";

export function useProfile() {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await fetchProfile();
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (input: UpdateProfileInput) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfileApi(input);
      setProfile(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const uploadPhoto = useCallback(async (file: File, isPrimary = false) => {
    setSaving(true);
    try {
      const updated = await uploadPhotoApi(file, isPrimary);
      setProfile(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  }, []);

  const removePhoto = useCallback(async (photoId: string) => {
    setSaving(true);
    try {
      const updated = await deletePhotoApi(photoId);
      setProfile(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  }, []);

  const reorderPhotos = useCallback(async (photoIds: string[]) => {
    setSaving(true);
    try {
      const updated = await reorderPhotosApi(photoIds);
      setProfile(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveLocation = useCallback(async (input: LocationInput) => {
    setSaving(true);
    try {
      const updated = await updateLocationApi(input);
      setProfile(updated);
      return updated;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    profile,
    loading,
    saving,
    error,
    reload: load,
    save,
    uploadPhoto,
    removePhoto,
    reorderPhotos,
    saveLocation,
  };
}
