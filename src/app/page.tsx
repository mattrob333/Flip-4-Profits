import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ArrowIcon, ChevIcon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";
import { MoneyLadder } from "@/components/MoneyLadder";
import { Enter } from "@/components/Enter";
import { WorthPanel } from "@/components/dashboard/WorthPanel";
import { CATEGORIES } from "@/lib/categories";
import { dayLabelRel, todayKey } from "@/lib/dates";
import { getBalance, getLedger, getWorthSeries, listDeals, type LedgerEntry } from "@/lib/ledger";
import { flow, money, signed } from "@/lib/money";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const b = getBalance();
  const today = todayKey();
  const series = getWorthSeries();
  const ledger = getLedger();
  const deals = listDeals().slice(0, 3);
  const fresh = b.flips === 0 && b.itemsHeld === 0;
  const feed = [...ledger].reverse().slice(0, 4);

  return (
    <Enter screen="home" as="section" className="dash" aria-label="Dashboard">
      <WorthPanel
        worthCents={b.netWorth}
        cashCents={b.cash}
        stuffCents={b.inventoryCost}
        startCents={b.deposits}
        todayKey={today}
        fresh={fresh}
        hasSells={b.flips > 0}
        profitCents={b.totalProfit}
        series={series}
      />

      <div className="scout o2">
        <Button asChild size="scout" className="md:flex-none md:px-7">
          <Link href="/deals">
            Scout deals <ArrowIcon />
          </Link>
        </Button>
        <div className="chips fade-x" role="group" aria-label="Scout a category">
          {CATEGORIES.map((c) => (
            <Chip asChild key={c.id}>
              <Link href={`/deals?cat=${c.id}`}>{c.label}</Link>
            </Chip>
          ))}
        </div>
      </div>

      <div className="rail">
        {/* One card: the ladder (desktop; phones show it in the worth card) and your flip stats. */}
        <section className="panel goal o3" aria-labelledby="ladderH">
          <h2 className="eyebrow ld-only" id="ladderH">Money ladder</h2>
          <MoneyLadder profitCents={b.totalProfit} className="ld-only" />
          <dl className="week">
            <div>
              <dt className="cap">This week</dt>
              <dd className={"num" + (b.weekProfit > 0 ? " up" : b.weekProfit < 0 ? " down" : "")}>
                {b.flips ? signed(b.weekProfit) : "$0"}
              </dd>
            </div>
            <div>
              <dt className="cap">Flips done</dt>
              <dd className="num">{b.flips}</dd>
            </div>
            <div>
              <dt className="cap">
                Best flip<span className="wide-rail">{b.bestFlip ? ": " + b.bestFlip.title : ""}</span>
              </dt>
              <dd className={"num" + (b.bestFlip && b.bestFlip.profit > 0 ? " up" : "")}>
                {b.bestFlip ? signed(b.bestFlip.profit) : "None yet"}
              </dd>
            </div>
          </dl>
        </section>

        <div className="panel rail-panel o6">
          <div className="sec-head">
            <h2>What happened</h2>
            <Link className="link" href="/stuff?tab=ledger">
              See all <ChevIcon />
            </Link>
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
                  <ProductImage kind={d.thumb} photoUrl={d.photoUrl} size={64} />
                  <span className="min-w-0">
                    <span className="dt">{d.short}</span>
                    <span className="dm">
                      <span className="pair-inline tab">
                        {money(d.askingCents)} → {money(d.sellCents)} ·{" "}
                      </span>
                      {d.distance} mi<span className="wide-only"> · {d.sourceLabel}</span>
                    </span>
                  </span>
                  <span className="pair pair-col tab">
                    <span className="cap block">You pay → Sells for</span>
                    {money(d.askingCents)} → {money(d.sellCents)}
                  </span>
                  <span className="pr">
                    <span className="cap block">could make</span>
                    <span className={"num proj" + (d.profitCents < 0 ? " neg" : "")}>{signed(d.profitCents)}</span>
                    {d.feesCents > 0 && <span className="fee-note">after {money(d.feesCents)} fees</span>}
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
        <div className={"fa" + (l.kind === "buy" ? " buy" : "")}>{l.kind === "start" ? money(l.amountCents) : flow(l.amountCents)}</div>
      </div>
    </li>
  );
}
