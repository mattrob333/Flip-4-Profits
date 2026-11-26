import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ArrowIcon, ChevIcon } from "@/components/Icons";
import { Thumb } from "@/components/Thumb";
import { GoalBar } from "@/components/GoalBar";
import { Enter } from "@/components/Enter";
import { WorthPanel } from "@/components/dashboard/WorthPanel";
import { CATEGORIES } from "@/lib/categories";
import { dayLabelRel, todayKey } from "@/lib/dates";
import { goalInfo } from "@/lib/goal";
import { getBalance, getGoal, getLedger, getWorthSeries, listDeals, type LedgerEntry } from "@/lib/ledger";
import { flow, money, signed, tri } from "@/lib/money";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const b = getBalance();
  const today = todayKey();
  const series = getWorthSeries();
  const ledger = getLedger();
  const deals = listDeals().slice(0, 3);
  const goal = goalInfo({ flips: b.flips, totalProfitCents: b.totalProfit, ...getGoal() });
  const fresh = b.flips === 0 && b.itemsHeld === 0;
  const feed = [...ledger].reverse().slice(0, 5);

  return (
    <Enter screen="home" as="section" className="dash" aria-label="Dashboard">
      <WorthPanel
        worthCents={b.netWorth}
        cashCents={b.cash}
        stuffCents={b.inventoryCost}
        startCents={b.deposits}
        startKey={b.startKey}
        todayKey={today}
        fresh={fresh}
        hasSells={b.flips > 0}
        series={series}
      />

      <div className="scout o2">
        <Button asChild size="scout" className="md:flex-none md:px-7">
          <Link href="/deals">
            Scout deals <ArrowIcon />
          </Link>
        </Button>
        <div className="chips" role="group" aria-label="Scout a category">
          {CATEGORIES.map((c) => (
            <Chip asChild key={c.id}>
              <Link href={`/deals?cat=${c.id}`}>{c.label}</Link>
            </Chip>
          ))}
        </div>
      </div>

      <div className="rail">
        <div className={"panel goal o3" + (goal.justDone ? " done" : "")}>
          <div className="eyebrow">{goal.justDone ? `Goal done: ${goal.justDone} · Next goal` : "Your goal"}</div>
          <h3>{goal.title}</h3>
          <GoalBar val={goal.val} max={goal.max} label={goal.title} />
          <div className="cap">
            <span>{goal.left}</span>
            <span>{goal.unit === "profit" ? "Profit from sells" : ""}</span>
          </div>
        </div>

        <div className="o4">
          <div className="week">
            <div>
              <span className={"num" + (b.weekProfit > 0 ? " up" : b.weekProfit < 0 ? " down" : "")}>
                {b.flips ? signed(b.weekProfit) : "$0"}
              </span>
              <span className="cap">This week</span>
            </div>
            <div>
              <span className="num">{b.flips}</span>
              <span className="cap">Flips done</span>
            </div>
            <div>
              <span className={"num" + (b.bestFlip && b.bestFlip.profit > 0 ? " up" : "")}>
                {b.bestFlip ? signed(b.bestFlip.profit) : "None yet"}
              </span>
              <span className="cap">Best flip{b.bestFlip ? ": " + b.bestFlip.title.split(" ")[0] : ""}</span>
            </div>
          </div>
        </div>

        <div className="panel rail-panel o6">
          <div className="sec-head">
            <h2>What happened</h2>
          </div>
          <ul className="rows feed">
            {feed.map((l) => (
              <FeedItem key={l.kind + l.id} l={l} today={today} />
            ))}
          </ul>
        </div>
      </div>

      <div className="o5">
        <div className="sec-head">
          <h2>Top deals near you</h2>
          <Link className="link" href="/deals">
            See all <ChevIcon />
          </Link>
        </div>
        {deals.length ? (
          <ul className="rows">
            {deals.map((d) => (
              <li key={d.id}>
                <Link className="drow" href={`/deals?deal=${d.id}`}>
                  <Thumb kind={d.thumb} category={d.category} size={48} />
                  <span className="min-w-0">
                    <span className="dt">{d.short}</span>
                    <span className="dm">
                      <span className="pair-inline tab">
                        {money(d.askingCents)} → ~{money(d.sellCents)} ·{" "}
                      </span>
                      {d.distance} mi<span className="wide-only"> · {d.sourceLabel}</span>
                    </span>
                  </span>
                  <span className="pair pair-col">
                    <span className="cap block">You pay → Sells for</span>
                    {money(d.askingCents)} → ~{money(d.sellCents)}
                  </span>
                  <span className="pr">
                    <span className={"num " + (d.profitCents >= 0 ? "up" : "down")}>{signed(d.profitCents)}</span>
                    <span className="cap">
                      {d.profitCents >= 0 ? "profit" : "loss"} {tri(d.profitCents)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <h3>No deals right now</h3>
            <p>Scout finds things near Alpharetta you could flip. New ones show up after the next scout.</p>
            <Button asChild>
              <Link href="/deals">Scout deals</Link>
            </Button>
          </div>
        )}
      </div>
    </Enter>
  );
}

function FeedItem({ l, today }: { l: LedgerEntry; today: string }) {
  const color =
    l.kind === "buy" ? "var(--info)" : l.kind === "sell" ? ((l.profitCents ?? 0) < 0 ? "var(--loss)" : "var(--profit)") : "var(--t3)";
  return (
    <li>
      <div className="fi">
        <span className="dot" style={{ background: color }} aria-hidden="true" />
        <div className="min-w-0">
          <div className="ft">{l.what}</div>
          <div className="fs">
            {l.kind === "sell" && (
              <>
                <span className={(l.profitCents ?? 0) < 0 ? "down" : "up"}>
                  {signed(l.profitCents ?? 0)} {(l.profitCents ?? 0) < 0 ? "loss" : "profit"}
                </span>
                {" · "}
              </>
            )}
            {l.note ? l.note + " · " : ""}
            {dayLabelRel(l.dayKey, today)}
          </div>
        </div>
        <div className="fa">
          {l.kind === "start" ? money(l.amountCents) : flow(l.amountCents)}
          <small>cash {money(l.cashAfterCents)}</small>
        </div>
      </div>
    </li>
  );
}
