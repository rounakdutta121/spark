import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { q } = await searchParams;
  redirect(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
}
