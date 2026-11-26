"use client";

// Thick progress bar with the number inside (Duolingo). Fills from `from` to `val` once.
import * as React from "react";

export function GoalBar({ val, max, label, from }: { val: number; max: number; label: string; from?: number }) {
  const [shown, setShown] = React.useState(from ?? val);
  React.useEffect(() => {
    const t = requestAnimationFrame(() => setShown(val));
    return () => cancelAnimationFrame(t);
  }, [val]);
  const pct = Math.max(0, Math.min(100, (shown / max) * 100));
  return (
    <div className="gbar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={val} aria-label={label}>
      <span className="f" style={{ width: pct + "%" }} />
      <span className={"t" + (pct >= 58 ? " on" : "")}>
        {val} / {max}
      </span>
    </div>
  );
}
