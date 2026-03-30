"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MentorThreadMessage } from "@/types/database";

interface ThreadMessageProps {
  message: MentorThreadMessage;
  mentorColors: Record<string, string>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const THINKING_MESSAGES = [
  "Thinking...",
  "Analyzing...",
  "Considering your question...",
  "Researching...",
  "Formulating a response...",
];

function GeneratingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-base text-muted-foreground">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
      {THINKING_MESSAGES[messageIndex]}
    </div>
  );
}

export function ThreadMessage({ message, mentorColors }: ThreadMessageProps) {
  const isUser = message.sender_type === "user";
  const isSystem = message.sender_type === "system";
  const isMentor = message.sender_type === "mentor";
  const isGenerating = message.status === "generating";

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <p className="text-sm text-muted-foreground">{message.content}</p>
      </div>
    );
  }

  // User messages
  if (isUser) {
    return (
      <div className="flex flex-row-reverse gap-3">
        <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-xl bg-primary px-3 py-2 text-base text-primary-foreground">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Mentor messages
  const mentorName = message.sender_mentor?.name ?? "Mentor";
  const mentorId = message.sender_mentor_id ?? "";
  const color = mentorColors[mentorId] ?? "bg-primary/10 text-primary";

  return (
    <div className="flex gap-3">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback className={color}>
          {getInitials(mentorName)}
        </AvatarFallback>
      </Avatar>

      <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
        <p className="mb-0.5 text-sm font-medium text-muted-foreground">
          {mentorName}
        </p>
        <div className="rounded-xl bg-muted px-3 py-2 text-base text-foreground">
          {isGenerating ? (
            <GeneratingIndicator />
          ) : (
            <div className="prose max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-foreground/5 [&_pre]:p-3 [&_code]:rounded [&_code]:bg-foreground/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
