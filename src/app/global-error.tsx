"use client";

// Last-resort error page (when even the top bar can't load). Plain styles on purpose.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/hanken-grotesk";
import "./globals.css";
import { ErrorPanel } from "@/components/ErrorPanel";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main>
          <div className="wrap">
            <ErrorPanel reset={reset} what="Flip 4 Profits" />
          </div>
        </main>
      </body>
    </html>
  );
}
