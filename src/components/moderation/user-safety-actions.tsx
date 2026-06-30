"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Ban, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { blockUser, reportUser } from "@/services/moderation/moderation.api";

const REASONS = [
  "SPAM",
  "FAKE_PROFILE",
  "HARASSMENT",
  "INAPPROPRIATE_CONTENT",
  "UNDERAGE",
  "OTHER",
] as const;

interface UserSafetyActionsProps {
  userId: string;
  userName: string;
  onBlocked?: () => void;
}

export function UserSafetyActions({
  userId,
  userName,
  onBlocked,
}: UserSafetyActionsProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("SPAM");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!confirm(`Block ${userName}? They won't appear in your feed or messages.`)) return;
    setLoading(true);
    try {
      await blockUser(userId);
      toast.success("User blocked");
      onBlocked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to block");
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    setLoading(true);
    try {
      await reportUser(userId, { reason, details: details || undefined });
      toast.success("Report submitted");
      setReportOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 border-t border-white/10 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-full"
          disabled={loading}
          onClick={handleBlock}
        >
          <Ban className="mr-1 size-4" />
          Block
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-full"
          disabled={loading}
          onClick={() => setReportOpen(true)}
        >
          <Flag className="mr-1 size-4" />
          Report
        </Button>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm"
              maxLength={1000}
            />
            <Button onClick={handleReport} disabled={loading} className="w-full rounded-full">
              Submit report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
