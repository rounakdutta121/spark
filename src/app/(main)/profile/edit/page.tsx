import type { Metadata } from "next";
import { ProfileEditPage } from "@/features/profile/components/profile-edit-page";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export default function EditProfilePage() {
  return <ProfileEditPage />;
}
