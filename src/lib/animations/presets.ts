export const ANIMATION_PRESETS = {
  fadeInUp: {
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    duration: 1.2,
    ease: "power3.out",
  },
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 0.4,
    ease: "power2.out",
  },
  scaleIn: {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1 },
    duration: 0.35,
    ease: "power2.out",
  },
  slideInRight: {
    from: { opacity: 0, x: 20 },
    to: { opacity: 1, x: 0 },
    duration: 0.4,
    ease: "power2.out",
  },
  stagger: {
    each: 0.08,
    from: "start" as const,
  },
  counter: {
    duration: 1.2,
    ease: "power3.out",
  },
} as const;

export type AnimationPresetKey = keyof typeof ANIMATION_PRESETS;
