"use client";

import type { UpdateProfileInput } from "@/schemas/profile/profile.schema";
import { SectionCard } from "@/components/profile/section-card";
import { EditableTextArea } from "@/components/profile/editable-textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileBasicSectionProps {
  form: UpdateProfileInput;
  onChange: (patch: Partial<UpdateProfileInput>) => void;
}

export function ProfileBasicSection({ form, onChange }: ProfileBasicSectionProps) {
  return (
    <SectionCard title="About you">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={form.username ?? ""}
            onChange={(e) =>
              onChange({ username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || null })
            }
            className="rounded-xl"
            placeholder="yourname"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">
            Letters, numbers, and underscores only
          </p>
        </div>

        <EditableTextArea
          label="Bio"
          name="bio"
          value={form.bio ?? ""}
          onChange={(e) => onChange({ bio: e.target.value })}
          placeholder="Tell people about yourself..."
          hint={`${(form.bio ?? "").length}/500`}
          maxLength={500}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={form.occupation ?? ""}
              onChange={(e) => onChange({ occupation: e.target.value || null })}
              className="rounded-xl"
              placeholder="What do you do?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="education">Education</Label>
            <Input
              id="education"
              value={form.education ?? ""}
              onChange={(e) => onChange({ education: e.target.value || null })}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
