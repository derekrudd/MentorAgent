"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface GsapContextValue {
  prefersReducedMotion: boolean;
}

const GsapContext = createContext<GsapContextValue>({
  prefersReducedMotion: false,
});

export function GsapProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <GsapContext.Provider value={{ prefersReducedMotion }}>
      {children}
    </GsapContext.Provider>
  );
}

export function useGsapContext() {
  return useContext(GsapContext);
}
