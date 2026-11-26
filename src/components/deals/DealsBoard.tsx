"use client";

// Deals: filters, desktop sortable table + sticky ticket, mobile compact rows
// with the selected (top) deal expanded as a full ticket.
import * as React from "react";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BookmarkIcon, FilterIcon, SortIcon, TriIcon } from "@/components/Icons";
import { ProductImage, ScorePill } from "@/components/ProductImage";
import { DealTicket } from "./DealTicket";
import { CATEGORIES } from "@/lib/categories";
import { money, parseMoney, signed } from "@/lib/money";
import { prefersReducedMotion } from "@/lib/motion";
import type { DealView } from "@/lib/ledger";

type SortKey = "title" | "buy" | "sell" | "profit" | "score" | "mi";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "title", label: "Item" },
  { key: "buy", label: "You pay" },
  { key: "sell", label: "Sells for" },
  { key: "profit", label: "Could make" },
  { key: "score", label: "Score" },
  { key: "mi", label: "Miles" },
];
const sortValue: Record<SortKey, (d: DealView) => string | number> = {
  title: (d) => d.short.toLowerCase(),
  buy: (d) => d.askingCents,
  sell: (d) => d.sellCents,
  profit: (d) => d.profitCents,
  score: (d) => d.score,
  mi: (d) => d.distance ?? 999,
};
const ascFirst = (k: SortKey) => k === "title" || k === "buy" || k === "mi";

export function DealsBoard({
  deals,
  cashCents,
  initialCat,
  initialSel,
}: {
  deals: DealView[];
  cashCents: number;
  initialCat: string;
  initialSel: number | null;
}) {
  const [cat, setCat] = React.useState(initialCat);
  const [minScore, setMinScore] = React.useState(0);
  const [maxPrice, setMaxPrice] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("score");
  const [dir, setDir] = React.useState<1 | -1>(-1);
  const [showFilters, setShowFilters] = React.useState(false);
  const [sel, setSel] = React.useState<number | null>(initialSel);
  const [offers, setOffers] = React.useState<Record<number, string>>({});
  const tableRef = React.useRef<HTMLTableSectionElement>(null);

  const watchingCount = deals.filter((d) => d.status === "watching").length;

  const list = React.useMemo(() => {
    let l = deals;
    if (cat === "watching") l = l.filter((d) => d.status === "watching");
    else if (cat !== "all") l = l.filter((d) => d.category === cat);
    if (minScore) l = l.filter((d) => d.score >= minScore);
    const mp = parseMoney(maxPrice);
    if (mp > 0) l = l.filter((d) => d.askingCents <= mp);
    const key = sortValue[sort];
    return [...l].sort((a, b) => {
      const x = key(a), y = key(b);
      return (x < y ? -1 : x > y ? 1 : 0) * dir;
    });
  }, [deals, cat, minScore, maxPrice, sort, dir]);

  const selId = list.some((d) => d.id === sel) ? sel : (list[0]?.id ?? null);
  const selected = list.find((d) => d.id === selId) ?? null;

  function sortBy(k: SortKey) {
    if (k === sort) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(ascFirst(k) ? 1 : -1);
    }
  }

  function resetFilters() {
    setCat("all");
    setMinScore(0);
    setMaxPrice("");
  }

  function rowKey(e: React.KeyboardEvent<HTMLTableRowElement>, id: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSel(id);
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const i = list.findIndex((d) => d.id === id);
      const next = list[i + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) {
        setSel(next.id);
        tableRef.current?.querySelector<HTMLElement>(`tr[data-row="${next.id}"]`)?.focus();
      }
    }
  }

  function pickMobile(id: number) {
    setSel(id);
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`.mlist [data-ticket="${id}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      el.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
    });
  }

  const ticketProps = (d: DealView) => ({
    deal: d,
    cashCents,
    offer: offers[d.id] ?? String(d.askingCents / 100),
    setOffer: (v: string) => setOffers((o) => ({ ...o, [d.id]: v })),
    onUndoSkip: (id: number) => setSel(id),
  });

  const cats = [{ id: "all", label: "All" }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))];

  return (
    <>
      <div className="filters">
        <div className="flex items-center gap-2 min-w-0 lg:flex-1">
          <div className="chips fade-x" role="group" aria-label="Category">
            {cats.map((c) => (
              <Chip key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </Chip>
            ))}
            <Chip aria-pressed={cat === "watching"} onClick={() => setCat("watching")}>
              <BookmarkIcon />
              Watching{watchingCount ? ` (${watchingCount})` : ""}
            </Chip>
          </div>
          <Chip
            className="f-toggle lg:hidden"
            aria-expanded={showFilters}
            aria-controls="fmore"
            onClick={() => setShowFilters((s) => !s)}
          >
            <FilterIcon />
            <span className="sr-only">More </span>Filters
          </Chip>
        </div>
        <div className={"filter-more" + (showFilters ? "" : " closed")} id="fmore">
          <div className="fgroup">
            <span className="flabel" id="lblScore">Min score</span>
            <ToggleGroup
              type="single"
              value={String(minScore)}
              onValueChange={(v) => setMinScore(Number(v || 0))}
              aria-labelledby="lblScore"
            >
              {[
                [0, "Any"],
                [60, "60+"],
                [75, "75+"],
              ].map(([v, l]) => (
                <ToggleGroupItem key={v} value={String(v)}>
                  {l}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="fgroup">
            <label htmlFor="maxp">Max price</label>
            <MoneyInput
              id="maxp"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              boxClassName="w-[130px] h-11"
            />
          </div>
          <div className="fgroup">
            <label htmlFor="sortSel">Sort by</label>
            <select
              id="sortSel"
              className="sel"
              value={sort}
              onChange={(e) => {
                const k = e.target.value as SortKey;
                setSort(k);
                setDir(ascFirst(k) ? 1 : -1);
              }}
            >
              <option value="score">Best score</option>
              <option value="profit">Most profit</option>
              <option value="buy">Cheapest</option>
              <option value="mi">Closest</option>
              {(sort === "sell" || sort === "title") && <option value={sort}>{sort === "sell" ? "Sells for" : "Name"}</option>}
            </select>
          </div>
        </div>
      </div>

      <div className="deals-grid">
        <div>
          {list.length ? (
            <>
              <table className="dtable" aria-label="Deals. Choose a row to see the full deal.">
                <thead>
                  <tr>
                    <th scope="col" className="th-img">
                      <span className="sr-only">Photo</span>
                    </th>
                    {SORTS.map((s) => (
                      <th
                        key={s.key}
                        scope="col"
                        className={"c-" + s.key}
                        aria-sort={sort === s.key ? (dir < 0 ? "descending" : "ascending") : undefined}
                      >
                        {/* Numeric columns are right-aligned: the arrow goes first so the label's
                            right edge lines up with the numbers under it. */}
                        <button type="button" onClick={() => sortBy(s.key)}>
                          {s.key !== "title" && <SortIcon up={sort === s.key && dir > 0} />}
                          {s.label}
                          {s.key === "title" && <SortIcon up={sort === s.key && dir > 0} />}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody ref={tableRef}>
                  {list.map((d) => (
                    <tr
                      key={d.id}
                      tabIndex={0}
                      data-row={d.id}
                      aria-selected={d.id === selId}
                      onClick={() => setSel(d.id)}
                      onKeyDown={(e) => rowKey(e, d.id)}
                    >
                      <td className="td-img">
                        <ProductImage kind={d.thumb} photoUrl={d.photoUrl} size={64} />
                      </td>
                      <td>
                        <div className="it">
                          <div className="min-w-0">
                            <div className="dt" title={d.title}>{d.short}</div>
                            <div className="dm">
                              <CheckBadge flags={d.flags} />
                              {d.status === "watching" && (
                                <span className="watch-mark" aria-label="Watching" role="img">
                                  <BookmarkIcon filled />
                                </span>
                              )}
                              <span className="src-l" title={d.sourceLabel}>{d.sourceLabel}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="pay">{money(d.askingCents)}</td>
                      <td className="sel-p">{money(d.sellCents)}</td>
                      <td className="prof">
                        <span className={"proj" + (d.profitCents < 0 ? " neg" : "")}>{signed(d.profitCents)}</span>
                        {d.feesCents > 0 && <span className="fee-note">after {money(d.feesCents)} fees</span>}
                      </td>
                      <td className="sc">
                        <ScorePill score={d.score} />
                      </td>
                      <td className="mi">{d.distance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="mlist">
                {list.map((d) =>
                  d.id === selId ? (
                    <li key={d.id} className="open">
                      <DealTicket ctx="inline" {...ticketProps(d)} />
                    </li>
                  ) : (
                    <li key={d.id}>
                      <button type="button" className="mrow" aria-expanded={false} onClick={() => pickMobile(d.id)}>
                        <ProductImage kind={d.thumb} photoUrl={d.photoUrl} size={64} />
                        <span className="min-w-0">
                          <span className="dt">{d.short}</span>
                          <span className="dm">
                            <span className="tab">
                              {money(d.askingCents)} → {money(d.sellCents)}
                            </span>
                          </span>
                          <span className="dm">
                            <ScorePill score={d.score} />
                            <CheckBadge flags={d.flags} short />
                            {d.status === "watching" && (
                              <span className="watch-mark" aria-label="Watching" role="img">
                                <BookmarkIcon filled />
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="pr">
                          <span className="cap block">could make</span>
                          <span className={"num proj" + (d.profitCents < 0 ? " neg" : "")}>{signed(d.profitCents)}</span>
                          {d.feesCents > 0 && <span className="fee-note">after {money(d.feesCents)} fees</span>}
                        </span>
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </>
          ) : (
            <div className="empty">
              <h3>
                {deals.length === 0
                  ? "No deals right now"
                  : cat === "watching"
                    ? "Nothing on your watch list"
                    : "No deals match these filters"}
              </h3>
              <p>
                {deals.length === 0
                  ? "You bought or skipped everything. New deals show up after the next scout."
                  : cat === "watching"
                    ? "Tap Watch on a deal to keep an eye on it here."
                    : "Try a different category or a higher max price."}
              </p>
              {deals.length > 0 && (
                <Button variant="secondary" onClick={resetFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          )}
        </div>
        <aside className="ticket-col" aria-label="Selected deal">
          {selected && <DealTicket ctx="side" {...ticketProps(selected)} />}
        </aside>
      </div>
    </>
  );
}

/** Things to check before buying (risk flags), as one labelled badge. "Bring a parent" is a note, not a risk. */
function CheckBadge({ flags, short }: { flags: string[]; short?: boolean }) {
  const risks = flags.filter((f) => !/parent/i.test(f));
  if (!risks.length) return null;
  const label = `${risks.length} thing${risks.length > 1 ? "s" : ""} to check`;
  return (
    <span className="badge warn" title={risks.join(" · ")}>
      <TriIcon size={13} />
      {short ? `${risks.length} to check` : label}
    </span>
  );
}
