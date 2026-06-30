"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SocialProfileDialog,
  type SocialProfileView,
} from "@/features/social/components/social-profile-dialog";
import { ROUTES } from "@/lib/constants";
import { FOLLOW_UPDATED_EVENT } from "@/lib/social/follow-events";
import { useAuthContext } from "@/providers/auth-provider";
import { fetchUserProfile } from "@/services/profile/profile.api";

interface UserProfileContextValue {
  openProfile: (userId: string) => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<SocialProfileView | null>(null);

  const openProfile = useCallback(
    async (userId: string) => {
      if (!userId) return;
      if (user?.id === userId) {
        router.push(ROUTES.profile);
        return;
      }
      setOpen(true);
      setLoading(true);
      setProfile(null);
      try {
        const { profile: data } = await fetchUserProfile(userId);
        setProfile(data);
      } catch (err) {
        setOpen(false);
        toast.error(err instanceof Error ? err.message : "Could not load profile");
      } finally {
        setLoading(false);
      }
    },
    [router, user?.id],
  );

  useEffect(() => {
    if (!open || !profile?.id) return;

    const refreshProfile = () => {
      void fetchUserProfile(profile.id)
        .then(({ profile: data }) => setProfile(data))
        .catch(() => {});
    };

    window.addEventListener(FOLLOW_UPDATED_EVENT, refreshProfile);
    return () => window.removeEventListener(FOLLOW_UPDATED_EVENT, refreshProfile);
  }, [open, profile?.id]);

  const value = useMemo(() => ({ openProfile }), [openProfile]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
      <SocialProfileDialog
        profile={profile}
        open={open}
        loading={loading}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setProfile(null);
        }}
      />
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
