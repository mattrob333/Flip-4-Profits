import { getDb } from "./db";
import { categoryLabel, sourceLabel, categoryOf } from "./categories";
import { addDays, dayKey, daysBetween, todayKey, parseDbDate } from "./dates";
import { money, signed, nextGoal, saleProfit } from "./money";
import { DEFAULT_GOAL_CENTS } from "./seed";

export { fmt } from "./money";

// ---------- raw rows ----------

export type Deal = {
  id: number; title: string; short_title: string | null; thumb_key: string | null;
  category: string; source: string; url: string | null; emoji: string;
  asking_cents: number; est_sell_cents: number; est_fees_cents: number;
  score: number; distance_mi: number | null; risk_flags: string; why: string | null;
  status: string; lane: string; created_at: string; photo_url: string | null;
};

export type InventoryItem = {
  id: number; deal_id: number | null; title: string; short_title: string | null; thumb_key: string | null;
  category: string; emoji: string;
  buy_cents: number; est_sell_cents: number; est_fees_cents: number; condition_notes: string; status: string;
  sell_cents: number | null; fees_cents: number | null; bought_at: string; sold_at: string | null;
  photo_url: string | null;
};

export type Transaction = {
  id: number; type: string; amount_cents: number; inventory_id: number | null;
  note: string; created_at: string;
};

export type Activity = { id: number; kind: string; message: string; ref_table: string | null; ref_id: number | null; created_at: string };

// ---------- view shapes (plain data, safe to pass to client components) ----------

export type DealView = {
  id: number; title: string; short: string; category: string; categoryLabel: string;
  source: string; sourceLabel: string; distance: number | null;
  askingCents: number; sellCents: number; feesCents: number; profitCents: number;
  score: number; flags: string[]; why: string; thumb: string; photoUrl: string | null;
  status: "new" | "watching"; lane: string;
};

export type HoldingView = {
  id: number; title: string; short: string; category: string; thumb: string; photoUrl: string | null;
  buyCents: number; estSellCents: number; estFeesCents: number; notes: string;
  listed: boolean; boughtKey: string; daysHeld: number;
};

export type SoldView = {
  id: number; title: string; short: string; category: string; thumb: string; photoUrl: string | null;
  buyCents: number; sellCents: number; feesCents: number; profitCents: number; soldKey: string;
};

export type LedgerEntry = {
  id: number; kind: "start" | "buy" | "sell" | "adjust"; what: string; note: string;
  dayKey: string; amountCents: number; cashAfterCents: number; profitCents: number | null;
};

export class LedgerError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

const short = (r: { short_title: string | null; title: string }) => r.short_title || r.title;
const thumbOf = (r: { thumb_key: string | null; category: string }) =>
  r.thumb_key || categoryOf(r.category)?.thumb || "box";

// ---------- reads ----------

export function getCash() {
  return (getDb().prepare("SELECT COALESCE(SUM(amount_cents),0) AS v FROM transactions").get() as { v: number }).v;
}

export function getBalance() {
  const db = getDb();
  const cash = getCash();
  const inv = db.prepare(
    "SELECT COALESCE(SUM(buy_cents),0) AS cost, COALESCE(SUM(est_sell_cents),0) AS est, COUNT(*) AS n FROM inventory WHERE status != 'sold'"
  ).get() as { cost: number; est: number; n: number };
  const profit = (db.prepare(
    "SELECT COALESCE(SUM(sell_cents - COALESCE(fees_cents,0) - buy_cents),0) AS v FROM inventory WHERE status = 'sold'"
  ).get() as { v: number }).v;
  const week = (db.prepare(
    "SELECT COALESCE(SUM(sell_cents - COALESCE(fees_cents,0) - buy_cents),0) AS v FROM inventory WHERE status = 'sold' AND sold_at >= datetime('now','-7 days')"
  ).get() as { v: number }).v;
  const best = db.prepare(
    "SELECT title, short_title, (sell_cents - COALESCE(fees_cents,0) - buy_cents) AS profit FROM inventory WHERE status = 'sold' ORDER BY profit DESC, id ASC LIMIT 1"
  ).get() as { title: string; short_title: string | null; profit: number } | undefined;
  const flips = (db.prepare("SELECT COUNT(*) AS n FROM inventory WHERE status = 'sold'").get() as { n: number }).n;
  const deposits = (db.prepare("SELECT COALESCE(SUM(amount_cents),0) AS v FROM transactions WHERE type = 'deposit'").get() as { v: number }).v;
  const firstAt = (db.prepare("SELECT MIN(created_at) AS v FROM transactions").get() as { v: string | null }).v;
  return {
    cash,
    inventoryCost: inv.cost,
    inventoryEst: inv.est,
    itemsHeld: inv.n,
    totalProfit: profit,
    weekProfit: week,
    bestFlip: best ? { title: short(best), profit: best.profit } : null,
    flips,
    netWorth: cash + inv.cost,
    deposits,
    startKey: firstAt ? dayKey(firstAt) : todayKey(),
  };
}

export function getSetting(key: string): string | null {
  const r = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return r?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb().prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

export function getGoal() {
  const goal = Number(getSetting("goal_cents") ?? DEFAULT_GOAL_CENTS);
  const done = getSetting("goal_done_cents");
  return { goalCents: goal > 0 ? goal : DEFAULT_GOAL_CENTS, doneCents: done ? Number(done) : null };
}

function toDealView(d: Deal): DealView {
  let flags: string[] = [];
  try { flags = JSON.parse(d.risk_flags); } catch { flags = []; }
  return {
    id: d.id, title: d.title, short: short(d), category: d.category, categoryLabel: categoryLabel(d.category),
    source: d.source, sourceLabel: sourceLabel(d.source), distance: d.distance_mi,
    askingCents: d.asking_cents, sellCents: d.est_sell_cents, feesCents: d.est_fees_cents,
    profitCents: d.est_sell_cents - d.asking_cents - d.est_fees_cents,
    score: d.score, flags, why: d.why ?? "", thumb: thumbOf(d), photoUrl: d.photo_url ?? null,
    status: d.status === "watching" ? "watching" : "new", lane: d.lane,
  };
}

/** Deals you can still act on (new or watching), best score first. */
export function listDeals(lane = "scout"): DealView[] {
  const rows = getDb().prepare(
    "SELECT * FROM deals WHERE status IN ('new','watching') AND lane = ? ORDER BY score DESC, id ASC"
  ).all(lane) as Deal[];
  return rows.map(toDealView);
}

export function lastScoutedAt(): string | null {
  return (getDb().prepare("SELECT MAX(created_at) AS v FROM deals").get() as { v: string | null }).v;
}

export function listHoldings(): HoldingView[] {
  const today = todayKey();
  const rows = getDb().prepare("SELECT * FROM inventory WHERE status != 'sold' ORDER BY bought_at ASC, id ASC").all() as InventoryItem[];
  return rows.map((r) => {
    const k = dayKey(r.bought_at);
    return {
      id: r.id, title: r.title, short: short(r), category: r.category, thumb: thumbOf(r), photoUrl: r.photo_url ?? null,
      buyCents: r.buy_cents, estSellCents: r.est_sell_cents, estFeesCents: r.est_fees_cents ?? 0,
      notes: r.condition_notes, listed: r.status === "listed", boughtKey: k, daysHeld: daysBetween(k, today),
    };
  });
}

export function listSold(): SoldView[] {
  const rows = getDb().prepare("SELECT * FROM inventory WHERE status = 'sold' ORDER BY sold_at DESC, id DESC").all() as InventoryItem[];
  return rows.map((r) => ({
    id: r.id, title: r.title, short: short(r), category: r.category, thumb: thumbOf(r), photoUrl: r.photo_url ?? null,
    buyCents: r.buy_cents, sellCents: r.sell_cents ?? 0, feesCents: r.fees_cents ?? 0,
    profitCents: saleProfit(r.buy_cents, r.sell_cents ?? 0, r.fees_cents ?? 0),
    soldKey: dayKey(r.sold_at ?? r.bought_at),
  }));
}

/** Kept for older callers. */
export function listInventory() {
  return getDb().prepare(
    "SELECT * FROM inventory ORDER BY status = 'sold', COALESCE(sold_at, bought_at) DESC"
  ).all() as InventoryItem[];
}

export function listTransactions(limit = 100) {
  return getDb().prepare("SELECT * FROM transactions ORDER BY id DESC LIMIT ?").all(limit) as Transaction[];
}

export function listActivity(limit = 12) {
  return getDb().prepare("SELECT * FROM activity_log ORDER BY id DESC LIMIT ?").all(limit) as Activity[];
}

/**
 * Every dollar in and out, oldest first, with running cash.
 * A sale and its fee are shown as one line (the net amount).
 */
export function getLedger(): LedgerEntry[] {
  const db = getDb();
  const txs = db.prepare(`
    SELECT t.*, i.title AS i_title, i.short_title AS i_short, i.buy_cents AS i_buy, i.sell_cents AS i_sell,
           i.fees_cents AS i_fees, d.asking_cents AS d_asking
    FROM transactions t
    LEFT JOIN inventory i ON i.id = t.inventory_id
    LEFT JOIN deals d ON d.id = i.deal_id
    ORDER BY t.created_at ASC, t.id ASC`).all() as (Transaction & {
      i_title: string | null; i_short: string | null; i_buy: number | null; i_sell: number | null;
      i_fees: number | null; d_asking: number | null;
    })[];
  const lessons = new Map<number, string>();
  for (const a of db.prepare("SELECT ref_id, message FROM activity_log WHERE kind = 'lesson' ORDER BY id ASC").all() as { ref_id: number; message: string }[]) {
    lessons.set(a.ref_id, a.message);
  }
  const out: LedgerEntry[] = [];
  let cash = 0;
  for (const t of txs) {
    cash += t.amount_cents;
    const name = t.i_short || t.i_title || "";
    if (t.type === "fee") {
      const sale = [...out].reverse().find((e) => e.kind === "sell" && e.id === t.inventory_id);
      if (sale) {
        sale.amountCents += t.amount_cents;
        sale.cashAfterCents = cash;
        continue;
      }
    }
    if (t.type === "deposit") {
      out.push({ id: t.id, kind: "start", what: out.length === 0 ? `Started with ${money(t.amount_cents)}` : `Added ${money(t.amount_cents)}`,
        note: "", dayKey: dayKey(t.created_at), amountCents: t.amount_cents, cashAfterCents: cash, profitCents: null });
    } else if (t.type === "buy") {
      const saved = t.d_asking != null ? t.d_asking + t.amount_cents : 0;
      out.push({ id: t.inventory_id ?? t.id, kind: "buy", what: `Bought ${name}`, note: saved > 0 ? `You talked them down ${money(saved)}` : "",
        dayKey: dayKey(t.created_at), amountCents: t.amount_cents, cashAfterCents: cash, profitCents: null });
    } else if (t.type === "sell") {
      const profit = saleProfit(t.i_buy ?? 0, t.i_sell ?? 0, t.i_fees ?? 0);
      const notes = [t.i_fees ? `${money(t.i_fees)} fees` : "", t.inventory_id && lessons.get(t.inventory_id) ? `Lesson: ${lessons.get(t.inventory_id)}` : ""].filter(Boolean);
      out.push({ id: t.inventory_id ?? t.id, kind: "sell", what: `Sold ${name}`, note: notes.join(" · "),
        dayKey: dayKey(t.created_at), amountCents: t.amount_cents, cashAfterCents: cash, profitCents: profit });
    } else {
      out.push({ id: t.id, kind: "adjust", what: t.note || "Adjustment", note: "", dayKey: dayKey(t.created_at),
        amountCents: t.amount_cents, cashAfterCents: cash, profitCents: null });
    }
  }
  return out;
}

export type WorthDay = {
  key: string;
  /** Worth at the end of the day, or null before you started. */
  worthCents: number | null;
  startCents: number;
  events: { kind: "buy" | "sell"; what: string; amountCents: number; profitCents: number | null }[];
};

/**
 * Worth over time, one point per day, from the first day (or 7 days ago, if later) to today.
 * Worth = cash + what you paid for things you still hold. Buying keeps it flat.
 */
export function getWorthSeries(): WorthDay[] {
  const db = getDb();
  const today = todayKey();
  const txs = db.prepare("SELECT type, amount_cents, created_at FROM transactions ORDER BY created_at, id").all() as Transaction[];
  const inv = db.prepare("SELECT buy_cents, bought_at, sold_at FROM inventory").all() as InventoryItem[];
  const ledger = getLedger();
  const first = txs.length ? dayKey(txs[0].created_at) : today;
  const from = daysBetween(first, addDays(today, -6)) > 0 ? first : addDays(today, -6);
  const days: WorthDay[] = [];
  for (let k = from; daysBetween(k, today) >= 0; k = addDays(k, 1)) {
    const started = daysBetween(first, k) >= 0;
    let cash = 0, deposits = 0;
    for (const t of txs) {
      if (daysBetween(dayKey(t.created_at), k) >= 0) {
        cash += t.amount_cents;
        if (t.type === "deposit") deposits += t.amount_cents;
      }
    }
    let held = 0;
    for (const i of inv) {
      const b = dayKey(i.bought_at);
      const s = i.sold_at ? dayKey(i.sold_at) : null;
      if (daysBetween(b, k) >= 0 && (s === null || daysBetween(s, k) < 0)) held += i.buy_cents;
    }
    days.push({
      key: k,
      worthCents: started ? cash + held : null,
      startCents: deposits,
      events: ledger.filter((e) => e.dayKey === k && (e.kind === "buy" || e.kind === "sell"))
        .map((e) => ({ kind: e.kind as "buy" | "sell", what: e.what, amountCents: e.amountCents, profitCents: e.profitCents })),
    });
  }
  return days;
}

export type HotItem = { query: string; category: string; soldCount7d: number; sellThroughPct: number | null; medianSoldCents: number | null; medianDaysToSell: number | null };

/** "Hot right now": latest market snapshot per saved search. Empty until the nightly job exists. */
export function getHotList(limit = 5): HotItem[] {
  return (getDb().prepare(`
    SELECT s.query, s.category, m.sold_count_7d, m.sell_through_pct, m.median_sold_cents, m.median_days_to_sell
    FROM market_snapshots m JOIN saved_searches s ON s.id = m.search_id
    WHERE s.active = 1 AND m.taken_on = (SELECT MAX(taken_on) FROM market_snapshots WHERE search_id = m.search_id)
    ORDER BY m.sold_count_7d DESC LIMIT ?`).all(limit) as {
      query: string; category: string; sold_count_7d: number; sell_through_pct: number | null;
      median_sold_cents: number | null; median_days_to_sell: number | null;
    }[]).map((r) => ({
      query: r.query, category: r.category, soldCount7d: r.sold_count_7d, sellThroughPct: r.sell_through_pct,
      medianSoldCents: r.median_sold_cents, medianDaysToSell: r.median_days_to_sell,
    }));
}

// ---------- writes ----------

function log(kind: string, message: string, refTable?: string, refId?: number) {
  getDb().prepare("INSERT INTO activity_log (kind, message, ref_table, ref_id) VALUES (?, ?, ?, ?)")
    .run(kind, message, refTable ?? null, refId ?? null);
}

export type BuyResult = { inventoryId: number; priceCents: number; savedCents: number; cashCents: number; worthCents: number; short: string };

/** Buy a deal. Cash moves into "your stuff", so worth stays the same. */
export function buyDeal(dealId: number, priceCents?: number): BuyResult {
  const db = getDb();
  return db.transaction(() => {
    const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(dealId) as Deal | undefined;
    if (!deal) throw new LedgerError("That deal isn't here anymore.");
    if (deal.status === "bought") throw new LedgerError("You already bought this one.");
    const price = priceCents ?? deal.asking_cents;
    if (!Number.isInteger(price) || price <= 0) throw new LedgerError("Offer has to be more than $0.", "price");
    const cash = getCash();
    if (price > cash) {
      throw new LedgerError(`You need ${money(price - cash)} more. You have ${money(cash)} cash.`, "price");
    }
    const inv = db.prepare(
      `INSERT INTO inventory (deal_id, title, short_title, thumb_key, category, buy_cents, est_sell_cents, est_fees_cents, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(deal.id, deal.title, deal.short_title, deal.thumb_key, deal.category, price, deal.est_sell_cents, deal.est_fees_cents, deal.photo_url ?? null);
    const invId = Number(inv.lastInsertRowid);
    db.prepare("INSERT INTO transactions (type, amount_cents, inventory_id, note) VALUES ('buy', ?, ?, ?)")
      .run(-price, invId, `Bought ${short(deal)}`);
    db.prepare("UPDATE deals SET status = 'bought' WHERE id = ?").run(deal.id);
    const saved = deal.asking_cents - price;
    log("buy", `Bought ${short(deal)} for ${money(price)}.${saved > 0 ? ` You talked them down ${money(saved)}.` : ""}`, "inventory", invId);
    const b = getBalance();
    return { inventoryId: invId, priceCents: price, savedCents: Math.max(0, saved), cashCents: b.cash, worthCents: b.netWorth, short: short(deal) };
  })();
}

/** Watch, skip, or put a deal back. Returns the old status (for Undo). */
export function setDealStatus(dealId: number, status: "watching" | "passed" | "new"): string | null {
  return getDb().transaction(() => {
    const db = getDb();
    const deal = db.prepare("SELECT title, short_title, status FROM deals WHERE id = ?").get(dealId) as
      | { title: string; short_title: string | null; status: string } | undefined;
    if (!deal || deal.status === "bought") return null;
    db.prepare("UPDATE deals SET status = ? WHERE id = ?").run(status, dealId);
    const name = short(deal);
    if (status === "watching") log("watch", `Watching ${name}`, "deals", dealId);
    else if (status === "passed") log("pass", `Skipped ${name}`, "deals", dealId);
    else if (deal.status === "watching") log("unwatch", `Stopped watching ${name}`, "deals", dealId);
    else if (deal.status === "passed") log("unpass", `Put ${name} back`, "deals", dealId);
    return deal.status;
  })();
}

export type SellResult = {
  profitCents: number;
  netCents: number;
  cashCents: number;
  worthCents: number;
  daysHeld: number;
  /** Local day keys ("YYYY-MM-DD") the item was bought and sold, for honest "in N days" copy. */
  boughtKey: string;
  soldKey: string;
  /** Total profit from every sale, before and after this one (for the money ladder). */
  totalProfitBeforeCents: number;
  totalProfitAfterCents: number;
  /** Set when this sale reached the goal (the goal amount that was reached). */
  goalReachedCents: number | null;
};

/** Sell something you hold. Profit = sold for − fees − what you paid. */
export function sellItem(invId: number, sellCents: number, feesCents: number): SellResult {
  const db = getDb();
  return db.transaction(() => {
    const item = db.prepare("SELECT * FROM inventory WHERE id = ?").get(invId) as InventoryItem | undefined;
    if (!item) throw new LedgerError("That item isn't in your stuff.");
    if (item.status === "sold") throw new LedgerError("You already sold this one.");
    if (!Number.isInteger(sellCents) || sellCents <= 0) throw new LedgerError("Sell price has to be more than $0.", "sell");
    if (!Number.isInteger(feesCents) || feesCents < 0) throw new LedgerError("Fees can't be less than $0.", "fees");
    if (feesCents >= sellCents) throw new LedgerError("Fees have to be less than the sell price.", "fees");

    const before = getBalance();
    db.prepare("UPDATE inventory SET status = 'sold', sell_cents = ?, fees_cents = ?, sold_at = datetime('now') WHERE id = ?")
      .run(sellCents, feesCents, invId);
    db.prepare("INSERT INTO transactions (type, amount_cents, inventory_id, note) VALUES ('sell', ?, ?, ?)")
      .run(sellCents, invId, `Sold ${short(item)}`);
    if (feesCents > 0) {
      db.prepare("INSERT INTO transactions (type, amount_cents, inventory_id, note) VALUES ('fee', ?, ?, ?)")
        .run(-feesCents, invId, `Fees for ${short(item)}`);
    }
    const profit = saleProfit(item.buy_cents, sellCents, feesCents);
    log("sell",
      profit >= 0
        ? `Sold ${short(item)} for ${money(sellCents)}. Profit ${signed(profit)}.`
        : `Sold ${short(item)} for ${money(sellCents)}. Lost ${money(-profit)}.`,
      "inventory", invId);

    // Goal: when total profit reaches it, remember it and set the next one.
    const after = getBalance();
    const { goalCents } = getGoal();
    let reached: number | null = null;
    if (before.totalProfit < goalCents && after.totalProfit >= goalCents) {
      reached = goalCents;
      setSetting("goal_done_cents", String(goalCents));
      // One sale can jump past several tiers: move the goal past the new total.
      let next = nextGoal(goalCents);
      while (next <= after.totalProfit) next = nextGoal(next);
      setSetting("goal_cents", String(next));
      log("goal", `Goal done: made ${money(goalCents)} profit.`);
    }
    const soldAt = (db.prepare("SELECT sold_at FROM inventory WHERE id = ?").get(invId) as { sold_at: string }).sold_at;
    const boughtKey = dayKey(item.bought_at);
    const soldKey = dayKey(soldAt);
    return {
      profitCents: profit,
      netCents: sellCents - feesCents,
      cashCents: after.cash,
      worthCents: after.netWorth,
      daysHeld: Math.max(0, daysBetween(boughtKey, soldKey)),
      boughtKey,
      soldKey,
      totalProfitBeforeCents: before.totalProfit,
      totalProfitAfterCents: after.totalProfit,
      goalReachedCents: reached,
    };
  })();
}

export function updateItem(invId: number, notes: string, status: "holding" | "listed") {
  return getDb().transaction(() => {
    const db = getDb();
    const item = db.prepare("SELECT title, short_title, status FROM inventory WHERE id = ?").get(invId) as
      | { title: string; short_title: string | null; status: string } | undefined;
    if (!item || item.status === "sold") return;
    db.prepare("UPDATE inventory SET condition_notes = ?, status = ? WHERE id = ?").run(notes.slice(0, 2000), status, invId);
    if (status === "listed" && item.status !== "listed") log("list", `Listed ${short(item)} for sale`, "inventory", invId);
    if (status === "holding" && item.status === "listed") log("list", `Took ${short(item)} off the list`, "inventory", invId);
  })();
}

export function setListed(invId: number, listed: boolean) {
  const item = getDb().prepare("SELECT condition_notes, status FROM inventory WHERE id = ?").get(invId) as
    | { condition_notes: string; status: string } | undefined;
  if (!item) throw new LedgerError("That item isn't in your stuff.");
  if (item.status === "sold") throw new LedgerError("You already sold this one.");
  updateItem(invId, item.condition_notes, listed ? "listed" : "holding");
}

export const NOTES_MAX = 500;

export function setNotes(invId: number, notes: string) {
  return getDb().transaction(() => {
    const item = getDb().prepare("SELECT status, short_title, title FROM inventory WHERE id = ?").get(invId) as
      | { status: string; short_title: string | null; title: string } | undefined;
    if (!item) throw new LedgerError("That item isn't in your stuff.");
    const clean = notes.trim();
    if (clean.length > NOTES_MAX) throw new LedgerError(`Keep notes under ${NOTES_MAX} letters.`, "notes");
    getDb().prepare("UPDATE inventory SET condition_notes = ? WHERE id = ?").run(clean, invId);
    log("note", `Notes on ${short(item)}: ${clean || "(cleared)"}`, "inventory", invId);
  })();
}

export const LESSONS = ["Paid too much", "Fees surprised me", "Took too long to sell"] as const;

/** Save "what would you do next time?" after a loss, so the parent can see it. */
export function saveLesson(invId: number, lesson: string) {
  if (!(LESSONS as readonly string[]).includes(lesson)) throw new LedgerError("Pick one of the answers.");
  const db = getDb();
  const item = db.prepare("SELECT status FROM inventory WHERE id = ?").get(invId) as { status: string } | undefined;
  if (!item || item.status !== "sold") throw new LedgerError("That sale isn't here.");
  db.transaction(() => {
    db.prepare("DELETE FROM activity_log WHERE kind = 'lesson' AND ref_table = 'inventory' AND ref_id = ?").run(invId);
    log("lesson", lesson, "inventory", invId);
  })();
}

/** "Ask a parent" on a deal you can't afford yet. Logged for the parent. */
export function askParent(dealId: number) {
  const deal = getDb().prepare("SELECT title, short_title FROM deals WHERE id = ?").get(dealId) as
    | { title: string; short_title: string | null } | undefined;
  if (!deal) throw new LedgerError("That deal isn't here anymore.");
  log("ask", `Asked a parent about going halves on the ${short(deal)}`, "deals", dealId);
  return short(deal);
}

/** Parent tool: change the profit goal. */
export function setGoal(goalCents: number) {
  return getDb().transaction(() => {
    if (!Number.isInteger(goalCents) || goalCents <= 0) throw new LedgerError("Goal has to be more than $0.", "goal");
    setSetting("goal_cents", String(goalCents));
    getDb().prepare("DELETE FROM settings WHERE key = 'goal_done_cents'").run();
    log("goal", `New goal: make ${money(goalCents)} profit.`);
  })();
}

/** Date helper re-exported for pages. */
export { parseDbDate };
