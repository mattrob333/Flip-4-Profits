// The ledger: every dollar in and out, newest first, with cash after each line
// and a step sparkline of running cash.
import { NumberTicker } from "@/components/ui/number-ticker";
import { dayLabel } from "@/lib/dates";
import { flow, money, signed, tri } from "@/lib/money";
import type { LedgerEntry } from "@/lib/ledger";

export function Ledger({ entries, cashCents }: { entries: LedgerEntry[]; cashCents: number }) {
  const vals = entries.map((l) => l.cashAfterCents / 100);
  const lo = Math.min(...vals) - 20;
  const hi = Math.max(...vals) + 20;
  const n = vals.length;
  const X = (i: number) => (n === 1 ? 100 : (i / (n - 1)) * 100);
  const Y = (v: number) => (1 - (v - lo) / (hi - lo)) * 100;
  let d = "";
  vals.forEach((v, i) => {
    d += i === 0 ? `M0 ${Y(v)}` : ` L${X(i)} ${Y(vals[i - 1])} L${X(i)} ${Y(v)}`;
  });
  if (n === 1) d += ` L100 ${Y(vals[0])}`;
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
          <path d={d} fill="none" stroke="#F2F3EC" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>
      <table className="lg-table">
        <caption className="sr-only">Ledger: every dollar in and out</caption>
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
              <td className="d">{dayLabel(l.dayKey).toUpperCase()}</td>
              <td className="w">
                {l.what}
                {l.note && <small>{l.note}</small>}
                {l.kind === "sell" && l.profitCents != null && (
                  <span className={"pchip" + (l.profitCents < 0 ? " loss" : "")}>
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
