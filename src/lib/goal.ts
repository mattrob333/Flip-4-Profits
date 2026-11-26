import { money } from "./money";

export type GoalInfo = {
  title: string;
  /** Bar value and max, in whole dollars (or flips for the first goal). */
  val: number;
  max: number;
  left: string;
  unit: "flips" | "profit";
  /** Set right after a goal is reached, e.g. "First $100". */
  justDone: string | null;
};

/**
 * What the goal bar shows.
 * Before the first sale: "Make your first flip 0 / 1".
 * After that: the profit goal stored in settings (default $100).
 */
export function goalInfo(opts: {
  flips: number;
  totalProfitCents: number;
  goalCents: number;
  doneCents: number | null;
}): GoalInfo {
  const { flips, totalProfitCents, goalCents, doneCents } = opts;
  if (flips === 0) {
    return {
      title: "Make your first flip",
      val: 0,
      max: 1,
      left: "Buy something, then sell it for more.",
      unit: "flips",
      justDone: null,
    };
  }
  const p = Math.max(0, totalProfitCents);
  return {
    title: `Make ${money(goalCents)} profit`,
    val: Math.floor(p / 100),
    max: Math.round(goalCents / 100),
    left: p >= goalCents ? "Goal done" : `${money(goalCents - p)} to go`,
    unit: "profit",
    justDone: doneCents ? `first ${money(doneCents)}` : null,
  };
}
