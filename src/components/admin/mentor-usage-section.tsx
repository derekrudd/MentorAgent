"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGsapContext } from "@/lib/animations/gsap-provider";
import { useGsapStagger } from "@/lib/animations/use-gsap";
import { Card } from "@/components/ui/card";
import { MENTOR_USAGE } from "@/lib/data/admin-mock-data";

export function MentorUsageSection() {
  const listRef = useRef<HTMLDivElement>(null);
  useGsapStagger(listRef, "> div", { staggerEach: 0.1 });

  return (
    <Card className="p-5 lg:col-span-2">
      <h2 className="mb-4 text-base font-semibold text-foreground">Mentor Usage</h2>
      <div ref={listRef} className="flex flex-col gap-4">
        {MENTOR_USAGE.map((mentor) => (
          <MentorRow key={mentor.mentorName} mentor={mentor} />
        ))}
      </div>
    </Card>
  );
}

function MentorRow({ mentor }: { mentor: (typeof MENTOR_USAGE)[number] }) {
  const barRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useGsapContext();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || prefersReducedMotion) {
      if (bar) bar.style.width = `${mentor.percentOfTotal}%`;
      return;
    }

    bar.style.width = "0%";
    const tween = gsap.to(bar, {
      width: `${mentor.percentOfTotal}%`,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.5,
    });

    return () => { tween.kill(); };
  }, [mentor.percentOfTotal, prefersReducedMotion]);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
          <Image
            src={mentor.mentorImage}
            alt={mentor.mentorName}
            fill
            className="object-cover object-top"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{mentor.mentorName}</p>
          <p className="text-xs text-muted-foreground">{mentor.mentorRole}</p>
        </div>
        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
          <span>{mentor.conversations} chats</span>
          <span>{mentor.messages.toLocaleString()} msgs</span>
          <span>{mentor.uniqueStudents} students</span>
          <span className="font-medium text-foreground">{mentor.avgRating} ★</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          ref={barRef}
          className="h-full rounded-full bg-primary"
          style={{ width: 0 }}
        />
      </div>
    </div>
  );
}
