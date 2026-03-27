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
  "bg-violet-600/20 text-violet-300",
  "bg-emerald-600/20 text-emerald-300",
  "bg-amber-600/20 text-amber-300",
  "bg-rose-600/20 text-rose-300",
  "bg-cyan-600/20 text-cyan-300",
  "bg-fuchsia-600/20 text-fuchsia-300",
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
              <h3 className="line-clamp-1 text-sm font-semibold text-foreground">
                {thread.title}
              </h3>
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(thread.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
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
                      className={`text-[9px] ${MENTOR_COLOR_PALETTE[i % MENTOR_COLOR_PALETTE.length]}`}
                    >
                      {getInitials(p.mentor?.name ?? "M")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {participants.map((p) => p.mentor?.name).filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Last message preview */}
            {preview ? (
              <p className="line-clamp-2 text-xs text-muted-foreground/80">
                {preview}
              </p>
            ) : (
              <p className="flex items-center gap-1 text-xs text-muted-foreground/50">
                <Users className="h-3 w-3" />
                No messages yet
              </p>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-muted-foreground/60">
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
