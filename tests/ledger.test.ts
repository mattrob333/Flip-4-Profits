// Ledger math tests. Run with: npm test
// Each test gets a fresh database in a temp folder (DATA_DIR).
import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { resetDb, closeDb, getDb } from "../src/lib/db";
import * as L from "../src/lib/ledger";
import { dealProfit, saleProfit, parseMoney, signed, money } from "../src/lib/money";
import { goalInfo } from "../src/lib/goal";

// The database opens lazily on first use, so this runs before it is created.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "flip-test-"));
process.env.DATA_DIR = dir;

function dealId(short: string) {
  const r = getDb().prepare("SELECT id FROM deals WHERE short_title = ?").get(short) as { id: number };
  return r.id;
}

beforeEach(() => resetDb("fresh"));
after(() => {
  closeDb();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("fresh start: $500 cash, 7 deals, worth $500, no profit", () => {
  const b = L.getBalance();
  assert.equal(b.cash, 50000);
  assert.equal(b.netWorth, 50000);
  assert.equal(b.totalProfit, 0);
  assert.equal(b.flips, 0);
  assert.equal(L.listDeals().length, 7);
  assert.equal(L.getGoal().goalCents, 10000);
});

test("buy can't cost more than your cash", () => {
  const ebike = dealId("Lectric XP 3.0 e-bike"); // $520 > $500
  assert.throws(() => L.buyDeal(ebike), (e: unknown) => e instanceof L.LedgerError && /\$20 more/.test((e as Error).message));
  assert.equal(L.getBalance().cash, 50000, "cash did not move");
  assert.equal(L.listHoldings().length, 0);
  // An offer you can afford works.
  L.buyDeal(ebike, 49000);
  assert.equal(L.getBalance().cash, 1000);
});

test("buy rejects $0 and negative offers", () => {
  const drill = dealId("DeWalt drill combo");
  assert.throws(() => L.buyDeal(drill, 0), L.LedgerError);
  assert.throws(() => L.buyDeal(drill, -500), L.LedgerError);
  assert.equal(L.getBalance().cash, 50000);
});

test("buying keeps worth flat: cash moves into your stuff", () => {
  const before = L.getBalance();
  const r = L.buyDeal(dealId("DeWalt drill combo"), 8000);
  const b = L.getBalance();
  assert.equal(b.cash, 42000);
  assert.equal(b.inventoryCost, 8000);
  assert.equal(b.netWorth, before.netWorth);
  assert.equal(r.worthCents, 50000);
  assert.equal(r.savedCents, 1000, "talked them down $10");
  // Worth chart for today is flat too.
  const series = L.getWorthSeries();
  assert.equal(series[series.length - 1].worthCents, 50000);
  // Can't buy the same deal twice.
  assert.throws(() => L.buyDeal(dealId("DeWalt drill combo")), L.LedgerError);
});

test("sell: profit = sold for − fees − paid, and cash gets the net", () => {
  const { inventoryId } = L.buyDeal(dealId("Pokémon binder (150)"), 6000);
  const r = L.sellItem(inventoryId, 14000, 1800);
  assert.equal(r.profitCents, 6200);
  assert.equal(saleProfit(6000, 14000, 1800), 6200);
  const b = L.getBalance();
  assert.equal(b.cash, 50000 - 6000 + 14000 - 1800);
  assert.equal(b.totalProfit, 6200);
  assert.equal(b.netWorth, 50000 + 6200);
  assert.equal(b.flips, 1);
  // The ledger shows the sale and its fee as one net line.
  const ledger = L.getLedger();
  const sale = ledger.find((e) => e.kind === "sell")!;
  assert.equal(sale.amountCents, 12200);
  assert.equal(sale.cashAfterCents, b.cash);
  assert.equal(ledger[ledger.length - 1].cashAfterCents, b.cash);
});

test("sell validation: price > $0, fees >= $0 and below price", () => {
  const { inventoryId } = L.buyDeal(dealId("Ryobi leaf blower"));
  assert.throws(() => L.sellItem(inventoryId, 0, 0), (e: unknown) => (e as InstanceType<typeof L.LedgerError>).field === "sell");
  assert.throws(() => L.sellItem(inventoryId, 5000, -1), (e: unknown) => (e as InstanceType<typeof L.LedgerError>).field === "fees");
  assert.throws(() => L.sellItem(inventoryId, 5000, 5000), (e: unknown) => (e as InstanceType<typeof L.LedgerError>).field === "fees");
  L.sellItem(inventoryId, 5000, 0);
  assert.throws(() => L.sellItem(inventoryId, 5000, 0), L.LedgerError, "can't sell twice");
});

test("a loss lowers worth honestly and can save a lesson", () => {
  const { inventoryId } = L.buyDeal(dealId("Ryobi leaf blower")); // $35
  const r = L.sellItem(inventoryId, 2000, 0);
  assert.equal(r.profitCents, -1500);
  const b = L.getBalance();
  assert.equal(b.totalProfit, -1500);
  assert.equal(b.netWorth, 48500);
  L.saveLesson(inventoryId, "Paid too much");
  const row = getDb().prepare("SELECT message FROM activity_log WHERE kind = 'lesson' AND ref_id = ?").get(inventoryId) as { message: string };
  assert.equal(row.message, "Paid too much");
  assert.throws(() => L.saveLesson(inventoryId, "made up"), L.LedgerError);
  assert.match(L.getLedger().find((e) => e.kind === "sell")!.note, /Lesson: Paid too much/);
});

test("total and week profit add up wins and losses", () => {
  const a = L.buyDeal(dealId("DeWalt drill combo"), 8000);
  L.sellItem(a.inventoryId, 15500, 0); // +75
  const c = L.buyDeal(dealId("Ryobi leaf blower")); // 35
  L.sellItem(c.inventoryId, 2500, 0); // −10
  const b = L.getBalance();
  assert.equal(b.totalProfit, 6500);
  assert.equal(b.weekProfit, 6500);
  // A sale older than 7 days leaves "this week".
  getDb().prepare("UPDATE inventory SET sold_at = datetime('now','-10 days') WHERE id = ?").run(a.inventoryId);
  const b2 = L.getBalance();
  assert.equal(b2.totalProfit, 6500);
  assert.equal(b2.weekProfit, -1000);
  assert.equal(b2.bestFlip?.profit, 7500);
});

test("goal: reaching $100 profit sets the next goal", () => {
  const a = L.buyDeal(dealId("Switch OLED + 2 games")); // 210
  const r = L.sellItem(a.inventoryId, 32000, 0); // +110
  assert.equal(r.goalReachedCents, 10000);
  assert.equal(L.getGoal().goalCents, 25000);
  const g = goalInfo({ flips: 1, totalProfitCents: 11000, ...L.getGoal() });
  assert.equal(g.title, "Make $250 profit");
  assert.equal(g.justDone, "first $100");
});

test("skip and undo put the deal back", () => {
  const id = dealId("PS4 Slim 1TB");
  L.setDealStatus(id, "watching");
  const prev = L.setDealStatus(id, "passed");
  assert.equal(prev, "watching");
  assert.equal(L.listDeals().some((d) => d.id === id), false);
  L.setDealStatus(id, "watching");
  assert.equal(L.listDeals().find((d) => d.id === id)?.status, "watching");
});

test("demo seed matches the brief: cash $540, stuff $35, worth $575, profit +$75", () => {
  resetDb("demo");
  const b = L.getBalance();
  assert.equal(b.cash, 54000);
  assert.equal(b.inventoryCost, 3500);
  assert.equal(b.netWorth, 57500);
  assert.equal(b.totalProfit, 7500);
  assert.equal(L.listDeals().length, 5);
  const ledger = L.getLedger();
  assert.deepEqual(ledger.map((e) => e.cashAfterCents), [50000, 42000, 57500, 54000]);
  assert.equal(ledger[1].note, "You talked them down $10");
  const series = L.getWorthSeries();
  assert.equal(series[series.length - 1].worthCents, 57500);
});

test("money helpers", () => {
  assert.equal(dealProfit(9000, 16000, 0), 7000);
  assert.equal(parseMoney("$1,234.50"), 123450);
  assert.ok(Number.isNaN(parseMoney("abc")));
  assert.ok(Number.isNaN(parseMoney("")));
  assert.equal(signed(-1200), "−$12");
  assert.equal(signed(7500), "+$75");
  assert.equal(money(1250), "$12.50");
});
