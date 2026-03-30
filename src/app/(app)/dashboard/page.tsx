"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMentors } from "@/lib/hooks/use-mentors";
import { useGsapStagger, useGsapIconHover } from "@/lib/animations/use-gsap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { MessageSquare, ArrowUpRight, Users } from "lucide-react";
import type { Mentor } from "@/types/database";

function MentorCardChatButton({ mentorId }: { mentorId: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  useGsapIconHover(btnRef, "slide-up-right", "svg:last-child");

  return (
    <Link href={`/mentor/${mentorId}/chat`}>
      <Button ref={btnRef} className="gap-1.5 px-4 py-2 text-sm">
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

const MENTOR_IMAGES: Record<string, string> = {
  Jordan: "/mentors/jordan.png",
  Kathia: "/mentors/kathia.png",
  Quinn: "/mentors/quinn.png",
};

const GRADIENT_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

function MentorCard({ mentor, index }: { mentor: Mentor; index: number }) {
  const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  const mentorImage = MENTOR_IMAGES[mentor.name];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className={`relative flex h-48 sm:h-64 md:h-[300px] items-end ${mentorImage ? "bg-gray-100" : `bg-gradient-to-b ${gradient}`}`}>
        {mentorImage ? (
          <Image
            src={mentorImage}
            alt={mentor.name}
            fill
            className="object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-white/20">
              {getInitials(mentor.name)}
            </span>
          </div>
        )}
        <div className="relative z-10 w-full bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{mentor.name}</h3>
            {mentor.is_active && (
              <span className="h-2 w-2 rounded-full bg-green-400" />
            )}
          </div>
          <p className="text-base text-white/70">{mentor.role}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="mt-2 mb-6 text-base text-muted-foreground">
          {mentor.personality}
        </p>

        {mentor.skills && mentor.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mentor.skills.map((skill) => (
              <Badge
                key={skill.id}
                variant="secondary"
                className="h-auto rounded bg-primary/8 px-2 py-2 text-sm"
              >
                {skill.display_name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <span className="text-sm text-muted-foreground">
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
          <div className="h-48 sm:h-64 md:h-[300px] animate-pulse bg-muted" />
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
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Your AI Mentors
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
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
            <h3 className="text-base font-semibold text-foreground">
              MentorThreads
            </h3>
            <p className="text-base text-muted-foreground">
              Get multi-perspective guidance from 2-3 mentors in one conversation
            </p>
          </div>
        </div>
        <Link href="/threads">
          <Button className="gap-1.5 px-4 py-2 text-sm">
            Start a Thread
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
