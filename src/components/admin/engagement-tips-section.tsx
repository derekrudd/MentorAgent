"use client";

import { useRef } from "react";
import { useGsapStagger } from "@/lib/animations/use-gsap";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ENGAGEMENT_TIPS, type TipCategory } from "@/lib/data/admin-mock-data";

const CATEGORY_COLORS: Record<TipCategory, string> = {
  onboarding: "border-l-blue-500",
  retention: "border-l-amber-500",
  depth: "border-l-emerald-500",
  breadth: "border-l-violet-500",
};

const CATEGORY_LABELS: Record<TipCategory, string> = {
  onboarding: "Onboarding",
  retention: "Retention",
  depth: "Depth",
  breadth: "Breadth",
};

export function EngagementTipsSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  useGsapStagger(gridRef, "> div", { staggerEach: 0.08 });

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Engagement Tips
      </h2>
      <div ref={gridRef} className="grid gap-4 sm:grid-cols-2">
        {ENGAGEMENT_TIPS.map((tip) => (
          <Card
            key={tip.id}
            className={`border-l-4 ${CATEGORY_COLORS[tip.category]} p-4`}
          >
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[tip.category]}
              </Badge>
              <Badge
                variant={tip.impact === "high" ? "default" : "outline"}
                className="text-xs"
              >
                {tip.impact === "high" ? "High Impact" : "Medium Impact"}
              </Badge>
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              {tip.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tip.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
