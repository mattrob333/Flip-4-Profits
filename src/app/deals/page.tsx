import { DealsBoard } from "@/components/deals/DealsBoard";
import { HotList } from "@/components/deals/HotList";
import { Enter } from "@/components/Enter";
import { LockIcon } from "@/components/Icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "@/lib/categories";
import { dayKey, timeLabel, todayKey, dayLabel } from "@/lib/dates";
import { getCash, getHotList, lastScoutedAt, listDeals } from "@/lib/ledger";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deals · Flip 4 Profits" };

export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const deals = listDeals("scout");
  const cash = getCash();
  const hot = getHotList();
  const at = lastScoutedAt();
  const catParam = typeof sp.cat === "string" ? sp.cat : "all";
  const cat = catParam === "watching" || CATEGORIES.some((c) => c.id === catParam) ? catParam : "all";
  const sel = typeof sp.deal === "string" && /^\d+$/.test(sp.deal) ? Number(sp.deal) : null;
  const when = at ? (dayKey(at) === todayKey() ? `scouted today ${timeLabel(at)}` : `scouted ${dayLabel(dayKey(at))}`) : "not scouted yet";
  const sources = [...new Set(deals.map((d) => d.sourceLabel))];

  return (
    <Tabs defaultValue="scout">
      <div className="page-head">
        <div>
          <h1>Deals near Alpharetta</h1>
          <p>
            {deals.length} deal{deals.length === 1 ? "" : "s"} · {when} · {sources.length ? sources.join(", ") + ", eBay prices" : "eBay prices"}
          </p>
        </div>
        {/* Lanes. Wildcard (any cheap item matched to eBay comps) is coming soon. */}
        <TabsList aria-label="Deal lists" className="w-auto">
          <TabsTrigger value="scout">Scout picks</TabsTrigger>
          <TabsTrigger value="wildcard" disabled aria-describedby="wild-soon" className="inline-flex items-center gap-1.5">
            <LockIcon />
            Wildcard
            <span id="wild-soon" className="text-[12px] font-bold uppercase tracking-[.06em] text-t3">Soon</span>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="scout" tabIndex={-1} className="focus-visible:outline-none">
        {/* "Hot right now" (from nightly eBay sold data) shows here once it exists. */}
        <HotList items={hot} />
        <Enter screen="deals">
          <DealsBoard key={cat + ":" + (sel ?? "")} deals={deals} cashCents={cash} initialCat={cat} initialSel={sel} />
        </Enter>
      </TabsContent>
    </Tabs>
  );
}
