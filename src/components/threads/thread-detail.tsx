"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useThread, useThreads } from "@/lib/hooks/use-mentor-threads";
import { ThreadMessage } from "./thread-message";
import { ThreadChatInput } from "./thread-chat-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import type { MentorThread } from "@/types/database";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MENTOR_COLOR_PALETTE = [
  "bg-violet-600/20 text-violet-300",
  "bg-emerald-600/20 text-emerald-300",
  "bg-amber-600/20 text-amber-300",
  "bg-rose-600/20 text-rose-300",
  "bg-cyan-600/20 text-cyan-300",
  "bg-fuchsia-600/20 text-fuchsia-300",
];

interface ThreadDetailProps {
  thread: MentorThread;
}

export function ThreadDetail({ thread: initialThread }: ThreadDetailProps) {
  const router = useRouter();
  const { messages, participants, sendMessage, triggerMentors, isLoading } =
    useThread(initialThread.id);
  const { remove } = useThreads();
  const [isSending, setIsSending] = useState(false);
  const [isMentorsResponding, setIsMentorsResponding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Build mentor color map from participants
  const mentorColors = useMemo(() => {
    const colors: Record<string, string> = {};
    participants.forEach((p, i) => {
      colors[p.mentor_id] = MENTOR_COLOR_PALETTE[i % MENTOR_COLOR_PALETTE.length];
    });
    return colors;
  }, [participants]);

  // Detect if any mentor is currently generating
  const mentorsGenerating = messages.some(
    (m) => m.status === "generating" && m.sender_type === "mentor"
  );

  // Detect if user has sent messages since the last mentor response
  // (i.e., there are user messages at the end of the thread that mentors haven't responded to)
  const hasUnrespondedUserMessages = useMemo(() => {
    if (messages.length === 0) return false;
    // Find the last mentor message (non-generating)
    const lastMentorIdx = [...messages]
      .reverse()
      .findIndex((m) => m.sender_type === "mentor" && m.status !== "generating");
    const lastUserIdx = [...messages]
      .reverse()
      .findIndex((m) => m.sender_type === "user");

    // User has unresponded messages if:
    // - There are user messages but no mentor messages yet, OR
    // - The last user message came AFTER the last mentor message
    if (lastUserIdx === -1) return false; // no user messages
    if (lastMentorIdx === -1) return true; // no mentor messages yet
    return lastUserIdx < lastMentorIdx; // user message is more recent (reversed index)
  }, [messages]);

  // Show the "Let mentors respond" button when there are unresponded user messages
  // and mentors aren't already generating
  const showTriggerButton = hasUnrespondedUserMessages && !mentorsGenerating && !isMentorsResponding;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  const handleSend = useCallback(
    async (content: string) => {
      setIsSending(true);
      try {
        await sendMessage(content);
        // Auto-trigger mentors — pass the content for @mention parsing
        await triggerMentors(content);
      } finally {
        setIsSending(false);
      }
    },
    [sendMessage, triggerMentors]
  );

  const handleTriggerMentors = useCallback(async () => {
    setIsMentorsResponding(true);
    try {
      await triggerMentors();
    } finally {
      // Keep the button hidden — it will reappear via hasUnrespondedUserMessages
      // once mentors finish and user sends new messages
      setIsMentorsResponding(false);
    }
  }, [triggerMentors]);

  const handleDelete = useCallback(async () => {
    await remove(initialThread.id);
    router.push("/threads");
  }, [remove, initialThread.id, router]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
        <Link
          href="/threads"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-2">
          {/* Overlapping participant avatars */}
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

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {initialThread.title}
            </p>
          </div>
        </div>

        <Badge
          variant="secondary"
          className="ml-auto shrink-0 bg-primary/8 text-xs"
        >
          {initialThread.status}
        </Badge>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!hasMessages && !isLoading ? (
          <EmptyState participants={participants} mentorColors={mentorColors} />
        ) : (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <ThreadMessage
                key={message.id}
                message={message}
                mentorColors={mentorColors}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* "Let mentors respond" button */}
        {showTriggerButton && (
          <div className="flex justify-center border-t border-border/50 bg-card/50 px-4 py-3">
            <Button
              onClick={handleTriggerMentors}
              className="gap-2"
              size="sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Let mentors respond
            </Button>
          </div>
        )}

        {/* Mentors responding indicator */}
        {(mentorsGenerating || isMentorsResponding) && !showTriggerButton && (
          <div className="flex justify-center border-t border-border/50 bg-card/50 px-4 py-2">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Mentors are responding...
            </p>
          </div>
        )}

        <ThreadChatInput
          onSend={handleSend}
          disabled={isSending || mentorsGenerating}
          participants={participants}
          placeholder="Message the thread..."
        />
      </div>
    </div>
  );
}

function EmptyState({
  participants,
  mentorColors,
}: {
  participants: MentorThread["participants"];
  mentorColors: Record<string, string>;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex items-center justify-center gap-3">
        {(participants ?? []).map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-1.5">
            <Avatar size="lg" className="h-14 w-14">
              <AvatarFallback
                className={`text-base ${mentorColors[p.mentor_id] ?? "bg-primary/10 text-primary"}`}
              >
                {getInitials(p.mentor?.name ?? "M")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {p.mentor?.name}
              </p>
              <p className="text-xs text-muted-foreground">{p.mentor?.role}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <p className="text-sm">Start a collaborative conversation</p>
      </div>
    </div>
  );
}
