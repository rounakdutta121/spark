"use client";

import { use } from "react";
import { SocialProfilePage } from "@/features/social/components/social-profile-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const { id } = use(params);
  return <SocialProfilePage userId={id} />;
}
