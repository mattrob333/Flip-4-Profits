"use client";

// Hero: one number (total worth), one line under it ("$540 cash + $35 in your
// stuff") with a 10px split bar, the money ladder on phones, then the worth
// chart: a step line over real days (worth only moves when you sell), a dashed
// "Start" baseline, blue buy dots, green sell dots.
import * as React from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MoneyLadder } from "@/components/MoneyLadder";
import { money, signed, tri } from "@/lib/money";
import { dayLabel } from "@/lib/dates";
import type { WorthDay } from "@/lib/ledger";

type Range = "1W" | "All";

export function WorthPanel(props: {
  worthCents: number;
  cashCents: number;
  stuffCents: number;
  startCents: number;
  todayKey: string;
  fresh: boolean;
  hasSells: boolean;
  profitCents: number;
  series: WorthDay[];
}) {
  const { worthCents, cashCents, stuffCents, startCents, fresh, hasSells, series } = props;
  const [range, setRange] = React.useState<Range>("1W");
  const [why, setWhy] = React.useState(false);
  const change = worthCents - startCents;
  const pct = startCents ? Math.round((change / startCents) * 1000) / 10 : 0;

  return (
    <section className="panel hero em o1" aria-label="Your worth">
      <div className="hero-top">
        <div className="min-w-0">
          <h2 className="eyebrow">Your worth</h2>
          <div className="hero-row">
            <NumberTicker value={worthCents} id="worthNum" className="hero-num" />
            {!fresh && change !== 0 && (
              <span className={"delta " + (change >= 0 ? "up" : "down")}>
                {tri(change)} {money(change)}
                <small>
                  {change >= 0 ? "+" : "−"}
                  {Math.abs(pct)}%
                </small>
              </span>
            )}
          </div>
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

      <p className="hero-split">
        <span className="tab">
          <b>{money(cashCents)}</b> cash + <b className="amt-stuff">{money(stuffCents)}</b> in your stuff
        </span>
        <button
          type="button"
          className="qbtn"
          aria-expanded={why}
          aria-controls="worthWhy"
          aria-label="What is worth?"
          onClick={() => setWhy((w) => !w)}
        >
          ?
        </button>
      </p>
      <div className="split-bar" aria-hidden="true">
        <span className="c" style={{ flexGrow: Math.max(1, cashCents) }} />
        {stuffCents > 0 && <span className="s" style={{ flexGrow: stuffCents }} />}
      </div>
      <p className="hint" id="worthWhy" hidden={!why}>
        Worth = cash + what you paid for your stuff. Buying moves money into stuff, so worth stays the same. Selling for more is what grows it.
      </p>

      <MoneyLadder profitCents={props.profitCents} className="ladder-hero" />

      <WorthChart
        series={series}
        range={range}
        startCents={startCents}
        hasSells={hasSells}
        worthCents={worthCents}
        todayKey={props.todayKey}
        change={signed(change)}
      />
    </section>
  );
}

type Pt = [number, number];

/**
 * Step path: worth only changes when something sells, so the line runs flat and
 * then jumps (horizontal, then vertical). Each change sits in the middle of its
 * day, and the last value runs on to the right edge, so no step is zero-width.
 */
function stepPath(startY: number, steps: { x: number; y: number }[], endX: number) {
  let d = `M0 ${startY.toFixed(2)}`;
  let y = startY;
  for (const s of steps) {
    if (s.y === y) continue;
    d += ` H${s.x.toFixed(2)} V${s.y.toFixed(2)}`;
    y = s.y;
  }
  return d + ` H${endX.toFixed(2)}`;
}

function WorthChart({
  series,
  range,
  startCents,
  hasSells,
  worthCents,
  todayKey,
  change,
}: {
  series: WorthDay[];
  range: Range;
  startCents: number;
  hasSells: boolean;
  worthCents: number;
  todayKey: string;
  change: string;
}) {
  // Drop days before you started, so the line starts at the first tick.
  const firstReal = series.findIndex((d) => d.worthCents != null);
  let days = firstReal >= 0 ? series.slice(firstReal) : series;
  if (range === "1W") days = days.slice(-7);
  const n = days.length;

  const start = startCents;
  // Worth just before the first day shown (the day before, or what you started with).
  const shownFrom = series.indexOf(days[0]);
  const before = (shownFrom > 0 ? series[shownFrom - 1].worthCents : null) ?? start;
  const vals = days.map((d) => d.worthCents ?? start).concat([start, before]);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (!hasSells) {
    // Room for the ghost line up to Start + $100.
    hi = Math.max(hi, start + 10000);
  }
  const pad = Math.max(2500, (hi - lo) * 0.28);
  lo -= pad;
  hi += pad * 1.2;

  // Each day owns an equal slice; a change is drawn in the middle of its day.
  // With no sells yet, real days use the left part; the ghost "first flip" line fills the rest.
  const span = hasSells ? 100 : 52;
  const w = span / Math.max(1, n);
  const X = (i: number) => (i + 0.5) * w;
  const Y = (v: number) => (1 - (v - lo) / (hi - lo)) * 100;
  const yBase = Y(start);

  const line = stepPath(
    Y(before),
    days.map((d, i) => ({ x: X(i), y: Y(d.worthCents ?? start) })),
    span,
  );
  const last: Pt = [span, Y(days[n - 1]?.worthCents ?? before)];
  const area = `${line} V${yBase.toFixed(2)} H0 Z`;
  const ghostEnd: Pt = [100, Y(start + 10000)];
  // The ghost is a dotted step too: flat, then up at your first sell.
  const ghost = !hasSells ? `M${last[0]} ${last[1]} H${last[0] + 24} V${ghostEnd[1]} H${ghostEnd[0]}` : "";
  const below = worthCents < start;

  const first = days[0];
  const ticks = days.map((d, i) => {
    const show = n <= 8 || i === 0 || i === n - 1 || i === Math.floor((n - 1) / 2);
    return show ? { i, label: d.key === todayKey ? "Today" : dayLabel(d.key).replace(/^\w+ /, ""), key: d.key } : null;
  });

  return (
    <div className="chart-wrap">
      <div
        className="chart"
        role="group"
        aria-label={`Worth chart from ${first ? dayLabel(first.key) : "today"} to today: ${money(worthCents)} (${change} since you started with ${money(start)})`}
      >
        <div className="plot">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <clipPath id="cUp">
                <rect x="-5" y="-50" width="110" height={yBase + 50} />
              </clipPath>
              <clipPath id="cDown">
                <rect x="-5" y={yBase} width="110" height={200} />
              </clipPath>
            </defs>
            {hasSells && (
              <>
                <path d={area} fill="rgb(63 221 140 / 0.08)" clipPath="url(#cUp)" />
                <path d={area} fill="rgb(255 119 102 / 0.08)" clipPath="url(#cDown)" />
              </>
            )}
            <line x1="0" x2="100" y1={yBase} y2={yBase} stroke="rgb(242 243 236 / 0.34)" strokeWidth="1.5" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
            {ghost && (
              <path d={ghost} fill="none" stroke="rgb(242 243 236 / 0.34)" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            )}
            <path d={line} fill="none" stroke={below ? "var(--loss)" : "var(--profit)"} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="miter" strokeLinecap="square" />
          </svg>

          <span className={"base-l " + (below ? "above" : "")} style={{ top: yBase + "%" }}>
            Start {money(start)}
          </span>

          {ghost && (
            <span className="ghost-l" style={{ top: ghostEnd[1] + "%" }}>
              Your first flip goes here
            </span>
          )}

          {days.map((p, i) => {
            const evs = p.events;
            const y = Y(p.worthCents ?? start);
            const x = X(i);
            return evs.map((e, j) => {
              const loss = e.kind === "sell" && (e.profitCents ?? 0) < 0;
              const cls = e.kind === "buy" ? "buy" : loss ? "loss" : "sell";
              // Spread same-day events apart; keep the end dot clear on the last day.
              const shift = (j - (evs.length - 1) / 2) * 16;
              const amount =
                e.kind === "sell" ? `${signed(e.profitCents ?? 0)} ${loss ? "loss" : "profit"}` : `${money(-e.amountCents)} into stuff`;
              const tip = `${e.what} · ${amount} · ${dayLabel(p.key)}`;
              const edge = x > 70 ? "r" : x < 30 ? "l" : "";
              return (
                <button
                  type="button"
                  key={p.key + j}
                  className={`cdot ${cls} ${edge}`}
                  style={{ left: `calc(${x}% + ${shift}px)`, top: y + "%" }}
                  aria-label={tip}
                >
                  {e.kind === "sell" && (
                    <span className="clabel" aria-hidden="true">
                      {signed(e.profitCents ?? 0)}
                    </span>
                  )}
                  <span className="tip" aria-hidden="true">
                    <b>{e.what}</b>
                    <span>{amount}</span>
                  </span>
                </button>
              );
            });
          })}
          <span className="cend" style={{ left: last[0] + "%", top: last[1] + "%" }} aria-hidden="true" />
        </div>
      </div>
      <div className="xax" aria-hidden="true">
        {ticks.map((t, k) =>
          t ? (
            // Before your first sell, "Today" sits under the end dot (where the ghost line starts).
            <span key={t.key} style={{ left: (!hasSells && t.i === n - 1 ? span : X(t.i)) + "%" }} className={k === 0 && X(t.i) < 4 ? "first" : ""}>
              {t.label}
            </span>
          ) : null,
        )}
      </div>
      <div className="legend" aria-hidden="true">
        {days.some((d) => d.events.length > 0) && (
          <>
            <span>
              <i className="buy" /> Bought
            </span>
            <span>
              <i className="sell" /> Sold
            </span>
          </>
        )}
        {!hasSells && <span className="text-t3">Your line moves when you sell something for more than you paid.</span>}
      </div>
    </div>
  );
}
