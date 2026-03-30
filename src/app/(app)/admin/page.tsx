"use client";

import { useRef } from "react";
import { useGsapFadeIn, useGsapStagger } from "@/lib/animations/use-gsap";
import { OVERVIEW_STATS } from "@/lib/data/admin-mock-data";
import { StatCard } from "@/components/admin/stat-card";
import { MentorUsageSection } from "@/components/admin/mentor-usage-section";
import { ActivityTrendSection } from "@/components/admin/activity-trend-section";
import { StudentActivitySection } from "@/components/admin/student-activity-section";
import { EngagementTipsSection } from "@/components/admin/engagement-tips-section";

export default function AdminPage() {
  const headingRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useGsapFadeIn(headingRef);
  useGsapStagger(statsRef, "> div", { staggerEach: 0.08 });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 md:py-8">
      {/* Heading */}
      <div ref={headingRef}>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Engagement Dashboard
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Monitor student engagement and mentor usage across the platform.
        </p>
      </div>

      {/* Overview stats */}
      <div ref={statsRef} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {OVERVIEW_STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Mentor usage + activity trend */}
      <div className="grid gap-6 lg:grid-cols-3">
        <MentorUsageSection />
        <ActivityTrendSection />
      </div>

      {/* Student activity */}
      <StudentActivitySection />

      {/* Engagement tips */}
      <EngagementTipsSection />
    </div>
  );
}
