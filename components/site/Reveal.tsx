"use client";

import { useEffect, useRef } from "react";

/** Fades and lifts its children into view once, when they scroll on screen. Without script, or with reduced motion, nothing is hidden. */
export function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return void el.classList.add("is-in");
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Component = Tag as React.ElementType;
  return <Component ref={ref} className={`a-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</Component>;
}
