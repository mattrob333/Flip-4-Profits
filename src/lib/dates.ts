// Dates are stored in SQLite as UTC "YYYY-MM-DD HH:MM:SS".
// We show them in the family's time zone (Atlanta by default).

export const APP_TZ = process.env.APP_TZ || "America/New_York";

/** SQLite datetime('now') is UTC without a "Z", so add one before parsing. */
export function parseDbDate(iso: string) {
  return new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
}

/** UTC timestamp for SQLite, `offsetDays` from now. */
export function dbTime(d: Date = new Date()) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

const keyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Local calendar day "YYYY-MM-DD" for a date or SQLite string. */
export function dayKey(d: Date | string) {
  const date = typeof d === "string" ? parseDbDate(d) : d;
  return keyFmt.format(date);
}

export function todayKey() {
  return dayKey(new Date());
}

/** Add whole days to a day key. */
export function addDays(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Whole days from a to b (b later = positive). */
export function daysBetween(a: string, b: string) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Nov 21" */
export function dayLabel(key: string) {
  const [, m, d] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

/** "Today" or "Nov 21" */
export function dayLabelRel(key: string, today = todayKey()) {
  return key === today ? "Today" : dayLabel(key);
}

/** "9:40 AM" in the app time zone. */
export function timeLabel(iso: string) {
  return parseDbDate(iso).toLocaleTimeString("en-US", {
    timeZone: APP_TZ,
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "today", "yesterday", "3 days ago" */
export function agoLabel(key: string, today = todayKey()) {
  const n = daysBetween(key, today);
  if (n <= 0) return "today";
  if (n === 1) return "yesterday";
  return `${n} days ago`;
}
