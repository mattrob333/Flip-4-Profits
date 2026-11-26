import { Ledger } from "@/components/stuff/Ledger";
import { StuffView } from "@/components/stuff/StuffView";
import { getBalance, getLedger, listHoldings, listSold } from "@/lib/ledger";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Stuff · Flip 4 Profits" };

export default async function StuffPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tab = sp.tab === "ledger" || sp.tab === "sold" ? sp.tab : "hold";
  const b = getBalance();
  const holdings = listHoldings();
  const sold = listSold();
  const ledger = getLedger();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Stuff</h1>
          <p>
            {holdings.length} holding · {sold.length} sold · {money(b.cash)} cash
          </p>
        </div>
      </div>
        <StuffView
          initialTab={tab}
          holdings={holdings}
          sold={sold}
          ledger={<Ledger entries={ledger} cashCents={b.cash} />}
        />
    </>
  );
}
