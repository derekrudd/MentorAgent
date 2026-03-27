"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { useGsapContext } from "./gsap-provider";
import { ANIMATION_PRESETS } from "./presets";

interface FadeInOptions {
  delay?: number;
  duration?: number;
  ease?: string;
  y?: number;
}

interface StaggerOptions {
  delay?: number;
  duration?: number;
  ease?: string;
  staggerEach?: number;
  y?: number;
}

export function useGsapFadeIn<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>,
  options?: FadeInOptions,
) {
  const { prefersReducedMotion } = useGsapContext();

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    const preset = ANIMATION_PRESETS.fadeInUp;
    const ctx = gsap.context(() => {
      gsap.set(el, { ...preset.from });
      gsap.to(el, {
        ...preset.to,
        duration: options?.duration ?? preset.duration,
        ease: options?.ease ?? preset.ease,
        delay: options?.delay ?? 0,
        y: options?.y ?? preset.to.y,
      });
    });

    return () => ctx.revert();
  }, [ref, prefersReducedMotion, options?.delay, options?.duration, options?.ease, options?.y]);
}

export function useGsapStagger<T extends HTMLElement = HTMLDivElement>(
  parentRef: RefObject<T | null>,
  childSelector: string,
  options?: StaggerOptions,
) {
  const { prefersReducedMotion } = useGsapContext();

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent || prefersReducedMotion) return;

    const preset = ANIMATION_PRESETS.fadeInUp;
    const stgr = ANIMATION_PRESETS.stagger;

    function animate(): gsap.Context | null {
      const sel = childSelector.startsWith(">") ? `:scope ${childSelector}` : childSelector;
      const children = parent!.querySelectorAll(sel);
      if (children.length === 0) return null;

      return gsap.context(() => {
        gsap.set(children, { opacity: 0, y: options?.y ?? preset.from.y });
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 1.2,
          ease: options?.ease ?? "power3.out",
          delay: options?.delay ?? 0,
          stagger: {
            each: options?.staggerEach ?? stgr.each,
            from: stgr.from,
          },
        });
      });
    }

    let ctx = animate();
    if (ctx) return () => ctx!.revert();

    let observer: MutationObserver | null = new MutationObserver(() => {
      queueMicrotask(() => {
        if (!observer) return;
        ctx = animate();
        if (ctx) {
          observer?.disconnect();
          observer = null;
        }
      });
    });
    observer.observe(parent, { childList: true });

    const timeoutId = setTimeout(() => {
      observer?.disconnect();
      observer = null;
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      ctx?.revert();
      observer?.disconnect();
      observer = null;
    };
  }, [parentRef, childSelector, prefersReducedMotion, options?.delay, options?.duration, options?.ease, options?.staggerEach, options?.y]);
}

export type IconHoverEffect = "slide-up-right" | "rotate" | "spin";

export function useGsapIconHover<T extends HTMLElement = HTMLButtonElement>(
  ref: RefObject<T | null>,
  effect: IconHoverEffect,
  iconSelector = "svg:first-child",
) {
  const { prefersReducedMotion } = useGsapContext();

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    const icon = el.querySelector(iconSelector);
    if (!icon) return;

    const config = {
      "slide-up-right": {
        enter: { x: 2, y: -2, duration: 0.2, ease: "power2.out" },
        leave: { x: 0, y: 0, duration: 0.2, ease: "power2.out" },
      },
      rotate: {
        enter: { rotation: 90, duration: 0.25, ease: "power2.out" },
        leave: { rotation: 0, duration: 0.25, ease: "power2.out" },
      },
      spin: {
        enter: { rotation: 180, duration: 0.3, ease: "power2.out" },
        leave: { rotation: 0, duration: 0.3, ease: "power2.out" },
      },
    }[effect];

    function onEnter() {
      gsap.to(icon!, { ...config.enter, overwrite: true });
    }
    function onLeave() {
      gsap.to(icon!, { ...config.leave, overwrite: true });
    }

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref, effect, iconSelector, prefersReducedMotion]);
}
