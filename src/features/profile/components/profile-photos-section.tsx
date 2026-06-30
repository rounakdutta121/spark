"use client";

import { toast } from "sonner";
import type { ProfileDto } from "@/types/profile";
import { SectionCard } from "@/components/profile/section-card";
import { PhotoGrid } from "@/components/profile/photo-grid";
import { PhotoUpload } from "@/components/profile/photo-upload";

interface ProfilePhotosSectionProps {
  profile: ProfileDto;
  saving: boolean;
  onUpload: (file: File, isPrimary?: boolean) => Promise<ProfileDto>;
  onDelete: (photoId: string) => Promise<ProfileDto>;
  onReorder: (photoIds: string[]) => Promise<ProfileDto>;
}

export function ProfilePhotosSection({
  profile,
  saving,
  onUpload,
  onDelete,
  onReorder,
}: ProfilePhotosSectionProps) {
  const handleSetPrimary = async (photoId: string) => {
    const ids = [
      photoId,
      ...profile.photos.filter((p) => p.id !== photoId).map((p) => p.id),
    ];
    try {
      await onReorder(ids);
      toast.success("Primary photo updated");
    } catch {
      toast.error("Failed to update photo");
    }
  };

  return (
    <SectionCard
      title="Photos"
      description="Add up to 6 photos. First photo is your primary."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <PhotoGrid
          photos={profile.photos}
          onDelete={async (id) => {
            await onDelete(id);
            toast.success("Photo deleted");
          }}
          onSetPrimary={handleSetPrimary}
          disabled={saving}
        />
        <PhotoUpload
          currentCount={profile.photos.length}
          onUpload={(file) => onUpload(file, profile.photos.length === 0)}
          disabled={saving}
        />
      </div>
    </SectionCard>
  );
}
