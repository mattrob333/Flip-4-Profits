"use client";

// The deal ticket (StockX anchor): YOU PAY → SELLS FOR pair, profit as the hero,
// flags, why, offer input, then Buy / Watch / Skip.
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, MoneyInput } from "@/components/ui/money-input";
import { useToast } from "@/components/ui/toast";
import { ArrowIcon, BookmarkIcon, TriIcon, XIcon } from "@/components/Icons";
import { Thumb } from "@/components/Thumb";
import { Score } from "@/components/Score";
import { askParentAction, buyAction, skipAction, undoSkipAction, watchAction } from "@/app/actions";
import { ALL_IN_SHARE, cashShare, money, parseMoney, signed, suggestedOffer, tri } from "@/lib/money";
import { announceMoney, prefersReducedMotion } from "@/lib/motion";
import type { DealView } from "@/lib/ledger";

export function DealTicket({
  deal: d,
  ctx,
  cashCents,
  offer,
  setOffer,
  onUndoSkip,
}: {
  deal: DealView;
  ctx: "side" | "inline";
  cashCents: number;
  offer: string;
  setOffer: (v: string) => void;
  onUndoSkip: (id: number) => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = React.useState(false);
  const [hint, setHint] = React.useState(false);
  const [stamped, setStamped] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [serverErr, setServerErr] = React.useState<string | null>(null);
  const payRef = React.useRef<HTMLSpanElement>(null);
  const buyRef = React.useRef<HTMLButtonElement>(null);

  const off = parseMoney(offer);
  const bad = !(off > 0);
  const pay = bad ? d.askingCents : off;
  const profit = d.sellCents - pay - d.feesCents;
  const watching = d.status === "watching";
  const hintId = `h-${ctx}-${d.id}`;
  const inputId = `o-${ctx}-${d.id}`;
  const errId = `oe-${ctx}-${d.id}`;
  const offerErr = bad ? (offer.trim() === "" ? "Type your offer, like 80." : "Offer has to be more than $0.") : serverErr;

  async function buy() {
    if (bad || off > cashCents || busy) return;
    if (cashShare(off, cashCents) > ALL_IN_SHARE && !confirm) {
      setConfirm(true);
      buyRef.current?.focus();
      return;
    }
    setBusy(true);
    setServerErr(null);
    const reduce = prefersReducedMotion();
    if (!reduce) {
      // Fly the amount from "You pay" into the cash pill, and stamp BOUGHT.
      const src = payRef.current?.getBoundingClientRect();
      const dst = document.getElementById("cashPill")?.getBoundingClientRect();
      if (src && dst) {
        const f = document.createElement("div");
        f.className = "flyer";
        f.textContent = "−" + money(off);
        f.style.left = src.left + "px";
        f.style.top = src.top + "px";
        document.body.appendChild(f);
        f.animate(
          [
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            { transform: `translate(${dst.left - src.left + 10}px,${dst.top - src.top}px) scale(.7)`, opacity: 0.9 },
          ],
          { duration: 520, easing: "cubic-bezier(.5,0,.2,1)" },
        ).onfinish = () => f.remove();
      }
      setStamped(true);
      await new Promise((r) => setTimeout(r, 560));
    }
    announceMoney("info");
    const res = await buyAction(d.id, offer);
    setBusy(false);
    if (!res.ok) {
      setStamped(false);
      setServerErr(res.error);
      toast(res.error, { tone: "error" });
      return;
    }
    toast(
      `You bought the ${d.short}. ${money(res.data.priceCents)} moved from cash into your stuff. Your worth stays ${money(res.data.worthCents)}.`,
      { action: { label: "See it", href: "/stuff" } },
    );
  }

  async function watch() {
    const res = await watchAction(d.id, !watching);
    if (!res.ok) return toast(res.error, { tone: "error" });
    toast(watching ? `Stopped watching the ${d.short}.` : `Watching the ${d.short}. Find it under the Watching filter.`);
  }

  async function skip() {
    const res = await skipAction(d.id);
    if (!res.ok) return toast(res.error, { tone: "error" });
    const prev = res.data.prev;
    toast(`Skipped the ${d.short}.`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const r = await undoSkipAction(d.id, prev);
          if (r.ok) {
            onUndoSkip(d.id);
            router.refresh();
          }
        },
      },
    });
  }

  async function ask() {
    const res = await askParentAction(d.id);
    if (!res.ok) return toast(res.error, { tone: "error" });
    toast(`Saved for your parent: "Can we go halves on the ${d.short}?"`);
  }

  const share = cashShare(off, cashCents);
  const cantAfford = !bad && off > cashCents;
  const allIn = !bad && !cantAfford && share > ALL_IN_SHARE;

  return (
    <article className="ticket" data-ticket={d.id} aria-label={d.title}>
      {stamped && <span className="stamp bought">BOUGHT</span>}
      <div className="tk-head">
        <Thumb kind={d.thumb} category={d.category} size={ctx === "side" ? 88 : 64} />
        <div className="min-w-0">
          <h2 className="tk-title">{d.title}</h2>
          <div className="tk-meta">
            {d.sourceLabel} · {d.distance} mi from Alpharetta
          </div>
        </div>
        <Score score={d.score} />
      </div>

      <div className="spread">
        <div className="pb">
          <span className="pb-l">You pay</span>
          <span className="num" ref={payRef}>{money(pay)}</span>
          <span className="src">{!bad && off < d.askingCents ? "Listed at " + money(d.askingCents) : "Asking price"}</span>
        </div>
        <span className="sp-arrow">
          <ArrowIcon />
        </span>
        <div className="pb sell">
          <span className="pb-l">Sells for</span>
          <span className="num">~{money(d.sellCents)}</span>
          <span className="src">From eBay sold prices</span>
        </div>
      </div>

      <div>
        <div className="tk-profit">
          <span className={"num big " + (profit >= 0 ? "up" : "down")}>{signed(profit)}</span>
          <span className={"lbl " + (profit >= 0 ? "up" : "down")}>
            {profit >= 0 ? "profit" : "loss"} {tri(profit)}
          </span>
          <span className="fees">
            after {money(d.feesCents)} fees{" "}
            <button
              type="button"
              className="qbtn"
              aria-expanded={hint}
              aria-controls={hintId}
              aria-label="What are fees?"
              onClick={() => setHint((h) => !h)}
            >
              ?
            </button>
          </span>
        </div>
        <p className="hint" id={hintId} hidden={!hint}>
          Fees: money the selling site keeps.
        </p>
      </div>

      {d.flags.length > 0 && (
        <div className="flags">
          {d.flags.map((f) => (
            <span key={f} className="flag">
              <TriIcon />
              {f}
            </span>
          ))}
        </div>
      )}
      <p className="why">{d.why}</p>

      <div className="offer">
        <label htmlFor={inputId}>Your offer</label>
        <div className="row">
          <MoneyInput
            id={inputId}
            value={offer}
            invalid={!!offerErr}
            aria-describedby={offerErr ? errId : undefined}
            onChange={(e) => {
              setServerErr(null);
              setConfirm(false); // a new offer needs a new "yes"
              setOffer(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") buy();
            }}
          />
          <span className="cap">
            {d.askingCents >= 6000
              ? `Sellers often take about 10% less. Try ${money(suggestedOffer(d.askingCents))}.`
              : "Already cheap. Asking price is fine."}
          </span>
        </div>
        <FieldError id={errId}>{offerErr}</FieldError>
      </div>

      <div className="actions">
        {cantAfford ? (
          <div className="need">
            <strong>You need {money(off - cashCents)} more</strong>
            <div
              className="need-bar"
              role="progressbar"
              aria-label="Your cash compared to the price"
              aria-valuemin={0}
              aria-valuemax={off / 100}
              aria-valuenow={cashCents / 100}
            >
              <i style={{ width: (cashCents / off) * 100 + "%" }} />
            </div>
            <div className="cap">
              You have {money(cashCents)} cash. This costs {money(off)}. The profit is still why it&apos;s tempting.
            </div>
            <div className="two">
              <Button variant="secondary" aria-pressed={watching} onClick={watch}>
                <BookmarkIcon filled={watching} /> {watching ? "Watching" : "Watch it"}
              </Button>
              <Button variant="secondary" onClick={ask}>
                Ask a parent
              </Button>
            </div>
          </div>
        ) : (
          <>
            {allIn && (
              <div className="allin" role="status">
                <TriIcon />
                <span>
                  This uses {Math.round(share * 100)}% of your cash. You&apos;d have {money(cashCents - off)} left.
                </span>
              </div>
            )}
            <Button ref={buyRef} size="big" disabled={bad || busy} onClick={buy} data-buy={d.id}>
              {confirm ? "Yes, buy for " + money(off) : "Buy for " + (bad ? "$–" : money(off))}
            </Button>
            <div className="two">
              <Button variant="secondary" aria-pressed={watching} onClick={watch}>
                <BookmarkIcon filled={watching} /> {watching ? "Watching" : "Watch"}
              </Button>
              <Button variant="secondary" onClick={skip}>
                <XIcon /> Skip
              </Button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
