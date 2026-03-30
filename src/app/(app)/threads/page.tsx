"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useThreads } from "@/lib/hooks/use-mentor-threads";
import { ThreadList } from "@/components/threads/thread-list";
import { CreateThreadDialog } from "@/components/threads/create-thread-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users } from "lucide-react";

export default function ThreadsPage() {
  const router = useRouter();
  const { threads, isLoading, remove } = useThreads();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleCreated(threadId: string) {
    router.push(`/threads/${threadId}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            MentorThreads
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Collaborate with multiple mentors in one conversation
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Thread
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-base text-muted-foreground">Loading threads...</p>
          </div>
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground">
              No threads yet
            </h2>
            <p className="mt-1 max-w-sm text-base text-muted-foreground">
              Start a collaborative conversation with 2-3 mentors to get
              multi-perspective guidance.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Thread
          </Button>
        </div>
      ) : (
        <ThreadList threads={threads} onDelete={remove} />
      )}

      <CreateThreadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
