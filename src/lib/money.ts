// Pure money helpers. Safe to import from client components (no database here).
// All amounts are whole cents (integers).

const MINUS = "−"; // a real minus sign, wider than "-"

/** "$540" or "$12.50". No sign. */
export function money(cents: number): string {
  const abs = Math.abs(Math.round(cents)) / 100;
  const whole = Number.isInteger(abs);
  return (
    "$" +
    abs.toLocaleString("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

/** "+$75" or "−$12". Zero shows as "+$0". */
export function signed(cents: number): string {
  return (cents < 0 ? MINUS : "+") + money(cents);
}

/** Amount for a ledger line: "+$155", "−$80". */
export function flow(cents: number): string {
  return (cents < 0 ? MINUS : "+") + money(cents);
}

/** Up or down triangle. Never use color alone. */
export function tri(cents: number): string {
  return cents < 0 ? "▼" : "▲";
}

/** Kept for older callers: "-$5" / "+$5". */
export function fmt(cents: number, opts: { sign?: boolean } = {}) {
  if (opts.sign) return signed(cents);
  return (cents < 0 ? MINUS : "") + money(cents);
}

/**
 * Turn what someone typed ("$1,234.5", " 80 ") into cents.
 * Returns NaN when it is not a number.
 */
export function parseMoney(input: string | null | undefined): number {
  const s = String(input ?? "").replace(/[$,\s]/g, "");
  if (s === "" || !/^-?\d*\.?\d*$/.test(s)) return NaN;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

/** What you keep from a deal: sells for − you pay − fees. */
export function dealProfit(payCents: number, sellCents: number, feesCents: number) {
  return sellCents - payCents - feesCents;
}

/** Profit from a sale. */
export function saleProfit(paidCents: number, soldCents: number, feesCents: number) {
  return soldCents - feesCents - paidCents;
}

export type ScoreWord = "Steal" | "Great" | "OK" | "Risky";
export function scoreWord(score: number): ScoreWord {
  return score >= 90 ? "Steal" : score >= 75 ? "Great" : score >= 60 ? "OK" : "Risky";
}
/** How many of the 5 score segments are lit. */
export function scoreSegments(score: number) {
  return score >= 90 ? 5 : score >= 75 ? 4 : score >= 60 ? 3 : score >= 45 ? 2 : 1;
}

/** Share of your cash a buy would use (0..). */
export function cashShare(priceCents: number, cashCents: number) {
  if (cashCents <= 0) return Infinity;
  return priceCents / cashCents;
}
export const ALL_IN_SHARE = 0.8;

/** Goal tiers after the first one: 100 → 250 → 500 → 1,000 → 2,000 ... */
export function nextGoal(goalCents: number) {
  if (goalCents < 25000) return 25000;
  if (goalCents < 50000) return 50000;
  return goalCents * 2;
}

/** A suggested opening offer: about 10% under, rounded to $5. */
export function suggestedOffer(askingCents: number) {
  return Math.round((askingCents * 0.9) / 500) * 500;
}
