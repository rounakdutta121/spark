import { redirect } from "next/navigation";
import { requireAdminUserId } from "@/lib/api/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminUserId();
  } catch {
    redirect("/feed");
  }

  return children;
}
