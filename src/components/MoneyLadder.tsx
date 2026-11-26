"use client";

// The money ladder: five named profit milestones on a 6px track with 28px nodes.
// Reached = filled green with a check; next = yellow ring (not filled), with the
// track filled part of the way to it ($75 of $100); later rungs = muted. When `fromCents`
// is set, it starts there and moves to `profitCents` after `delayMs` (600ms).
import * as React from "react";
import { CheckIcon } from "./Icons";
import { LADDER, ladderState } from "@/lib/ladder";
import { money } from "@/lib/money";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function MoneyLadder({
  profitCents,
  fromCents,
  delayMs = 0,
  className,
  showHead = true,
}: {
  profitCents: number;
  fromCents?: number;
  delayMs?: number;
  className?: string;
  showHead?: boolean;
}) {
  const [shown, setShown] = React.useState(fromCents ?? profitCents);
  React.useEffect(() => {
    if (prefersReducedMotion() || delayMs <= 0) {
      const raf = requestAnimationFrame(() => setShown(profitCents));
      return () => cancelAnimationFrame(raf);
    }
    const t = setTimeout(() => setShown(profitCents), delayMs);
    return () => clearTimeout(t);
  }, [profitCents, delayMs]);

  const s = ladderState(shown);
  const final = ladderState(profitCents);
  const label = final.next
    ? `Money ladder: ${money(final.profitCents)} profit made. Next rung ${final.next.name} at ${money(final.next.cents)}, ${money(final.leftCents)} to go.`
    : `Money ladder: every rung done, ${money(final.profitCents)} profit made.`;

  return (
    <div className={cn("ladder", className)}>
      {showHead && (
        <div className="ld-head">
          <span className="ld-title">
            {final.next ? (
              <>
                Next: <b>{money(final.next.cents)} {final.next.name}</b>
              </>
            ) : (
              <b>Mogul. Every rung done.</b>
            )}
          </span>
          <span className="ld-left tab">
            {final.next
              ? final.profitCents > 0
                ? `${money(final.profitCents)} of ${money(final.next.cents)}`
                : `Make ${money(final.next.cents)} profit`
              : money(final.profitCents) + " profit"}
          </span>
        </div>
      )}
      <ol className="ld-track" aria-label={label}>
        <span className="ld-rail" aria-hidden="true">
          <i style={{ transform: `scaleX(${s.fill})` }} />
        </span>
        {LADDER.map((r, i) => {
          const done = i < s.done;
          const next = i === s.done;
          return (
            <li key={r.cents} className={done ? "done" : next ? "next" : ""} aria-current={next ? "step" : undefined}>
              <span className="node" aria-hidden="true">
                {done ? <CheckIcon size={15} /> : null}
              </span>
              <span className="amt tab">{money(r.cents)}</span>
              <span className="nm">{r.name}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
