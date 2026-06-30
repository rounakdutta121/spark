import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProgressBar } from "@/components/profile/progress-bar";
import { GlassCard } from "@/components/shared/glass-card";
import type { ProfileDto } from "@/types/profile";

interface ProfileCardProps {
  profile: ProfileDto;
  className?: string;
}

export function ProfileCard({ profile, className }: ProfileCardProps) {
  const primaryPhoto =
    profile.photos.find((p) => p.isPrimary) ?? profile.photos[0];

  return (
    <GlassCard className={`p-6 ${className ?? ""}`}>
      <div className="flex items-start gap-4">
        <ProfileAvatar
          src={primaryPhoto?.url}
          name={profile.name}
          size="lg"
          verified={profile.verified}
        />
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-xl font-bold">{profile.name}</h2>
          {profile.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}
          {(profile.city || profile.country) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[profile.city, profile.country].filter(Boolean).join(", ")}
            </p>
          )}
          {profile.occupation && (
            <p className="mt-1 text-sm">{profile.occupation}</p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {profile.bio}
        </p>
      )}

      <div className="mt-6">
        <ProgressBar value={profile.profileCompletion} />
      </div>
    </GlassCard>
  );
}
