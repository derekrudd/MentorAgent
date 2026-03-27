"use client";

import { use } from "react";
import { useThread } from "@/lib/hooks/use-mentor-threads";
import { ThreadDetail } from "@/components/threads/thread-detail";

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { thread, isLoading } = useThread(id);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading thread...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Thread not found.</p>
      </div>
    );
  }

  return <ThreadDetail thread={thread} />;
}
