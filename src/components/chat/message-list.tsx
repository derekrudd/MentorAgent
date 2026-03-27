"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Mentor, Message } from "@/types/database";

interface MessageListProps {
  messages: Message[];
  mentor: Mentor;
  pendingUserMessage?: string | null;
  isSending: boolean;
  onSkillClick?: (skillName: string) => void;
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
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
      {THINKING_MESSAGES[messageIndex]}
    </div>
  );
}

function EmptyState({
  mentor,
  onSkillClick,
}: {
  mentor: Mentor;
  onSkillClick?: (skillName: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <Avatar size="lg" className="h-16 w-16">
        <AvatarFallback className="bg-primary/10 text-lg text-primary">
          {getInitials(mentor.name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{mentor.name}</h2>
        <p className="text-sm text-muted-foreground">{mentor.role}</p>
      </div>
      <p className="max-w-md text-sm text-muted-foreground">
        {mentor.greeting_message || `Hi! I'm ${mentor.name}. How can I help you today?`}
      </p>
      <p className="max-w-sm text-xs text-muted-foreground/70">
        {mentor.personality}
      </p>
      {mentor.skills && mentor.skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {mentor.skills.map((skill) => (
            <Badge
              key={skill.id}
              variant="secondary"
              className="cursor-pointer bg-primary/8 text-xs transition-colors hover:bg-primary/15"
              onClick={() => onSkillClick?.(skill.display_name)}
            >
              {skill.display_name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function MessageList({
  messages,
  mentor,
  pendingUserMessage,
  isSending,
  onSkillClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pendingUserMessage, isSending]);

  const hasGenerating = messages.some((m) => m.status === "generating");
  const showThinking =
    isSending && !hasGenerating && messages[messages.length - 1]?.role !== "assistant";

  if (messages.length === 0 && !pendingUserMessage) {
    return <EmptyState mentor={mentor} onSkillClick={onSkillClick} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const isGenerating = message.status === "generating";

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
          >
            {!isUser && (
              <Avatar size="sm" className="mt-0.5 shrink-0">
                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                  {getInitials(mentor.name)}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {isGenerating ? (
                <GeneratingIndicator />
              ) : isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-black/20 [&_pre]:p-3 [&_code]:rounded [&_code]:bg-black/20 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {pendingUserMessage && (
        <div className="flex flex-row-reverse gap-3">
          <div className="max-w-[80%] rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground opacity-70">
            <p className="whitespace-pre-wrap">{pendingUserMessage}</p>
          </div>
        </div>
      )}

      {showThinking && (
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-0.5 shrink-0">
            <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
              {getInitials(mentor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="rounded-xl bg-muted px-3 py-2">
            <GeneratingIndicator />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
