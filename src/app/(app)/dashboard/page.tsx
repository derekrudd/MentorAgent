"use client";

import { useRef } from "react";
import Link from "next/link";
import { useMentors } from "@/lib/hooks/use-mentors";
import { useGsapStagger, useGsapIconHover } from "@/lib/animations/use-gsap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowUpRight, Users } from "lucide-react";
import type { Mentor } from "@/types/database";

function MentorCardChatButton({ mentorId }: { mentorId: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useGsapIconHover(btnRef, "slide-up-right", "svg:last-child");

  return (
    <Link href={`/mentor/${mentorId}/chat`}>
      <Button ref={btnRef} size="sm" className="gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        Chat
        <ArrowUpRight className="h-3 w-3" />
      </Button>
    </Link>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const GRADIENT_COLORS = [
  "from-violet-600/80 to-indigo-900/90",
  "from-emerald-600/80 to-teal-900/90",
  "from-amber-600/80 to-orange-900/90",
  "from-rose-600/80 to-pink-900/90",
  "from-cyan-600/80 to-blue-900/90",
  "from-fuchsia-600/80 to-purple-900/90",
];

function MentorCard({ mentor, index }: { mentor: Mentor; index: number }) {
  const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative flex h-[300px] items-end bg-gradient-to-b ${gradient}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-bold text-white/20">
            {getInitials(mentor.name)}
          </span>
        </div>
        <div className="relative z-10 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{mentor.name}</h3>
            {mentor.is_active && (
              <span className="h-2 w-2 rounded-full bg-green-400" />
            )}
          </div>
          <p className="text-sm text-white/70">{mentor.role}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {mentor.personality}
        </p>

        {mentor.skills && mentor.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mentor.skills.slice(0, 4).map((skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="bg-primary/8 text-xs"
              >
                {skill.display_name}
              </Badge>
            ))}
            {mentor.skills.length > 4 && (
              <Badge variant="secondary" className="bg-primary/8 text-xs">
                +{mentor.skills.length - 4}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-xs text-muted-foreground">
          {mentor.skills?.length ?? 0} skill
          {(mentor.skills?.length ?? 0) !== 1 ? "s" : ""}
        </span>
        <MentorCardChatButton mentorId={mentor.id} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="h-[300px] animate-pulse bg-muted" />
          <div className="flex flex-col gap-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="flex gap-1.5">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: mentors, isLoading } = useMentors();
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapStagger(gridRef, "> div", { staggerEach: 0.1 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Your AI Mentors
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a mentor to start a conversation and get personalized guidance.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div
          ref={gridRef}
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {mentors?.map((mentor, i) => (
            <MentorCard key={mentor.id} mentor={mentor} index={i} />
          ))}
        </div>
      )}

      {/* MentorThreads CTA */}
      <div className="mt-8 flex items-center justify-between gap-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              MentorThreads
            </h3>
            <p className="text-sm text-muted-foreground">
              Get multi-perspective guidance from 2-3 mentors in one conversation
            </p>
          </div>
        </div>
        <Link href="/threads">
          <Button size="sm" className="gap-1.5">
            Start a Thread
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
