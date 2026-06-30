"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import {
  adminDeleteUser,
  banUser,
  fetchAdminReports,
  fetchAdminStats,
  fetchAdminUsers,
  updateReport,
  type AdminReport,
  type AdminUser,
} from "@/services/admin/admin.api";

type Tab = "stats" | "users" | "reports" | "content";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [posts, setPosts] = useState<
    { id: string; caption: string | null; author: { name: string }; _count: { likes: number; comments: number } }[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "stats") {
        const r = await fetchAdminStats();
        setStats(r.stats);
      } else if (tab === "users") {
        const r = await fetchAdminUsers(search || undefined);
        setUsers(r.users);
      } else if (tab === "content") {
        const r = await apiClient<{ posts: typeof posts }>("/api/admin/posts");
        setPosts(r.posts);
      } else {
        const r = await fetchAdminReports("PENDING");
        setReports(r.reports);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Access denied");
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-6 bg-background p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="flex gap-2">
        {(["stats", "users", "reports", "content"] as Tab[]).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            className="rounded-full capitalize"
          >
            {t}
          </Button>
        ))}
      </div>

      {error && (
        <GlassCard className="p-4 text-destructive">{error}</GlassCard>
      )}

      {loading ? (
        <LoadingSkeleton variant="admin" />
      ) : tab === "stats" && stats ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(stats).map(([k, v]) => (
            <GlassCard key={k} className="p-4">
              <p className="text-sm text-muted-foreground capitalize">{k}</p>
              <p className="text-3xl font-bold">{v}</p>
            </GlassCard>
          ))}
        </div>
      ) : tab === "users" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
            />
            <Button onClick={load}>Search</Button>
          </div>
          {users.map((u) => (
            <GlassCard key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground">
                  {u.isActive ? "Active" : "Banned"} · {u.emailVerified ? "Verified" : "Unverified"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await banUser(u.id, !u.isActive);
                    toast.success(u.isActive ? "Banned" : "Unbanned");
                    void load();
                  }}
                >
                  {u.isActive ? "Ban" : "Unban"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm("Delete user permanently?")) return;
                    await adminDeleteUser(u.id);
                    toast.success("Deleted");
                    void load();
                  }}
                >
                  Delete
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : tab === "content" ? (
        <div className="space-y-3">
          {posts.map((p) => (
            <GlassCard key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{p.author.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {p.caption ?? "(no caption)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p._count.likes} likes · {p._count.comments} comments
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await apiClient(`/api/admin/posts/${p.id}`, { method: "DELETE" });
                  toast.success("Post removed");
                  void load();
                }}
              >
                Remove
              </Button>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-muted-foreground">No pending reports</p>
          ) : (
            reports.map((r) => (
              <GlassCard key={r.id} className="space-y-2 p-4">
                <p className="font-medium">
                  {r.reported.name} reported by {r.reporter.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">{r.reason}</span>
                  {r.details && ` — ${r.details}`}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await updateReport(r.id, "REVIEWED");
                      toast.success("Marked reviewed");
                      void load();
                    }}
                  >
                    Reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await updateReport(r.id, "DISMISSED");
                      toast.success("Dismissed");
                      void load();
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}
    </div>
  );
}
