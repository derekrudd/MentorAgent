"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGsapContext } from "@/lib/animations/gsap-provider";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { DAILY_ACTIVITY } from "@/lib/data/admin-mock-data";

export function ActivityTrendSection() {
  const barsRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useGsapContext();

  const maxMessages = Math.max(...DAILY_ACTIVITY.map((d) => d.messages));

  useEffect(() => {
    const container = barsRef.current;
    if (!container || prefersReducedMotion) return;

    const bars = container.querySelectorAll<HTMLElement>("[data-bar]");
    gsap.set(bars, { scaleY: 0, transformOrigin: "bottom" });

    const tween = gsap.to(bars, {
      scaleY: 1,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.6,
      stagger: 0.06,
    });

    return () => { tween.kill(); };
  }, [prefersReducedMotion]);

  return (
    <Card className="flex flex-col p-5">
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Weekly Activity
      </h2>
      <div
        ref={barsRef}
        className="flex flex-1 items-end justify-between gap-2 pt-2"
        style={{ minHeight: 160 }}
      >
        {DAILY_ACTIVITY.map((day) => {
          const heightPct = (day.messages / maxMessages) * 100;
          return (
            <Tooltip key={day.day}>
              <TooltipTrigger className="flex flex-1 flex-col items-center gap-1.5">
                <div className="relative flex w-full justify-center" style={{ height: 140 }}>
                  <div
                    data-bar
                    className="w-full max-w-[36px] rounded-t-md bg-primary"
                    style={{ height: `${heightPct}%`, marginTop: "auto" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">
                  {day.conversations} conversations
                </p>
                <p className="text-xs text-muted-foreground">
                  {day.messages} messages
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </Card>
  );
}
