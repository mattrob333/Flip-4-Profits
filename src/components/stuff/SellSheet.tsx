"use client";

// Sell sheet: Sold for + Fees, live profit preview (the hero). After the sale the
// sheet becomes a full-viewport takeover. Win: the item scales in (250ms), SOLD
// lands on the frame's corner, profit counts up (900ms), then the money ladder
// moves (600ms). Loss: calmer layout, same number size in coral, no stamp, and
// the lesson question (3 answers) comes first.
import * as React from "react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FieldError, MoneyInput } from "@/components/ui/money-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/toast";
import { chipClass } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import { ArrowIcon, CheckIcon, XIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { MoneyLadder } from "@/components/MoneyLadder";
import { lessonAction, sellAction } from "@/app/actions";
import { rungsCrossed } from "@/lib/ladder";
import { dayLabel } from "@/lib/dates";
import { money, parseMoney, saleProfit, signed, tri } from "@/lib/money";
import { announceMoney, prefersReducedMotion, tween } from "@/lib/motion";
import type { HoldingView, SellResult } from "@/lib/ledger";

const LESSONS = ["Paid too much", "Fees surprised me", "Took too long to sell"];

type Done = SellResult & { soldCents: number; feesCents: number };

export function SellSheet({
  item,
  open,
  onOpenChange,
}: {
  item: HoldingView;
  open: boolean;
  onOpenChange: (o: boolean) => void;
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
    announceMoney(profit >= 0 ? "profit" : "loss");
    const res = await sellAction(h.id, price, fees);
    setBusy(false);
    if (!res.ok) {
      setErrs(res.field === "fees" ? { fees: res.error } : { sell: res.error });
      return;
    }
    setDone({ ...res.data, soldCents: pr, feesCents: Math.max(0, fe) });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        aria-describedby={undefined}
        className={done ? "takeover" : undefined}
        overlayClassName={done ? "takeover-bd" : undefined}
        onOpenAutoFocus={(e) => {
        // Focus and select the price so you can type right away.
        e.preventDefault();
        const el = document.getElementById("sPrice") as HTMLInputElement | null;
        el?.focus();
        el?.select();
      }}
      >
        {done ? (
          <SoldResult item={h} done={done} />
        ) : (
          <form onSubmit={submit} noValidate className="contents">
            <div className="sh-head">
              <ProductImage kind={h.thumb} photoUrl={h.photoUrl} size={56} />
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
              </div>
              <span className="cap fields-hint" id="feesHint">
                Fees: money the selling site keeps. $0 on Craigslist and FB Marketplace.
              </span>
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
                <span className="pb-l">Sold for</span>
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

function heldCopy(days: number) {
  return days <= 0 ? "the same day you bought it" : days === 1 ? "in 1 day" : `in ${days} days`;
}

function SoldResult({ item: h, done }: { item: HoldingView; done: Done }) {
  const toast = useToast();
  const [lesson, setLesson] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const win = done.profitCents >= 0;
  const numRef = React.useRef<HTMLSpanElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const crossed = rungsCrossed(done.totalProfitBeforeCents, done.totalProfitAfterCents);
  const reduce = React.useMemo(() => prefersReducedMotion(), []);
  // Timeline: image 0-250ms, stamp 250-470ms, count 350-1250ms, ladder 1300-1900ms.
  const COUNT_AT = 350;
  const LADDER_AT = 1300;

  React.useEffect(() => {
    btnRef.current?.focus({ preventScroll: true });
    const draw = (v: number) => {
      if (numRef.current) numRef.current.textContent = signed(v);
    };
    if (reduce) {
      draw(done.profitCents);
      return;
    }
    let stop = () => {};
    const t = setTimeout(() => {
      stop = tween(0, done.profitCents, draw, 900);
    }, COUNT_AT);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, [done.profitCents, reduce]);

  async function pick(v: string) {
    if (!v) return;
    setLesson(v);
    setSaved(false);
    const res = await lessonAction(h.id, v);
    if (!res.ok) return toast(res.error, { tone: "error" });
    setSaved(true);
  }

  const dates =
    done.boughtKey === done.soldKey
      ? `Bought and sold ${dayLabel(done.soldKey)}.`
      : `Bought ${dayLabel(done.boughtKey)}, sold ${dayLabel(done.soldKey)}.`;

  const close = (
    <SheetClose className="xbtn to-x" aria-label="Close">
      <XIcon />
    </SheetClose>
  );
  const math = (
    <p className="to-math tab">
      Paid {money(h.buyCents)} · sold for {money(done.soldCents)} · {done.feesCents ? `${money(done.feesCents)} fees` : "no fees"}
    </p>
  );
  const result = (
    <div className="to-result" role="status">
      <span className={"num to-num " + (win ? "up" : "down")}>
        <span ref={numRef}>{reduce ? signed(done.profitCents) : signed(0)}</span>
        <span className="sr-only"> {signed(done.profitCents)}</span>
      </span>
      <span className={"to-lbl " + (win ? "up" : "down")}>
        {win ? "profit" : "loss"} {tri(done.profitCents)}
      </span>
    </div>
  );

  if (win) {
    // Win: big product shot with the yellow SOLD stamp on its corner, the profit
    // counting up in green, short cheer, then the money ladder moving.
    return (
      <div className="to-inner win">
        {close}
        <div className="to-frame">
          <ProductImage kind={h.thumb} photoUrl={h.photoUrl} size="hero" />
          <span className="stamp sold to-stamp">SOLD</span>
        </div>
        <SheetTitle className="to-kicker">Sold your {h.short}!</SheetTitle>
        {result}
        <h3 className="to-cheer">
          <span>Nice flip!</span> <span>You made {money(done.profitCents)} {heldCopy(done.daysHeld)}.</span>
        </h3>
        {math}
        <p className="to-p">
          {dates} Your worth is now {money(done.worthCents)}.
        </p>
        {crossed.length > 0 && (
          <p className="badge profit to-rung">
            <CheckIcon size={14} /> New rung: {crossed[crossed.length - 1].name}
          </p>
        )}
        <MoneyLadder
          profitCents={done.totalProfitAfterCents}
          fromCents={done.totalProfitBeforeCents}
          delayMs={reduce ? 0 : LADDER_AT}
          className="to-ladder"
        />
        <SheetClose asChild>
          <Button ref={btnRef} size="big" className="to-go">
            Keep flipping
          </Button>
        </SheetClose>
      </div>
    );
  }

  // Loss: calmer. No stamp and no big picture: a small thumbnail, the same size
  // number in coral, then the lesson question first.
  return (
    <div className="to-inner lose">
      {close}
      <div className="to-item">
        <ProductImage kind={h.thumb} photoUrl={h.photoUrl} size={56} />
        <SheetTitle className="to-kicker">Sold your {h.short}</SheetTitle>
      </div>
      {result}
      {math}
      <div className="to-lesson">
        <h3 id="lessonQ">What would you do next time?</h3>
        <ToggleGroup type="single" className="lesson" value={lesson} onValueChange={pick} aria-labelledby="lessonQ">
          {LESSONS.map((l) => (
            <ToggleGroupItem key={l} value={l} className={cn(chipClass, "bg-s2 hover:bg-s3")}>
              {lesson === l && <CheckIcon />}
              {l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="to-saved" role="status">
          {saved ? "Saved to your log. You can talk it over with your parent." : ""}
        </p>
      </div>
      <p className="to-p to-calm">
        <span>You lost {money(-done.profitCents)} on this&nbsp;one.</span> <span>Every flipper&nbsp;does.</span>
      </p>
      <SheetClose asChild>
        <Button ref={btnRef} size="big" className="to-go">
          Got it
        </Button>
      </SheetClose>
    </div>
  );
}
