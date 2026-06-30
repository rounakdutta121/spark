import { ConversationPage } from "@/features/chat/components/conversation-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ConversationPage conversationId={id} />;
}
