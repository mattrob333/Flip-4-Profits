# AGENTS.md: how to build Flip 4 Profits

How it should **look** lives in `DESIGN.md` (keep the two separate). The picked
design is mockup B, "Trading Desk" (`flip-dashboard-2026-11-26/mockup/b.html`).

## Stack
- Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS v4.
- SQLite via `better-sqlite3` (sync, server only). `output: "standalone"`.
- UI kit: shadcn/ui pattern, hand-written in `src/components/ui/` (the shadcn CLI
  can't reach its registry here): `cn()` (clsx + tailwind-merge), `class-variance-authority`,
  Radix primitives (`react-dialog` for the sell sheet, `react-tabs`, `react-toggle-group`, `react-slot`).
- Fonts are self-hosted from npm (`@fontsource-variable/archivo` wdth file,
  `hanken-grotesk`, `martian-mono`). No Google Fonts, no `next/font/google`.
- No paid services, no API keys.

## Commands
| | |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` / `npm start` | production build / run (`node .next/standalone/server.js` also works after copying `.next/static`) |
| `npm test` | `node --test` + `tsx`, tests in `tests/*.test.ts` (ledger math). Uses a temp `DATA_DIR`. |
| `npm run lint`, `npx tsc --noEmit` | must pass |
| `npm run seed:reset` / `npm run seed:demo` | wipe to fresh ($500) / mid-game demo |
| `npm run build:seed` | bundles `scripts/seed.ts` to `dist/seed.cjs` (used in Docker) |

All four checks (lint, tsc, test, build) must pass before you hand work back.

## Layout of the code
- `src/lib/db.ts`: schema, small column migrations (`ADDED_COLUMNS`), `getDb()`, `resetDb()`. `DATA_DIR` env, default `./data`.
- `src/lib/seed.ts`: fresh seed (7 sample deals) and demo seed.
- `src/lib/ledger.ts`: every read (view shapes: `DealView`, `HoldingView`, `LedgerEntry`, `getWorthSeries`) and every write (buy, sell, watch/skip, notes, listed, lesson, ask parent, goal). Throws `LedgerError(message, field)` for user mistakes.
- `src/lib/money.ts`, `goal.ts`, `dates.ts`: pure helpers, safe in client components.
- `src/app/actions.ts`: server actions. Return `{ ok: true, data } | { ok: false, error, field }`; `field` puts the error under the right input. Always `revalidatePath("/", "layout")` after a write.
- Pages are server components that read SQLite directly (`dynamic = "force-dynamic"`); interactive parts are client components that get plain data as props and call actions. No mock data in the client.
- Routes: `/` Home, `/deals`, `/stuff`. Each has `loading.tsx`; `error.tsx` + `global-error.tsx` say "Your money is safe".

## Money rules (do not break)
- **Money is integer cents everywhere** (DB, props, actions). Convert only at the edge: `parseMoney()` for input, `money()` / `signed()` for display.
- Cash = `SUM(transactions.amount_cents)`. Buys are negative, sells positive, fees a separate negative `fee` row (shown merged with its sale in the ledger).
- Worth = cash + what you paid for items still held. **A buy never changes worth.**
- Profit = sold for − fees − paid. A buy can't cost more than cash. Sell price > $0, 0 ≤ fees < price.
- Every write happens inside a DB transaction and logs to `activity_log` (the parent reads it): lessons after a loss are `kind = 'lesson'`.

## UI rules (summary; details in DESIGN.md)
- Tokens only (`--s0..s3`, `--t1..t3`, `--accent`, `--profit`, `--loss`, `--warn`, `--info`) in `globals.css`; screen styles are ported from mockup B under `@layer components` so Tailwind utilities can override them.
- Green = money gained only; yellow accent = actions only; profit always with + and ▲, loss with − and ▼.
- Thumbnails are drawn SVG tiles (`Thumb.tsx`), never emoji. The `emoji` DB column is legacy and unused.
- Motion: number ticks, flashes, stamps, goal fill, entrance stagger; everything off under `prefers-reduced-motion` (CSS kill switch + `prefersReducedMotion()` in JS). Never `transition: all`.
- 44px targets, visible labels, `inputmode="decimal"`, errors under fields, `role=status` toasts.
- Plain short words a 13-year-old reads fast. Verb + amount buttons ("Buy for $90").

## Coming next (room is already made)
- Deals lanes: `deals.lane` = `scout` | `wildcard`. The Wildcard tab is visible but disabled ("Soon").
- "Hot right now": `getHotList()` reads `market_snapshots` + `saved_searches`; `components/deals/HotList.tsx` renders above the deals when there is data, nothing otherwise.
- Scraping (Craigslist / FB / eBay comps) will insert into `deals`; the partial-source banner style (`.banner`) is ready.
