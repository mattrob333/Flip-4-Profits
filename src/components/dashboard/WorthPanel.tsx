"use client";

// Hero: total worth (cash + what you paid for your stuff), change since start,
// worth-over-time chart from real transactions, and the cash / stuff split bar.
import * as React from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { money, signed, tri } from "@/lib/money";
import { dayLabel } from "@/lib/dates";
import type { WorthDay } from "@/lib/ledger";

type Range = "1W" | "All";

export function WorthPanel(props: {
  worthCents: number;
  cashCents: number;
  stuffCents: number;
  startCents: number;
  startKey: string;
  todayKey: string;
  fresh: boolean;
  hasSells: boolean;
  series: WorthDay[];
}) {
  const { worthCents, cashCents, stuffCents, startCents, startKey, fresh, hasSells, series } = props;
  const [range, setRange] = React.useState<Range>("1W");
  const change = worthCents - startCents;
  const pct = startCents ? Math.round((change / startCents) * 1000) / 10 : 0;

  return (
    <div className="panel hero o1">
      <div className="hero-top">
        <div>
          <div className="eyebrow">Your total worth</div>
          <NumberTicker value={worthCents} id="worthNum" className="hero-num" />
        </div>
        <ToggleGroup
          type="single"
          className="range"
          value={range}
          onValueChange={(v) => v && setRange(v as Range)}
          aria-label="Chart range"
        >
          <ToggleGroupItem value="1W" aria-label="Last week">1W</ToggleGroupItem>
          <ToggleGroupItem value="All" aria-label="All time">All</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {fresh ? (
        <div className="change">
          <span className="text-t2">Your starting bankroll. Nothing flipped yet.</span>
        </div>
      ) : (
        <div className={"change " + (change >= 0 ? "up" : "down")}>
          <span>
            {tri(change)} {signed(change)} since you started
          </span>
          <span className="muted">
            {change >= 0 ? "+" : "−"}
            {Math.abs(pct)}%
            <span className="wide-only">
              {" "}
              · started with {money(startCents)} on {dayLabel(startKey)}
            </span>
          </span>
        </div>
      )}
      <WorthChart series={series} range={range} startCents={startCents} hasSells={hasSells} worthCents={worthCents} todayKey={props.todayKey} />
      <div className="split">
        <div className="eyebrow">Where your money is</div>
        <div className="split-bar" aria-hidden="true">
          <span className="c" style={{ flexGrow: cashCents }} />
          {stuffCents > 0 && <span className="s" style={{ flexGrow: stuffCents }} />}
        </div>
        <div className="split-legend">
          <span>
            <span className="dot" style={{ background: "var(--t1)" }} />
            <span className="lbl">Cash</span>
            <span className="num">{money(cashCents)}</span>
          </span>
          <span>
            <span className="dot" style={{ background: "var(--info)" }} />
            <span className="lbl">Your stuff</span>
            <span className="num">{money(stuffCents)}</span>
          </span>
        </div>
        <p className="cap">Worth = cash + what you paid for your stuff. Buying moves money, selling makes it.</p>
      </div>
    </div>
  );
}

function WorthChart({
  series, range, startCents, hasSells, worthCents, todayKey,
}: { series: WorthDay[]; range: Range; startCents: number; hasSells: boolean; worthCents: number; todayKey: string }) {
  let days = series;
  if (range === "1W") days = series.slice(-7);
  else {
    const first = series.findIndex((d) => d.worthCents != null);
    days = series.slice(Math.max(0, first));
  }
  const start = startCents / 100;
  const vals = days.filter((d) => d.worthCents != null).map((d) => (d.worthCents as number) / 100).concat([start]);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const pad = Math.max(25, (hi - lo) * 0.35);
  lo = Math.floor((lo - pad) / 25) * 25;
  hi = Math.ceil((hi + pad) / 25) * 25;
  const n = days.length;
  const X = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const Y = (v: number) => (1 - (v - lo) / (hi - lo)) * 100;
  const pts = days
    .map((p, i) => (p.worthCents == null ? null : ([X(i), Y(p.worthCents / 100)] as [number, number])))
    .filter((p): p is [number, number] => p !== null);
  if (pts.length === 1) {
    pts.unshift([0, pts[0][1]]);
    pts[pts.length - 1][0] = 100;
  }
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]} 100 L${pts[0][0]} 100 Z` : "";
  const first = days[0];

  return (
    <>
      <div
        className="chart"
        role="img"
        aria-label={`Your worth from ${first ? dayLabel(first.key) : "today"} to today: ${money(worthCents)}`}
      >
        <div className="gl" style={{ top: 0 }}>
          <span>{money(hi * 100)}</span>
        </div>
        {hasSells && (
          <div className="gl start-l" style={{ top: Y(start) + "%" }}>
            <span>Start {money(startCents)}</span>
          </div>
        )}
        <div className="gl" style={{ top: "100%" }}>
          <span>{money(lo * 100)}</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={area} fill="rgb(63 221 140/.12)" />
          <path d={line} fill="none" stroke="#3FDD8C" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {!hasSells && <span className="chart-note">Your line moves when you sell something.</span>}
        {days.map((p, i) =>
          p.worthCents == null
            ? null
            : p.events.map((e, j) => {
                const loss = e.kind === "sell" && (e.profitCents ?? 0) < 0;
                const cls = e.kind === "sell" ? (loss ? "loss" : "sell") : "";
                return (
                  <React.Fragment key={p.key + j}>
                    <span className={"cdot " + cls} style={{ left: X(i) + "%", top: Y((p.worthCents as number) / 100) + "%" }} title={e.what} />
                    {e.kind === "sell" && (
                      <span
                        className={"clabel " + (loss ? "loss" : "")}
                        style={{ left: Math.min(88, Math.max(10, X(i))) + "%", top: Y((p.worthCents as number) / 100) + "%" }}
                      >
                        {signed(e.profitCents ?? 0)} {loss ? "loss" : "flip"}
                      </span>
                    )}
                  </React.Fragment>
                );
              }),
        )}
      </div>
      <div className="xax" aria-hidden="true">
        {days.map((p, i) => (
          <span key={p.key}>
            {i === 0 || i === n - 1 || n <= 7 ? (p.key === todayKey ? "Today" : String(Number(p.key.slice(8)))) : ""}
          </span>
        ))}
      </div>
    </>
  );
}
