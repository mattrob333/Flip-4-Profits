"use client";

// Entrance: children rise in with a 100ms stagger, only the first time you open
// a screen in this session. CSS turns it off under prefers-reduced-motion.
import * as React from "react";

/** Put `enter` in the element's className from the server, and pass this ref. */
export function useEnterOnce<T extends HTMLElement>(screen: string) {
  const ref = React.useRef<T>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = "seen:" + screen;
    let seen = false;
    try {
      seen = sessionStorage.getItem(key) === "1";
      sessionStorage.setItem(key, "1");
    } catch {}
    if (seen) {
      el.classList.remove("enter");
      return;
    }
    const t = setTimeout(() => el.classList.remove("enter"), 1300);
    return () => clearTimeout(t);
  }, [screen]);
  return ref;
}

export function Enter({
  screen,
  as: Tag = "div",
  className,
  children,
  ...rest
}: { screen: string; as?: "div" | "section"; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const ref = useEnterOnce<HTMLElement>(screen);
  return React.createElement(Tag, { ref, className: `${className ?? ""} enter`, ...rest }, children);
}
