// "Hot right now": what sells fastest this week, from the nightly eBay sold-data
// snapshot (market_snapshots + saved_searches). Renders nothing until that job exists.
import { categoryLabel } from "@/lib/categories";
import { money } from "@/lib/money";
import type { HotItem } from "@/lib/ledger";

export function HotList({ items }: { items: HotItem[] }) {
  if (!items.length) return null;
  return (
    <section className="hot" aria-labelledby="hot-h">
      <div className="sec-head">
        <h2 id="hot-h">Hot right now</h2>
        <span className="cap">Sold on eBay in the last 7 days</span>
      </div>
      <ul className="rows">
        {items.map((h) => (
          <li key={h.query} className="srow">
            <span className="cap">{categoryLabel(h.category)}</span>
            <div className="min-w-0">
              <div className="dt">{h.query}</div>
              <div className="dm">
                {h.medianSoldCents != null ? `Usually sells for ${money(h.medianSoldCents)}` : ""}
                {h.medianDaysToSell != null ? ` · in about ${Math.round(h.medianDaysToSell)} days` : ""}
              </div>
            </div>
            <div className="pr">
              <span className="num">{h.soldCount7d}</span>
              <span className="cap block">sold</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
