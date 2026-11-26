// The ledger: every dollar in and out, newest first, with cash after each line
// and a step chart of running cash (dots where money moved).
import { NumberTicker } from "@/components/ui/number-ticker";
import { dayLabel } from "@/lib/dates";
import { flow, money, signed, tri } from "@/lib/money";
import type { LedgerEntry } from "@/lib/ledger";

export function Ledger({ entries, cashCents }: { entries: LedgerEntry[]; cashCents: number }) {
  // Step chart of running cash: flat, then a jump at each money move. Entry i
  // sits at the start of its slice, so the last value still runs to "Today".
  const vals = entries.map((l) => l.cashAfterCents / 100);
  const lo = Math.min(...vals) - 20;
  const hi = Math.max(...vals) + 20;
  const n = vals.length;
  const X = (i: number) => (n <= 1 ? 0 : (i / n) * 100);
  const Y = (v: number) => (1 - (v - lo) / (hi - lo)) * 100;
  let d = n ? `M0 ${Y(vals[0]).toFixed(2)}` : "";
  for (let i = 1; i < n; i++) d += ` H${X(i).toFixed(2)} V${Y(vals[i]).toFixed(2)}`;
  if (n) d += " H100";
  const area = n ? `${d} V100 H0 Z` : "";
  const pts = entries.map((l, i) => ({
    x: X(i),
    y: Y(vals[i]),
    cls: l.kind === "buy" ? "buy" : l.kind === "sell" ? ((l.profitCents ?? 0) < 0 ? "loss" : "sell") : "start",
  }));
  const since = entries[0] ? dayLabel(entries[0].dayKey) : "today";

  return (
    <div className="panel ledger">
      <div className="lg-head">
        <div>
          <div className="eyebrow">Cash on hand</div>
          <NumberTicker value={cashCents} id="lgCash" />
        </div>
        <div className="cap text-right">
          Every dollar in and out
          <br />
          since {since}
        </div>
      </div>
      <div className="spark" role="img" aria-label={`Running cash: ${entries.map((e) => money(e.cashAfterCents)).join(", ")}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={area} fill="rgb(242 243 236 / 0.06)" />
          <path d={d} fill="none" stroke="var(--t1)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="miter" />
        </svg>
        {pts.map((p, i) => (
          <span key={i} className={"sdot " + p.cls} style={{ left: p.x + "%", top: p.y + "%" }} aria-hidden="true" />
        ))}
      </div>
      <div className="spark-ax" aria-hidden="true">
        <span>{since}</span>
        <span>Today</span>
      </div>
      <table className="lg-table">
        <caption className="sr-only">Money log: every dollar in and out</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">What</th>
            <th scope="col" className="r">Amount</th>
            <th scope="col" className="r">Cash after</th>
          </tr>
        </thead>
        <tbody>
          {[...entries].reverse().map((l) => (
            <tr key={l.kind + l.id}>
              <td className="d">{dayLabel(l.dayKey)}</td>
              <td className="w">
                {l.what}
                {l.note && <small>{l.note}</small>}
                {l.kind === "sell" && l.profitCents != null && (
                  <span className={"badge " + (l.profitCents < 0 ? "loss" : "profit")}>
                    {signed(l.profitCents)} {l.profitCents < 0 ? "loss" : "profit"} {tri(l.profitCents)}
                  </span>
                )}
              </td>
              <td className={"a r" + (l.kind === "buy" ? " buy" : "")}>{l.kind === "start" ? money(l.amountCents) : flow(l.amountCents)}</td>
              <td className="ca r">{money(l.cashAfterCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
