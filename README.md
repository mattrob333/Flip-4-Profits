# Flip 4 Profits

A practice app for learning to flip things for profit. You start with $500 of
pretend cash, look at deals near Alpharetta, "buy" them, then sell them and watch
your money change. Nothing real is bought or sold.

Screens: **Home** (your worth, goal, what happened), **Deals** (things to flip),
**My Stuff** (what you hold, what you sold, every dollar in and out).

## Run it on this computer (npm)

You need Node.js 20 or newer.

```bash
npm install
npm run build
npm start            # open http://localhost:3000
```

For working on the code, use `npm run dev` instead of build + start.

To use it from a tablet on the home Wi-Fi, open `http://<this-computer's-IP>:3000`.

## Run it with Docker Compose

```bash
docker compose up -d --build    # open http://localhost:3000
docker compose logs -f          # see what it's doing
docker compose down             # stop (your data stays)
```

## Start over, or load the demo

| What | npm | Docker Compose |
|---|---|---|
| Fresh start: $500 and the 7 sample deals | `npm run seed:reset` | `docker compose exec app node seed.cjs fresh` |
| Demo (mid-game): drill bought $80 and sold $155, leaf blower held at $35 | `npm run seed:demo` | `docker compose exec app node seed.cjs demo` |

Both wipe the current game. Reload the page afterwards.

## Where the data lives

Everything is in one SQLite file, `flip.db`:

- npm: `./data/flip.db` in this folder. Set `DATA_DIR=/some/folder` to put it somewhere else.
- Docker Compose: the `flip-data` volume, mounted at `/data` in the container.
  Back it up with `docker compose cp app:/data/flip.db ./flip-backup.db`.

Money is stored in whole cents. The first time the app opens an empty folder,
it creates a fresh game ($500).

## Settings (environment)

| Variable | Default | What it does |
|---|---|---|
| `DATA_DIR` | `./data` (Docker: `/data`) | Folder for `flip.db` |
| `APP_TZ` | `America/New_York` | Time zone for "Today" and dates |
| `STARTING_BANKROLL_CENTS` | `50000` | Starting cash for a fresh game |
| `PORT` | `3000` | Web port |

The profit goal ("Make $100 profit") is stored in the database (`settings.goal_cents`)
and moves up by itself when it is reached ($100, then $250, $500, ...).

## Checks

```bash
npm test        # ledger math tests
npm run lint
npx tsc --noEmit
```

See `AGENTS.md` for how the code is built and `DESIGN.md` for how it should look.
