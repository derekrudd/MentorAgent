"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Mentor, Message } from "@/types/database";

const MENTOR_IMAGES: Record<string, string> = {
  Jordan: "/mentors/jordan.png",
  Kathia: "/mentors/kathia.png",
};

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
    <div className="flex items-center gap-2 text-base text-muted-foreground">
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
  const mentorImage = MENTOR_IMAGES[mentor.name];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      {mentorImage ? (
        <div className="relative h-40 w-40 overflow-hidden rounded-full">
          <Image
            src={mentorImage}
            alt={mentor.name}
            fill
            className="object-cover object-top"
          />
        </div>
      ) : (
        <Avatar size="lg" className="h-24 w-24">
          <AvatarFallback className="bg-primary/10 text-2xl text-primary">
            {getInitials(mentor.name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div>
        <h2 className="text-lg font-semibold text-foreground">{mentor.name}</h2>
        <p className="text-base text-muted-foreground">{mentor.role}</p>
      </div>
      <p className="max-w-md text-base text-muted-foreground">
        {mentor.greeting_message || `Hi! I'm ${mentor.name}. How can I help you today?`}
      </p>
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
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {getInitials(mentor.name)}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-xl px-3 py-2 text-base ${
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
                <div className="prose max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_pre]:my-2 [&_pre]:rounded-lg [&_pre]:bg-foreground/5 [&_pre]:p-3 [&_code]:rounded [&_code]:bg-foreground/5 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {pendingUserMessage && (
        <div className="flex flex-row-reverse gap-3">
          <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] rounded-xl bg-primary px-3 py-2 text-base text-primary-foreground opacity-70">
            <p className="whitespace-pre-wrap">{pendingUserMessage}</p>
          </div>
        </div>
      )}

      {showThinking && (
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-0.5 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs text-primary">
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
