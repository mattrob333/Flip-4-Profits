// SQLite datetime('now') is UTC without a "Z", so add one before parsing.
export function parseDbDate(iso: string) {
  return new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
}

export default function TimeAgo({ iso }: { iso: string }) {
  const d = parseDbDate(iso);
  const secs = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  let text: string;
  if (secs < 60) text = "just now";
  else if (secs < 3600) text = `${Math.round(secs / 60)} min ago`;
  else if (secs < 86400) text = `${Math.round(secs / 3600)} hr ago`;
  else if (secs < 86400 * 7) text = `${Math.round(secs / 86400)} days ago`;
  else text = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return <time dateTime={d.toISOString()}>{text}</time>;
}
