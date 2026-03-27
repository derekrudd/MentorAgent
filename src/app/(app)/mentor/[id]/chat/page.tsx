"use client";

import { use } from "react";
import { useMentor } from "@/lib/hooks/use-mentors";
import { ChatPage } from "@/components/chat/chat-page";

export default function MentorChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: mentor, isLoading } = useMentor(id);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading mentor...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Mentor not found.</p>
      </div>
    );
  }

  return <ChatPage mentor={mentor} />;
}
