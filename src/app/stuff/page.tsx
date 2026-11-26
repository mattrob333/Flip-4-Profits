import { Ledger } from "@/components/stuff/Ledger";
import { StuffView } from "@/components/stuff/StuffView";
import { getBalance, getGoal, getLedger, listHoldings, listSold } from "@/lib/ledger";
import { money } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Stuff · Flip 4 Profits" };

export default function StuffPage() {
  const b = getBalance();
  const holdings = listHoldings();
  const sold = listSold();
  const ledger = getLedger();
  const g = getGoal();
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
          holdings={holdings}
          sold={sold}
          ledger={<Ledger entries={ledger} cashCents={b.cash} />}
          goal={{ flips: b.flips, totalProfitCents: b.totalProfit, goalCents: g.goalCents, doneCents: g.doneCents }}
        />
    </>
  );
}
