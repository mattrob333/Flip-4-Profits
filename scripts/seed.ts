// Reset the database.
//   npm run seed:reset  -> fresh start: $500 and the 7 sample deals
//   npm run seed:demo   -> mid-game sample (drill bought $80, sold $155; leaf blower held at $35)
// Uses DATA_DIR if set (default ./data). Stop the app first, or restart it after.
import { resetDb, closeDb, dataDir } from "../src/lib/db";
import { getBalance } from "../src/lib/ledger";

const mode = process.argv[2] === "demo" ? "demo" : "fresh";
resetDb(mode);
const b = getBalance();
const d = (c: number) => "$" + (c / 100).toFixed(0);
console.log(`Reset ${dataDir()}/flip.db to the ${mode === "demo" ? "demo (mid-game)" : "fresh start"} state.`);
console.log(`Cash ${d(b.cash)} · your stuff ${d(b.inventoryCost)} · worth ${d(b.netWorth)} · profit ${d(b.totalProfit)}`);
closeDb();
