import type { Metadata, Viewport } from "next";
import Link from "next/link";
// Self-hosted fonts (no Google Fonts call): Archivo with the width axis for numbers
// and headings, Hanken Grotesk for body, Martian Mono for ledger dates.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/martian-mono";
import "./globals.css";
import { TopNav, BottomTabs } from "@/components/NavLinks";
import { CashPill } from "@/components/CashPill";
import { ToastProvider } from "@/components/ui/toast";
import { getCash } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Flip 4 Profits",
  description: "Find deals, buy low, sell high, and watch your money grow. Practice cash, real lessons.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F1210",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cash = getCash();
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <header className="top">
            <div className="wrap">
              <Link className="mark" href="/" aria-label="Flip 4 Profits, home">
                <span>FLIP</span>
                <span className="tag4">4</span>
                <span>PROFITS</span>
              </Link>
              <TopNav />
              <CashPill cents={cash} />
            </div>
          </header>
          <main>
            <div className="wrap">{children}</div>
          </main>
          <BottomTabs />
        </ToastProvider>
      </body>
    </html>
  );
}
