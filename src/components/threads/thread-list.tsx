"use client";

import { useRef } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useGsapStagger } from "@/lib/animations/use-gsap";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react";
import type { MentorThread } from "@/types/database";

const MENTOR_COLOR_PALETTE = [
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ThreadListProps {
  threads: MentorThread[];
  onDelete: (id: string) => void;
}

export function ThreadList({ threads, onDelete }: ThreadListProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapStagger(gridRef, "> a", { staggerEach: 0.1 });

  return (
    <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {threads.map((thread) => {
        const participants = thread.participants ?? [];
        const messages = thread.messages ?? [];
        const lastMessage = messages[messages.length - 1];

        let preview = "";
        if (lastMessage) {
          const prefix =
            lastMessage.sender_type === "mentor" && lastMessage.sender_mentor
              ? `${lastMessage.sender_mentor.name}: `
              : "";
          const content = lastMessage.content ?? "";
          preview = `${prefix}${content}`.slice(0, 120);
          if (content.length > 120) preview += "...";
        }

        return (
          <Link
            key={thread.id}
            href={`/threads/${thread.id}`}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-muted-foreground/30 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-1 text-base font-semibold text-foreground">
                {thread.title}
              </h3>
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(thread.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
                <span className="sr-only">Delete thread</span>
              </Button>
            </div>

            {/* Participant avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {participants.slice(0, 3).map((p, i) => (
                  <Avatar
                    key={p.id}
                    size="sm"
                    className="ring-2 ring-card"
                    style={{ zIndex: 3 - i }}
                  >
                    <AvatarFallback
                      className={`text-xs ${MENTOR_COLOR_PALETTE[i % MENTOR_COLOR_PALETTE.length]}`}
                    >
                      {getInitials(p.mentor?.name ?? "M")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {participants.map((p) => p.mentor?.name).filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Last message preview */}
            {preview ? (
              <p className="line-clamp-2 text-sm text-muted-foreground/80">
                {preview}
              </p>
            ) : (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                No messages yet
              </p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(thread.updated_at), {
                addSuffix: true,
              })}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
