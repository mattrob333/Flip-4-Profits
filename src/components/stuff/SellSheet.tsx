"use client";

// Sell sheet: Sold for + Fees, live profit preview (the hero), then the reward:
// SOLD stamp + count-up, or a loss shown as a lesson with 3 answers to save.
import * as React from "react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FieldError, MoneyInput } from "@/components/ui/money-input";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/toast";
import { chipClass } from "@/components/ui/chip";
import { ArrowIcon, CheckIcon, XIcon } from "@/components/Icons";
import { Thumb } from "@/components/Thumb";
import { GoalBar } from "@/components/GoalBar";
import { lessonAction, sellAction } from "@/app/actions";
import { goalInfo } from "@/lib/goal";
import { money, nextGoal, parseMoney, saleProfit, signed, tri } from "@/lib/money";
import { announceMoney } from "@/lib/motion";
import type { HoldingView, SellResult } from "@/lib/ledger";
import type { GoalState } from "./StuffView";

const LESSONS = ["Paid too much", "Fees surprised me", "Took too long to sell"];

type Done = SellResult & { soldCents: number; feesCents: number; goalBefore: GoalState };

export function SellSheet({
  item,
  open,
  onOpenChange,
  goal,
}: {
  item: HoldingView;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  goal: GoalState;
}) {
  // StuffView mounts a new sheet per item (key), so the form starts fresh.
  const [price, setPrice] = React.useState(String(item.estSellCents / 100));
  const [fees, setFees] = React.useState(String(item.estFeesCents / 100));
  const [errs, setErrs] = React.useState<{ sell?: string; fees?: string }>({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<Done | null>(null);
  const [touched, setTouched] = React.useState(false);

  const h = item;
  const pr = parseMoney(price);
  const fe = fees.trim() === "" ? 0 : parseMoney(fees);
  const priceBad = !(pr > 0);
  const feesBad = !Number.isFinite(fe) || fe < 0 || (!priceBad && fe >= pr);
  const profit = saleProfit(h.buyCents, priceBad ? 0 : pr, Number.isFinite(fe) ? Math.max(0, fe) : 0);
  const priceErr = errs.sell ?? (touched && priceBad ? "Sell price has to be more than $0." : undefined);
  const feesErr =
    errs.fees ??
    (touched && feesBad
      ? !Number.isFinite(fe) || fe < 0
        ? "Fees can't be less than $0."
        : "Fees have to be less than the sell price."
      : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (priceBad || feesBad || busy) return;
    setBusy(true);
    const before = goal;
    announceMoney(profit >= 0 ? "profit" : "loss");
    const res = await sellAction(h.id, price, fees);
    setBusy(false);
    if (!res.ok) {
      setErrs(res.field === "fees" ? { fees: res.error } : { sell: res.error });
      return;
    }
    setDone({ ...res.data, soldCents: pr, feesCents: Math.max(0, fe), goalBefore: before });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} onOpenAutoFocus={(e) => {
        // Focus and select the price so you can type right away.
        e.preventDefault();
        const el = document.getElementById("sPrice") as HTMLInputElement | null;
        el?.focus();
        el?.select();
      }}>
        {done ? (
          <SoldResult item={h} done={done} />
        ) : (
          <form onSubmit={submit} noValidate className="contents">
            <div className="sh-head">
              <Thumb kind={h.thumb} category={h.category} size={48} />
              <SheetTitle>Sell your {h.short}</SheetTitle>
              <SheetClose className="xbtn" aria-label="Close">
                <XIcon />
              </SheetClose>
            </div>
            <div className="fields">
              <div className="field">
                <label htmlFor="sPrice">Sold for</label>
                <MoneyInput
                  id="sPrice"
                  value={price}
                  invalid={!!priceErr}
                  aria-describedby={priceErr ? "sPriceErr" : undefined}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setErrs({});
                    setTouched(true);
                  }}
                />
                <FieldError id="sPriceErr">{priceErr}</FieldError>
              </div>
              <div className="field">
                <label htmlFor="sFees">Fees</label>
                <MoneyInput
                  id="sFees"
                  value={fees}
                  invalid={!!feesErr}
                  aria-describedby={feesErr ? "sFeesErr feesHint" : "feesHint"}
                  onChange={(e) => {
                    setFees(e.target.value);
                    setErrs({});
                    setTouched(true);
                  }}
                />
                <FieldError id="sFeesErr">{feesErr}</FieldError>
                <span className="cap" id="feesHint">
                  Money the selling site keeps. $0 on Craigslist.
                </span>
              </div>
            </div>
            <div className="spread">
              <div className="pb">
                <span className="pb-l">You paid</span>
                <span className="num">{money(h.buyCents)}</span>
              </div>
              <span className="sp-arrow">
                <ArrowIcon />
              </span>
              <div className="pb sell">
                <span className="pb-l">Selling for</span>
                <span className="num">{money(priceBad ? 0 : pr)}</span>
              </div>
            </div>
            <div className="tk-profit" aria-live="polite">
              <span className={"num big " + (profit >= 0 ? "up" : "down")}>{signed(profit)}</span>
              <span className={"lbl " + (profit >= 0 ? "up" : "down")}>
                {profit >= 0 ? "profit" : "loss"} {tri(profit)}
              </span>
              <span className="fees">after {money(Number.isFinite(fe) ? Math.max(0, fe) : 0)} fees</span>
            </div>
            <Button type="submit" size="big" disabled={busy || priceBad || feesBad}>
              Sell for {money(priceBad ? 0 : pr)}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SoldResult({ item: h, done }: { item: HoldingView; done: Done }) {
  const toast = useToast();
  const [lesson, setLesson] = React.useState("");
  const win = done.profitCents >= 0;
  const days = done.daysHeld;
  const g = done.goalBefore;
  const totalAfter = g.totalProfitCents + done.profitCents;
  const crossed = done.goalReachedCents != null;
  const after = crossed
    ? goalInfo({ flips: g.flips + 1, totalProfitCents: totalAfter, goalCents: nextGoal(g.goalCents), doneCents: g.goalCents })
    : goalInfo({ flips: g.flips + 1, totalProfitCents: totalAfter, goalCents: g.goalCents, doneCents: g.doneCents });
  const before = goalInfo(g);

  async function pick(v: string) {
    if (!v) return;
    setLesson(v);
    const res = await lessonAction(h.id, v);
    if (!res.ok) return toast(res.error, { tone: "error" });
    toast("Saved to your log. Good flippers learn from these.");
  }

  return (
    <>
      <div className="sh-head">
        <Thumb kind={h.thumb} category={h.category} size={48} />
        <SheetTitle>{win ? "Sold!" : "Sold, at a loss"}</SheetTitle>
        <SheetClose className="xbtn" aria-label="Close">
          <XIcon />
        </SheetClose>
      </div>
      {win && (
        <span className="stamp sold" style={{ top: 76, right: 24 }}>
          SOLD
        </span>
      )}
      <div className="result" role="status">
        <NumberTicker value={done.profitCents} from={0} format="signed" className={"big " + (win ? "up" : "down")} kind={win ? "profit" : "loss"} />
        <span className={win ? "up" : "down"} style={{ fontWeight: 700, marginTop: -4 }}>
          {win ? "profit" : "loss"} {tri(done.profitCents)} · paid {money(h.buyCents)}, sold {money(done.soldCents)}
          {done.feesCents ? `, ${money(done.feesCents)} fees` : ""}
        </span>
        {win ? (
          <>
            <h3>
              Nice flip. You made {money(done.profitCents)} in {days <= 0 ? "one day" : days === 1 ? "1 day" : `${days} days`}.
            </h3>
            <p>
              {money(done.netCents)} went into your cash. Your worth is now {money(done.worthCents)}.
            </p>
          </>
        ) : (
          <>
            <h3>You lost {money(-done.profitCents)} on this one. Every flipper does.</h3>
            <p>What would you do next time? Your answer is saved so you can talk it over with your parent.</p>
            <ToggleGroup type="single" className="lesson" value={lesson} onValueChange={pick} aria-label="What would you do next time?">
              {LESSONS.map((l) => (
                <ToggleGroupItem key={l} value={l} className={chipClass}>
                  {lesson === l && <CheckIcon />}
                  {l}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )}
        {crossed ? (
          <div className="goalrow">
            <span className="up flex items-center gap-2 font-bold">
              <CheckIcon /> Goal done: first {money(done.goalReachedCents ?? 0)} profit
            </span>
            <GoalBar val={before.max} max={before.max} from={before.val} label={before.title} />
            <span className="cap text-t2">
              Next goal: {after.title}. {after.left}.
            </span>
          </div>
        ) : (
          win && (
            <div className="w-full">
              <div className="cap mb-1.5">{after.title}</div>
              <GoalBar val={after.val} max={after.max} from={g.flips === 0 ? 0 : before.val} label={after.title} />
            </div>
          )
        )}
        <SheetClose asChild>
          <Button size="big" className="mt-2">
            {win ? "Keep flipping" : "Got it"}
          </Button>
        </SheetClose>
      </div>
    </>
  );
}
