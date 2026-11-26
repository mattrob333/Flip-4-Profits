"use client";

// My Stuff: Holding / Sold / Ledger. Tabs under 1024px; all three side by side above.
import * as React from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ProductImage";
import { HoldingCard } from "./HoldingCard";
import { SellSheet } from "./SellSheet";
import { useEnterOnce } from "@/components/Enter";
import { dayLabel } from "@/lib/dates";
import { money, signed, tri } from "@/lib/money";
import type { HoldingView, SoldView } from "@/lib/ledger";

export function StuffView({
  initialTab = "hold",
  holdings,
  sold,
  ledger,
}: {
  initialTab?: string;
  holdings: HoldingView[];
  sold: SoldView[];
  ledger: React.ReactNode;
}) {
  const [tab, setTab] = React.useState(initialTab);
  const [selling, setSelling] = React.useState<HoldingView | null>(null);
  const [open, setOpen] = React.useState(false);
  const total = sold.reduce((a, s) => a + s.profitCents, 0);
  const enterRef = useEnterOnce<HTMLDivElement>("stuff");

  return (
    <Tabs ref={enterRef} value={tab} onValueChange={setTab} className="stuff enter">
      <div className="stuff-tabs">
        <TabsList aria-label="My Stuff sections">
          <TabsTrigger value="hold">Holding ({holdings.length})</TabsTrigger>
          <TabsTrigger value="sold">Sold ({sold.length})</TabsTrigger>
          <TabsTrigger value="ledger">Money log</TabsTrigger>
        </TabsList>
      </div>
      <div className="left">
        <TabsContent value="hold" forceMount className="pane">
          <div className="sec-head">
            <h2>Holding</h2>
            <span className="cap">Counted at what you paid</span>
          </div>
          <div className="flex flex-col gap-4">
            {holdings.length ? (
              holdings.map((h) => (
                <HoldingCard
                  key={h.id}
                  item={h}
                  onSell={() => {
                    setSelling(h);
                    setOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="empty">
                <h3>Nothing to sell yet</h3>
                <p>Things you buy land here, ready to sell for more.</p>
                <Button asChild>
                  <Link href="/deals">Find deals</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="sold" forceMount className="pane">
          <div className="sec-head">
            <h2>Sold</h2>
            {sold.length > 0 && (
              <span className="cap">
                Total <b className={(total >= 0 ? "up" : "down") + " tab"}>{signed(total)}</b>
              </span>
            )}
          </div>
          {sold.length ? (
            <ul className="rows">
              {sold.map((s) => (
                <li key={s.id} className="srow">
                  <ProductImage kind={s.thumb} photoUrl={s.photoUrl} size={64} />
                  <div className="min-w-0">
                    <div className="dt">{s.title}</div>
                    <div className="dm">
                      Paid {money(s.buyCents)} → Sold {money(s.sellCents)}
                      {s.feesCents ? ` · ${money(s.feesCents)} fees` : ""} · {dayLabel(s.soldKey)}
                    </div>
                  </div>
                  <div className="pr">
                    <span className={"num " + (s.profitCents >= 0 ? "up" : "down")}>{signed(s.profitCents)}</span>
                    <span className={"cap " + (s.profitCents >= 0 ? "up" : "down")}>
                      {s.profitCents >= 0 ? "profit" : "loss"} {tri(s.profitCents)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h3>No sales yet</h3>
              <p>Your first flip shows up here with the profit you made.</p>
            </div>
          )}
        </TabsContent>
      </div>
      <TabsContent value="ledger" forceMount className="pane ledger-pane">
        {ledger}
      </TabsContent>
      {selling && <SellSheet key={selling.id} item={selling} open={open} onOpenChange={setOpen} />}
    </Tabs>
  );
}
