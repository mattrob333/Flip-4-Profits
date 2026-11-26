import type Database from "better-sqlite3";
import { dbTime } from "./dates";

export const STARTING_BANKROLL_CENTS = Number(process.env.STARTING_BANKROLL_CENTS ?? 50000);
export const DEFAULT_GOAL_CENTS = 10000; // "Make $100 profit"

type SampleDeal = {
  key: string;
  title: string;
  short: string;
  category: string;
  source: string;
  thumb: string;
  asking: number; // dollars, for readability here
  sell: number;
  fees: number;
  score: number;
  distance: number;
  flags: string[];
  why: string;
};

// The 7 sample deals from the brief, so the app works before scraping exists.
// Atlanta / Alpharetta area.
export const SAMPLE_DEALS: SampleDeal[] = [
  {
    key: "drill", title: "DeWalt 20V drill + impact driver combo", short: "DeWalt drill combo",
    category: "tools", source: "craigslist", thumb: "drill",
    asking: 90, sell: 160, fees: 0, score: 82, distance: 6.2,
    flags: ["Check battery charge"],
    why: "Big markup and close by. Tools sell fast around here.",
  },
  {
    key: "ebike", title: "Lectric XP 3.0 e-bike", short: "Lectric XP 3.0 e-bike",
    category: "ebikes", source: "facebook", thumb: "ebike",
    asking: 520, sell: 780, fees: 0, score: 77, distance: 14.8,
    flags: ["Battery health unknown", "Bring a parent"],
    why: "Biggest profit on the board, but it ties up almost all your cash.",
  },
  {
    key: "switch", title: "Nintendo Switch OLED + 2 games", short: "Switch OLED + 2 games",
    category: "consoles", source: "facebook", thumb: "handheld",
    asking: 210, sell: 285, fees: 0, score: 74, distance: 11.5,
    flags: ["Test Joy-Con drift"],
    why: "Switches sell in days. Test the controllers before you pay.",
  },
  {
    key: "blower", title: "Ryobi 18V leaf blower", short: "Ryobi leaf blower",
    category: "tools", source: "craigslist", thumb: "blower",
    asking: 35, sell: 65, fees: 0, score: 71, distance: 3.1,
    flags: [],
    why: "Cheap, 3 miles away, and fall is leaf season.",
  },
  {
    key: "cards", title: "Pokémon TCG binder, about 150 cards", short: "Pokémon binder (150)",
    category: "cards", source: "craigslist", thumb: "binder",
    asking: 60, sell: 140, fees: 18, score: 69, distance: 4.0,
    flags: ["Check for fakes", "Condition varies"],
    why: "Could hide a few good cards. Fakes are common, so check closely.",
  },
  {
    key: "airpods", title: "AirPods Pro 2, open box", short: "AirPods Pro 2 (open box)",
    category: "electronics", source: "facebook", thumb: "earbuds",
    asking: 95, sell: 150, fees: 20, score: 58, distance: 8.7,
    flags: ["Could be counterfeit", "New seller"],
    why: "Fair price, but fakes are everywhere and the seller is brand new.",
  },
  {
    key: "ps4", title: "PS4 Slim 1TB", short: "PS4 Slim 1TB",
    category: "consoles", source: "craigslist", thumb: "consolebox",
    asking: 120, sell: 150, fees: 0, score: 48, distance: 19,
    flags: ["Older console", "Thin margin"],
    why: "Small profit for a 19-mile drive. Older consoles sell slowly.",
  },
];

/** Kept for older callers. */
export const MOCK_DEALS = SAMPLE_DEALS;

function insertDeals(db: Database.Database, at: string) {
  const ins = db.prepare(`INSERT INTO deals
    (title, short_title, thumb_key, category, source, asking_cents, est_sell_cents, est_fees_cents,
     score, distance_mi, risk_flags, why, lane, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scout', ?)`);
  const ids: Record<string, number> = {};
  for (const d of SAMPLE_DEALS) {
    const r = ins.run(d.title, d.short, d.thumb, d.category, d.source, d.asking * 100, d.sell * 100,
      d.fees * 100, d.score, d.distance, JSON.stringify(d.flags), d.why, at);
    ids[d.key] = Number(r.lastInsertRowid);
  }
  return ids;
}

function setSetting(db: Database.Database, key: string, value: string) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

/** Fresh start: $500 cash, the 7 sample deals, nothing bought. */
export function seed(db: Database.Database) {
  db.transaction(() => {
    const now = dbTime();
    db.prepare("INSERT INTO transactions (type, amount_cents, note, created_at) VALUES ('deposit', ?, ?, ?)")
      .run(STARTING_BANKROLL_CENTS, "Started with $" + STARTING_BANKROLL_CENTS / 100, now);
    db.prepare("INSERT INTO activity_log (kind, message, created_at) VALUES ('start', ?, ?)")
      .run(`Started with $${STARTING_BANKROLL_CENTS / 100} in practice cash.`, now);
    insertDeals(db, now);
    setSetting(db, "mode", "virtual");
    setSetting(db, "goal_cents", String(DEFAULT_GOAL_CENTS));
    setSetting(db, "seeded", "fresh");
  })();
}

/**
 * Mid-game sample from the brief: bought the drill for $80 (talked them down $10)
 * and sold it for $155, now holding the leaf blower bought for $35.
 * Cash $540, stuff $35, worth $575, profit +$75.
 */
export function seedDemo(db: Database.Database) {
  const ago = (days: number, hour = 0) => {
    const d = new Date(Date.now() - days * 86400000 - hour * 3600000);
    return dbTime(d);
  };
  db.transaction(() => {
    const start = ago(5, 3);
    db.prepare("INSERT INTO transactions (type, amount_cents, note, created_at) VALUES ('deposit', ?, ?, ?)")
      .run(STARTING_BANKROLL_CENTS, "Started with $" + STARTING_BANKROLL_CENTS / 100, start);
    db.prepare("INSERT INTO activity_log (kind, message, created_at) VALUES ('start', ?, ?)")
      .run(`Started with $${STARTING_BANKROLL_CENTS / 100} in practice cash.`, start);

    const ids = insertDeals(db, ago(0, 0));
    db.prepare("UPDATE deals SET status = 'bought' WHERE id IN (?, ?)").run(ids.drill, ids.blower);

    // Drill: bought $80 five days ago, sold $155 three days ago.
    const drill = SAMPLE_DEALS[0];
    const boughtDrill = ago(5, 1);
    const soldDrill = ago(3, 0);
    const inv1 = Number(db.prepare(`INSERT INTO inventory
      (deal_id, title, short_title, thumb_key, category, buy_cents, est_sell_cents, est_fees_cents, condition_notes, status, sell_cents, fees_cents, bought_at, sold_at)
      VALUES (?, ?, ?, ?, ?, 8000, 16000, 0, ?, 'sold', 15500, 0, ?, ?)`)
      .run(ids.drill, drill.title, drill.short, drill.thumb, drill.category,
        "Both batteries charge. Some paint wear on the drill.", boughtDrill, soldDrill).lastInsertRowid);
    db.prepare("INSERT INTO transactions (type, amount_cents, inventory_id, note, created_at) VALUES ('buy', -8000, ?, ?, ?)")
      .run(inv1, "Bought " + drill.short, boughtDrill);
    db.prepare("INSERT INTO activity_log (kind, message, ref_table, ref_id, created_at) VALUES ('buy', ?, 'inventory', ?, ?)")
      .run(`Bought ${drill.short} for $80. You talked them down $10.`, inv1, boughtDrill);
    db.prepare("INSERT INTO transactions (type, amount_cents, inventory_id, note, created_at) VALUES ('sell', 15500, ?, ?, ?)")
      .run(inv1, "Sold " + drill.short, soldDrill);
    db.prepare("INSERT INTO activity_log (kind, message, ref_table, ref_id, created_at) VALUES ('sell', ?, 'inventory', ?, ?)")
      .run(`Sold ${drill.short} for $155. Profit +$75.`, inv1, soldDrill);

    // Leaf blower: bought $35 two days ago, still holding.
    const blower = SAMPLE_DEALS[3];
    const boughtBlower = ago(2, 0);
    const inv2 = Number(db.prepare(`INSERT INTO inventory
      (deal_id, title, short_title, thumb_key, category, buy_cents, est_sell_cents, est_fees_cents, condition_notes, status, bought_at)
      VALUES (?, ?, ?, ?, ?, 3500, 6500, 0, ?, 'holding', ?)`)
      .run(ids.blower, blower.title, blower.short, blower.thumb, blower.category,
        "Works great. One scuff on the tube, battery holds a charge.", boughtBlower).lastInsertRowid);
    db.prepare("INSERT INTO transactions (type, amount_cents, inventory_id, note, created_at) VALUES ('buy', -3500, ?, ?, ?)")
      .run(inv2, "Bought " + blower.short, boughtBlower);
    db.prepare("INSERT INTO activity_log (kind, message, ref_table, ref_id, created_at) VALUES ('buy', ?, 'inventory', ?, ?)")
      .run(`Bought ${blower.short} for $35.`, inv2, boughtBlower);

    setSetting(db, "mode", "virtual");
    setSetting(db, "goal_cents", String(DEFAULT_GOAL_CENTS));
    setSetting(db, "seeded", "demo");
  })();
}
