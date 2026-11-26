"use client";

// Small shared state for the money "reward moments".
// Before a buy or sell, the client says what kind of change is coming, so every
// number that changes (cash pill, worth, ledger cash) flashes the right tint:
// info-blue for a buy (money moved, not lost), green for profit, coral for a loss.

export type MoneyKind = "info" | "profit" | "loss";

let pending: { kind: MoneyKind; at: number } | null = null;

export function announceMoney(kind: MoneyKind) {
  pending = { kind, at: Date.now() };
}

/** The announced kind if it is recent, else a guess from the direction of change. */
export function moneyKind(from: number, to: number): MoneyKind {
  if (pending && Date.now() - pending.at < 8000) return pending.kind;
  return to < from ? "info" : "profit";
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Count a number from `from` to `to` over ~600ms (ease-out). Calls `draw` each frame. */
export function tween(from: number, to: number, draw: (v: number) => void, ms = 600) {
  if (prefersReducedMotion() || from === to) {
    draw(to);
    return () => {};
  }
  const t0 = performance.now();
  let raf = 0;
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - p, 3);
    draw(Math.round(from + (to - from) * e));
    if (p < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Restart a one-shot flash class on an element. */
export function flash(el: HTMLElement | null, kind: MoneyKind) {
  if (!el || prefersReducedMotion()) return;
  el.classList.remove("fl-info", "fl-profit", "fl-loss");
  void el.offsetWidth;
  el.classList.add("fl-" + kind);
}
