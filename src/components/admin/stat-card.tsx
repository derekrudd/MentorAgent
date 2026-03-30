"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGsapContext } from "@/lib/animations/gsap-provider";
import { ANIMATION_PRESETS } from "@/lib/animations/presets";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { OverviewStat } from "@/lib/data/admin-mock-data";

export function StatCard({ stat }: { stat: OverviewStat }) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const { prefersReducedMotion } = useGsapContext();

  useEffect(() => {
    const el = valueRef.current;
    if (!el || prefersReducedMotion) {
      if (el) {
        el.textContent = formatValue(stat.value, stat.decimals, stat.prefix, stat.suffix);
      }
      return;
    }

    const obj = { val: 0 };
    const preset = ANIMATION_PRESETS.counter;
    const tween = gsap.to(obj, {
      val: stat.value,
      duration: preset.duration,
      ease: preset.ease,
      delay: 0.3,
      onUpdate() {
        el.textContent = formatValue(obj.val, stat.decimals, stat.prefix, stat.suffix);
      },
    });

    return () => { tween.kill(); };
  }, [stat.value, stat.decimals, stat.prefix, stat.suffix, prefersReducedMotion]);

  const Icon = stat.icon;
  const isPositive = stat.change > 0;
  // For response time, negative change is good
  const isGood = stat.suffix === "s" ? !isPositive : isPositive;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{stat.label}</span>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <div>
        <span ref={valueRef} className="text-2xl font-bold tracking-tight text-foreground">
          0
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs">
        {isGood ? (
          <TrendingUp className="h-3 w-3 text-emerald-600" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-500" />
        )}
        <span className={isGood ? "text-emerald-600" : "text-red-500"}>
          {isPositive ? "+" : ""}
          {stat.change}%
        </span>
        <span className="text-muted-foreground">{stat.changeLabel}</span>
      </div>
    </Card>
  );
}

function formatValue(
  val: number,
  decimals?: number,
  prefix?: string,
  suffix?: string,
): string {
  const num = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return `${prefix ?? ""}${num}${suffix ?? ""}`;
}
