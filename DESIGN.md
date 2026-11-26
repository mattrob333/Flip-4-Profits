# DESIGN.md: Flip 4 Profits

How the app should look. (How to build it lives in AGENTS.md in the repo.)

## Reference apps (screens in design-references/, sourced from Mobbin)

### 1. StockX (stockx-product.webp, stockx-price-history.webp): the resale market
- **Layout:** product first, then two big side-by-side price blocks: green "$106 Buy" and black "$152 Sell". The buy/sell spread is the whole story and it is visible in one glance.
- **Signal strip:** "This product is selling fast: 843 purchases in the last 3 days" in a tinted yellow box with a bolt icon. Demand is shown as a fact, not a score.
- **Proof:** "Last sale $144 ▲ $27 (23.08%)" under the product. Price history chart with 1M/3M/6M/1YR/YTD chips, one dark-green line with a soft fill.
- **Type/color:** black, white, one deep green. Bold numbers, regular labels. Square-ish 4-6px radii. Very little decoration.
- **Steal:** the Buy-vs-Sell pair as the core deal visual; "last sale" proof line; one-color line chart.

### 2. Greenlight (greenlight-home.webp): money app for kids, parent managed
- **Layout:** stacked white cards on a pale tint, each card = one idea with icon + title + one line + action. Two-up cards for "Chores / Jobs".
- **Tone:** friendly but not babyish; "Level Up: the fun way to learn" with one bold illustrated badge as the only loud thing on the screen.
- **Color:** deep teal primary + mint tint, lots of white. Rounded 16px cards. Icons in small tinted squares.
- **Steal:** one-idea-per-card; a single loud learning badge; parent/kid roles shown clearly.

### 3. Duolingo (duolingo-quests.webp, duolingo-progress.webp): progress that feels like a game
- **Layout:** quest cards with a title, a thick rounded progress bar with the number inside ("33 / 50"), and a reward icon on the right. Time left in small caps ("16 DAYS").
- **Buttons:** chunky, full-width, ALL-CAPS, with a solid darker "lip" under them (3D press) instead of a glow.
- **Color:** saturated flat colors per feature (pink quest, green field, blue button), no gradients. Strong contrast.
- **Steal:** goals as progress bars with the number inside; chunky lip buttons; celebratory copy ("I can do it").

### 4. Whatnot (whatnot-home.webp): collectibles marketplace for a young audience
- **Layout:** search on top, a row of square category tiles with real product photos (Electronics, Pokémon Cards), a "Get started: step 3 of 4" progress card, then a 2-column feed of image-first tiles with a red "Live · 387" badge.
- **Color:** black/white base with one loud yellow (selected category, gift icon) and red for live.
- **Steal:** category tiles with real images, not icons; image-first deal tiles; step-progress card for onboarding.

### 5. Monarch (monarch-networth.webp): net worth dashboard
- **Layout:** "Net worth $11,163.04 ↗ $11,036.78 1 month change" headline, then one wide area chart, then grouped account lists with tiny sparklines and right-aligned amounts. Summary panel on the right with a stacked bar (Investments vs Cash).
- **Type:** one large number, small grey change text, tabular right-aligned money columns.
- **Steal:** one big number + change line + one chart (not 4 stat cards); stacked bar to split cash vs inventory; right-aligned tabular money.

## Shared rules (every screen)

**Feel:** a trading app a 13-year-old is proud to show friends. StockX clarity + Duolingo reward + Greenlight warmth. Dark first.

**Hierarchy**
- One hero number per screen. Dashboard: total worth. Deal: profit. Sell: profit preview.
- Buy price vs sell price always appear as a pair (StockX), with profit as the result.
- Group gap >= 2x item gap (e.g. 8px inside cards, 16-24px between cards, 32-48px between sections).

**Type**
- No Inter, no Roboto/Arial look. Self-host with @fontsource (no Google Fonts call at runtime).
- A characterful display face for numbers and headings, a clean grotesk for body, tabular numerals on every price, counter and table.
- Body >= 16px; captions 13px; nothing under 12px. Headings >=24px get -0.01 to -0.02em tracking. Small uppercase labels get +0.05em.
- `text-wrap: balance` on headings, `pretty` on descriptions.

**Color**
- Semantic tokens only: `--surface-0/1/2`, `--text-1/2/3`, `--accent` (brand), `--profit`, `--loss`, `--warn`, `--info`. Built as a real dark palette, not an inverted light one.
- Profit is green and always paired with a "+" and ▲; loss is red/coral with "−" and ▼; warnings (risk flags) are amber with an icon. Never color alone.
- Accent used for primary actions only. One loud color per screen (Greenlight/Whatnot rule).
- Flat fills. Tints for backgrounds of badges/flags.

**Surfaces & shape**
- Depth from layered transparent rings/shadows, not heavy borders (dark ring `0 0 0 1px rgb(255 255 255 / .08)`, hover .12). Real borders only on inputs and table dividers.
- Concentric radii: outer = inner + padding. Cards 16-20px, inner chips 8-12px.
- Image/emoji tiles get a 1px inset outline at white 10%.

**Motion**
- Press: scale .96, 150ms ease-out (disabled never scales). Hover color <=150ms, inside `@media (hover:hover)`.
- Money changes animate (count up/down, ~600ms) and the changed number flashes its profit/loss tint once. This is the reward moment.
- Entrances: stagger 100ms, opacity + 4px blur + 12px rise, 300ms, only on first visit to a screen. Everything off under `prefers-reduced-motion`.
- Never `transition: all`.

**Words**
- Plain, short, says "you". Verb-first buttons with the amount: "Buy for $90", "Sell for $155", "Watch", "Skip".
- Jargon gets a one-line hint: "Fees: money the selling site keeps."
- Losses are lessons: "You lost $12. What would you do next time?"
- Empty states explain what goes there and give one action.

**Access**
- 44px touch targets; native buttons/links; visible focus ring in accent; every input has a visible label; numeric inputs use `inputmode="decimal"` and 16px text.
- Works at 375px first, then tablet (768), laptop (1280), desktop (1440/1920).

## AI-look ban (if it looks like every other AI site, start over)
- No Inter. No purple or purple-to-blue gradients. No gradient hero backgrounds.
- No glowing / neon-shadow buttons. No glassmorphism blur cards as decoration.
- No serif headline with one italic word.
- No row of four identical stat cards. (Three equal stat cards in a row is also suspect; prefer one hero number + supporting details.)
- No emoji as design elements (plan-design-review blacklist). Item thumbnails use real photos when scraping exists; until then, drawn product tiles (simple SVG silhouette on a category-tinted tile), not emoji.
- No app UI made of uniform stacked cards; no uniform corner radius on everything; no system-ui as the primary font; no centered-everything layouts; no pure #000 background.
- No generic "Welcome back 👋" header, no sparkles icon for AI.
