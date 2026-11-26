"use client";

// Magic UI style number ticker, hand-written: counts to the new value (~600ms)
// and flashes its tint once. Off under prefers-reduced-motion.
import * as React from "react";
import { money, signed } from "@/lib/money";
import { flash, moneyKind, tween, type MoneyKind } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Format = "money" | "signed";
const formatters: Record<Format, (c: number) => string> = { money, signed };

export function NumberTicker({
  value,
  from,
  format = "money",
  flashTarget,
  kind,
  className,
  id,
}: {
  /** Cents. */
  value: number;
  /** Count from this on first show (e.g. 0 for the SOLD reward). */
  from?: number;
  format?: Format;
  /** Element to flash instead of the number itself (e.g. the cash pill). */
  flashTarget?: React.RefObject<HTMLElement | null>;
  kind?: MoneyKind;
  className?: string;
  id?: string;
}) {
  const fmt = formatters[format];
  const ref = React.useRef<HTMLSpanElement>(null);
  const shown = React.useRef(from ?? value);
  // React renders the first value only; after that the text is drawn by the tween,
  // so React never jumps to the final number before the count runs.
  const [initial] = React.useState(from ?? value);

  React.useEffect(() => {
    const start = shown.current;
    if (start === value) return;
    const k = kind ?? moneyKind(start, value);
    flash(flashTarget?.current ?? ref.current, k);
    const stop = tween(start, value, (v) => {
      shown.current = v;
      if (ref.current) ref.current.textContent = fmt(v);
    });
    return stop;
  }, [value, fmt, flashTarget, kind]);

  return (
    <span ref={ref} id={id} className={cn("num", className)}>
      {fmt(initial)}
    </span>
  );
}
