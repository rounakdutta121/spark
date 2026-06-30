"use client";

import { useAuth } from "@/hooks/use-auth";
import { SocialProfilePage } from "@/features/social/components/social-profile-page";
import { PageLoader } from "@/components/shared/loading";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader label="Loading profile…" />;
  }

  if (!user) {
    return <p className="py-8 text-center text-destructive">Not signed in</p>;
  }

  return <SocialProfilePage userId={user.id} isOwn />;
}
