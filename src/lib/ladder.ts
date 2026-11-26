// The money ladder: five named profit milestones. Pure, safe in client components.
// Money milestones only (no points, streaks or XP): each rung is real profit made.

export type Rung = { cents: number; name: string };

export const LADDER: readonly Rung[] = [
  { cents: 10000, name: "Rookie" },
  { cents: 25000, name: "Hustler" },
  { cents: 50000, name: "Dealer" },
  { cents: 100000, name: "Boss" },
  { cents: 250000, name: "Mogul" },
];

export type LadderState = {
  profitCents: number;
  /** Rungs reached (0-5). */
  done: number;
  /** The rung you're working toward, or null when every rung is done. */
  next: Rung | null;
  /** The last rung reached, or null before the first one. */
  reached: Rung | null;
  /** Money left to the next rung. */
  leftCents: number;
  /** Progress from the last rung reached (or $0) to the next rung, 0-1. */
  toNext: number;
  /**
   * Track fill, 0-1, along a rail that runs from the left edge ($0) to the last
   * node. Nodes sit at the centres of 5 equal columns, so node i is at
   * (10 + 20i)% of the width and the rail is 90% wide.
   */
  fill: number;
};

const nodePos = (i: number) => (10 + 20 * i) / 90;

export function ladderState(totalProfitCents: number): LadderState {
  const p = Math.max(0, totalProfitCents);
  const done = LADDER.filter((r) => p >= r.cents).length;
  const next = LADDER[done] ?? null;
  const reached = done ? LADDER[done - 1] : null;
  const prevCents = reached ? reached.cents : 0;
  const toNext = next ? (p - prevCents) / (next.cents - prevCents) : 1;
  const fill = next ? (done ? nodePos(done - 1) : 0) + (nodePos(done) - (done ? nodePos(done - 1) : 0)) * toNext : 1;
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  return { profitCents: p, done, next, reached, leftCents: next ? next.cents - p : 0, toNext: clamp(toNext), fill: clamp(fill) };
}

/** Rungs crossed by going from `before` to `after` profit (for the sold moment). */
export function rungsCrossed(beforeCents: number, afterCents: number): Rung[] {
  return LADDER.filter((r) => beforeCents < r.cents && afterCents >= r.cents);
}
