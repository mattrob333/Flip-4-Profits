"use server";

import { revalidatePath } from "next/cache";
import {
  askParent, buyDeal, LedgerError, saveLesson, sellItem, setDealStatus, setGoal, setListed, setNotes,
  type BuyResult, type SellResult,
} from "@/lib/ledger";
import { parseMoney } from "@/lib/money";

/** Every action answers with ok + data, or an error (with the field it belongs under). */
export type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

function refresh() {
  revalidatePath("/", "layout");
}

function fail(e: unknown): { ok: false; error: string; field?: string } {
  if (e instanceof LedgerError) return { ok: false, error: e.message, field: e.field };
  console.error(e);
  return { ok: false, error: "Something went wrong. Your money is safe. Try again." };
}

function id(v: unknown) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : NaN;
}

export async function buyAction(dealId: number, offer: string): Promise<Result<BuyResult>> {
  try {
    const price = offer.trim() === "" ? undefined : parseMoney(offer);
    if (price !== undefined && !Number.isFinite(price)) return { ok: false, error: "Type a number, like 80.", field: "price" };
    const data = buyDeal(id(dealId), price);
    refresh();
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

export async function sellAction(itemId: number, sold: string, fees: string): Promise<Result<SellResult>> {
  try {
    const sell = parseMoney(sold);
    const fee = fees.trim() === "" ? 0 : parseMoney(fees);
    if (!Number.isFinite(sell)) return { ok: false, error: "Type a number, like 65.", field: "sell" };
    if (!Number.isFinite(fee)) return { ok: false, error: "Type a number, like 0.", field: "fees" };
    const data = sellItem(id(itemId), sell, fee);
    refresh();
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

export async function watchAction(dealId: number, on: boolean): Promise<Result> {
  try {
    setDealStatus(id(dealId), on ? "watching" : "new");
    refresh();
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

/** Skip a deal. Returns the old status so Undo can put it back exactly. */
export async function skipAction(dealId: number): Promise<Result<{ prev: string | null }>> {
  try {
    const prev = setDealStatus(id(dealId), "passed");
    refresh();
    return { ok: true, data: { prev } };
  } catch (e) {
    return fail(e);
  }
}

export async function undoSkipAction(dealId: number, prev: string | null): Promise<Result> {
  try {
    setDealStatus(id(dealId), prev === "watching" ? "watching" : "new");
    refresh();
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function askParentAction(dealId: number): Promise<Result<{ short: string }>> {
  try {
    const short = askParent(id(dealId));
    refresh();
    return { ok: true, data: { short } };
  } catch (e) {
    return fail(e);
  }
}

export async function listedAction(itemId: number, listed: boolean): Promise<Result> {
  try {
    setListed(id(itemId), listed);
    refresh();
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function notesAction(itemId: number, notes: string): Promise<Result> {
  try {
    setNotes(id(itemId), String(notes ?? ""));
    refresh();
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function lessonAction(itemId: number, lesson: string): Promise<Result> {
  try {
    saveLesson(id(itemId), lesson);
    refresh();
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}

export async function goalAction(amount: string): Promise<Result> {
  try {
    const cents = parseMoney(amount);
    if (!Number.isFinite(cents)) return { ok: false, error: "Type a number, like 100.", field: "goal" };
    setGoal(cents);
    refresh();
    return { ok: true, data: undefined };
  } catch (e) {
    return fail(e);
  }
}
