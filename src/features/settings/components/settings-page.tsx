"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/button-link";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/lib/constants";
import { apiClient } from "@/lib/api-client";
import {
  changePassword,
  deleteAccount,
  fetchSettings,
  logoutAllDevices,
  updateSettings,
  type UserSettingsView,
} from "@/services/settings/settings.api";
import { fetchBlockedUsers, unblockUser } from "@/services/moderation/moderation.api";
import { PageLoader } from "@/components/shared/loading";
import { PasswordInput } from "@/components/auth/password-input";
import type { PermissionLevel } from "@prisma/client";

const PERMISSION_OPTS: { value: PermissionLevel; label: string }[] = [
  { value: "EVERYONE", label: "Everyone" },
  { value: "FOLLOWERS", label: "Followers only" },
  { value: "NONE", label: "No one" },
];

export function SettingsPage() {
  const { logout } = useAuth();
  const [settings, setSettings] = useState<UserSettingsView | null>(null);
  const [blocked, setBlocked] = useState<
    { userId: string; name: string; blockedAt: string }[]
  >([]);
  const [muted, setMuted] = useState<{ userId: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    Promise.all([
      fetchSettings(),
      fetchBlockedUsers(),
      apiClient<{ muted: { userId: string; name: string }[] }>("/api/users/muted"),
    ])
      .then(([s, b, m]) => {
        setSettings(s.settings);
        setBlocked(b.blocked);
        setMuted(m.muted);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleBool = async (key: keyof Pick<
    UserSettingsView,
    "pushNotifications" | "emailNotifications" | "profileVisible" | "isPrivateAccount"
  >) => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    try {
      const r = await updateSettings({ [key]: next[key] });
      setSettings(r.settings);
    } catch {
      toast.error("Failed to update");
    }
  };

  const setPermission = async (
    key: "messagePermission" | "mentionPermission" | "tagPermission" | "commentPermission",
    value: PermissionLevel,
  ) => {
    if (!settings) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      const r = await updateSettings({ [key]: value });
      setSettings(r.settings);
    } catch {
      toast.error("Failed to update");
    }
  };

  const savePassword = async () => {
    try {
      await changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
        confirmPassword: pw.confirm,
      });
      toast.success("Password updated");
      setPw({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllDevices();
      await logout();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    try {
      await deleteAccount();
      await logout();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) {
    return <PageLoader label="Loading settings…" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Account, privacy & safety</p>
      </div>

      <GlassCard className="space-y-4 p-4">
        <h2 className="font-semibold">Profile</h2>
        <ButtonLink href={ROUTES.editProfile} className="w-full rounded-full">
          Edit profile
        </ButtonLink>
        <ButtonLink href={ROUTES.saved} variant="outline" className="w-full rounded-full">
          Saved posts
        </ButtonLink>
      </GlassCard>

      <GlassCard className="space-y-3 p-4">
        <h2 className="font-semibold">Notifications</h2>
        {settings &&
          (
            [
              ["pushNotifications", "Push notifications"],
              ["emailNotifications", "Email notifications"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-sm">
              {label}
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={() => toggleBool(key)}
                className="size-4 accent-[#FF4458]"
              />
            </label>
          ))}
      </GlassCard>

      <GlassCard className="space-y-4 p-4">
        <h2 className="font-semibold">Privacy</h2>
        {settings && (
          <>
            <label className="flex items-center justify-between text-sm">
              Private account
              <input
                type="checkbox"
                checked={settings.isPrivateAccount}
                onChange={() => toggleBool("isPrivateAccount")}
                className="size-4 accent-[#FF4458]"
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              Profile visible
              <input
                type="checkbox"
                checked={settings.profileVisible}
                onChange={() => toggleBool("profileVisible")}
                className="size-4 accent-[#FF4458]"
              />
            </label>
            {(
              [
                ["messagePermission", "Who can message you"],
                ["mentionPermission", "Who can mention you"],
                ["tagPermission", "Who can tag you"],
                ["commentPermission", "Who can comment"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm">{label}</p>
                <select
                  value={settings[key]}
                  onChange={(e) =>
                    void setPermission(key, e.target.value as PermissionLevel)
                  }
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
                >
                  {PERMISSION_OPTS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </>
        )}
      </GlassCard>

      <GlassCard className="space-y-3 p-4">
        <h2 className="font-semibold">Change password</h2>
        <PasswordInput label="Current" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        <PasswordInput label="New" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <PasswordInput label="Confirm" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        <Button onClick={savePassword} className="w-full rounded-full">Update password</Button>
      </GlassCard>

      <GlassCard className="space-y-3 p-4">
        <h2 className="font-semibold">Blocked users ({blocked.length})</h2>
        {blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocked users</p>
        ) : (
          blocked.map((b) => (
            <div key={b.userId} className="flex items-center justify-between text-sm">
              <span>{b.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await unblockUser(b.userId);
                  setBlocked((prev) => prev.filter((x) => x.userId !== b.userId));
                  toast.success("Unblocked");
                }}
              >
                Unblock
              </Button>
            </div>
          ))
        )}
      </GlassCard>

      <GlassCard className="space-y-3 p-4">
        <h2 className="font-semibold">Muted users ({muted.length})</h2>
        {muted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No muted users</p>
        ) : (
          muted.map((m) => (
            <div key={m.userId} className="flex items-center justify-between text-sm">
              <span>{m.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await apiClient(`/api/users/${m.userId}/mute`, { method: "DELETE" });
                  setMuted((prev) => prev.filter((x) => x.userId !== m.userId));
                  toast.success("Unmuted");
                }}
              >
                Unmute
              </Button>
            </div>
          ))
        )}
      </GlassCard>

      <GlassCard className="space-y-3 p-4">
        <h2 className="font-semibold">Security</h2>
        <Button variant="outline" className="w-full rounded-full" onClick={handleLogoutAll}>
          Log out of all devices
        </Button>
        <Button variant="destructive" className="w-full rounded-full" onClick={handleDelete}>
          Delete account
        </Button>
      </GlassCard>
    </div>
  );
}
