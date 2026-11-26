"use client";

// Always-visible cash. Counts and flashes when cash moves (blue for a buy,
// green for a profit, coral for a loss).
import * as React from "react";
import { NumberTicker } from "./ui/number-ticker";
import { money } from "@/lib/money";

export function CashPill({ cents }: { cents: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div className="cash-pill" id="cashPill" ref={ref}>
      <span aria-hidden="true" className="contents">
        <span className="eyebrow">Cash</span>
        <NumberTicker value={cents} flashTarget={ref} />
      </span>
      <span className="sr-only" aria-live="polite">
        Cash {money(cents)}
      </span>
    </div>
  );
}
