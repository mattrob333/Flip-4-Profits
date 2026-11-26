import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed, seedDemo } from "./seed";

// All money is stored as whole cents (integers) so math never drifts.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Deals found by Scout (mock for now, scrapers in step 2).
CREATE TABLE IF NOT EXISTS deals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,             -- ebikes | tools | consoles | cards | electronics
  source          TEXT NOT NULL,             -- craigslist | facebook | ebay | retail | mock
  url             TEXT,
  emoji           TEXT NOT NULL DEFAULT '',  -- legacy, not shown (no emoji in the UI)
  short_title     TEXT,                       -- short name for rows ("DeWalt drill combo")
  thumb_key       TEXT,                       -- drawn tile: drill | ebike | handheld | blower | binder | earbuds | consolebox | box
  asking_cents    INTEGER NOT NULL,
  est_sell_cents  INTEGER NOT NULL,
  est_fees_cents  INTEGER NOT NULL DEFAULT 0,
  score           INTEGER NOT NULL DEFAULT 0, -- 0-100
  distance_mi     REAL,
  risk_flags      TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  why             TEXT,                       -- short "why this scored X" explanation
  status          TEXT NOT NULL DEFAULT 'new', -- new | watching | bought | passed
  lane            TEXT NOT NULL DEFAULT 'scout', -- scout (saved searches) | wildcard (any cheap item AI matched to comps)
  match_confidence REAL,                       -- 0-1, how sure the AI is about the comp match (wildcard)
  sell_through_pct REAL,                       -- from market data at scoring time
  days_to_sell    REAL,
  search_id       INTEGER REFERENCES saved_searches(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Things he owns right now (or used to own).
CREATE TABLE IF NOT EXISTS inventory (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  deal_id         INTEGER REFERENCES deals(id),
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,
  emoji           TEXT NOT NULL DEFAULT '',  -- legacy, not shown
  short_title     TEXT,
  thumb_key       TEXT,
  buy_cents       INTEGER NOT NULL,
  est_sell_cents  INTEGER NOT NULL,
  est_fees_cents  INTEGER NOT NULL DEFAULT 0,
  condition_notes TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'holding', -- holding | listed | sold
  sell_cents      INTEGER,
  fees_cents      INTEGER,
  bought_at       TEXT NOT NULL DEFAULT (datetime('now')),
  sold_at         TEXT
);

-- The ledger. Cash on hand = SUM(amount_cents). Buys are negative, sells positive.
CREATE TABLE IF NOT EXISTS transactions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL,              -- deposit | buy | sell | fee | adjust
  amount_cents  INTEGER NOT NULL,
  inventory_id  INTEGER REFERENCES inventory(id),
  note          TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Everything that happens, for the feed and (later) parent review.
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT NOT NULL,                -- start | scout | watch | unwatch | pass | unpass | buy | sell | note | list | lesson | ask | goal
  message     TEXT NOT NULL,
  ref_table   TEXT,
  ref_id      INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Searches Scout runs on a schedule (e.g. "e-bike", "dewalt 20v", "pokemon binder").
CREATE TABLE IF NOT EXISTS saved_searches (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  query       TEXT NOT NULL,
  category    TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Nightly eBay sold-data snapshot per saved search, for the "Hot right now" list.
CREATE TABLE IF NOT EXISTS market_snapshots (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id           INTEGER NOT NULL REFERENCES saved_searches(id),
  taken_on            TEXT NOT NULL,              -- YYYY-MM-DD
  sold_count_7d       INTEGER NOT NULL DEFAULT 0, -- weekly velocity
  active_count        INTEGER NOT NULL DEFAULT 0,
  sell_through_pct    REAL,                       -- sold / (sold + active)
  median_sold_cents   INTEGER,
  median_days_to_sell REAL,
  UNIQUE (search_id, taken_on)
);

CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
`;

// Columns added after the first schema. Old databases get them on open.
const ADDED_COLUMNS: [table: string, column: string, ddl: string][] = [
  ["deals", "short_title", "TEXT"],
  ["deals", "thumb_key", "TEXT"],
  ["inventory", "short_title", "TEXT"],
  ["inventory", "thumb_key", "TEXT"],
  ["inventory", "est_fees_cents", "INTEGER NOT NULL DEFAULT 0"],
];

function migrate(db: Database.Database) {
  for (const [table, column, ddl] of ADDED_COLUMNS) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

const globalForDb = globalThis as unknown as { __flipDb?: Database.Database };

export function dataDir() {
  return process.env.DATA_DIR ?? path.join(process.cwd(), "data");
}

function open(): Database.Database {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "flip.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 3000");
  db.exec(SCHEMA);
  migrate(db);
  const seeded = db.prepare("SELECT value FROM settings WHERE key = 'seeded'").get();
  if (!seeded) seed(db);
  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__flipDb) globalForDb.__flipDb = open();
  return globalForDb.__flipDb;
}

/** Close the shared connection (tests and scripts). */
export function closeDb() {
  globalForDb.__flipDb?.close();
  globalForDb.__flipDb = undefined;
}

/**
 * Wipe everything and start over.
 * "fresh" = $500 and the 7 sample deals. "demo" = the mid-game sample.
 */
export function resetDb(mode: "fresh" | "demo" = "fresh") {
  const db = getDb();
  db.transaction(() => {
    for (const t of ["activity_log", "transactions", "inventory", "deals", "market_snapshots", "saved_searches", "settings"]) {
      db.prepare(`DELETE FROM ${t}`).run();
    }
    db.prepare("DELETE FROM sqlite_sequence").run();
  })();
  if (mode === "demo") seedDemo(db);
  else seed(db);
}
