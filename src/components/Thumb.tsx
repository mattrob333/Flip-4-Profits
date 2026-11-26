// Drawn product tiles (no emoji, no photos yet): a simple silhouette on a
// category-tinted tile with a 1px inset outline. Real photos can replace the
// SVG later without layout shift (same box).
import { categoryOf } from "@/lib/categories";

const G: Record<string, string> = {
  drill: '<path d="M3.5 6.5h10.5a2 2 0 0 1 2 2V10a2 2 0 0 1-2 2H3.5z"/><path d="M16 7.75h2.5v3.5H16"/><path d="M18.5 9.5H22"/><path d="M9 12l-1.25 6h-3.5L5.5 12"/><rect class="d" x="3.25" y="18" width="6.5" height="3" rx=".75"/>',
  ebike: '<circle cx="5.5" cy="16" r="3.5"/><circle cx="18.5" cy="16" r="3.5"/><path d="M5.5 16L9 9.5h7l2.5 6.5"/><path d="M9 9.5l3 6.5H5.5"/><path d="M12 16l4-6.5"/><path d="M16 9.5L15 6h2.5"/><path d="M7.5 7.5h3M9 7.5v2"/><rect class="d" x="10" y="7.6" width="5" height="2.4" rx=".6"/>',
  handheld: '<rect x="6" y="6" width="12" height="12" rx="1"/><rect x="7.75" y="8" width="8.5" height="8" rx=".5"/><path class="d" d="M6 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2z"/><path d="M18 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/><circle cx="20" cy="9.5" r=".5"/>',
  blower: '<path d="M3 11a4 4 0 0 1 4-4h3.5a3 3 0 0 1 3 3v2.5a3.5 3.5 0 0 1-3.5 3.5H7a4 4 0 0 1-4-4z"/><path d="M13.5 10.5L22 8v3l-8.5 2.5"/><path d="M6 7V4.5h5V7"/><rect class="d" x="4" y="16.5" width="6" height="3" rx=".75"/>',
  binder: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18"/><rect x="10" y="6" width="3.5" height="5" rx=".5"/><rect class="d" x="15" y="6" width="3.5" height="5" rx=".5"/><rect x="10" y="13" width="3.5" height="5" rx=".5"/><rect x="15" y="13" width="3.5" height="5" rx=".5"/>',
  earbuds: '<rect x="4.5" y="8" width="15" height="11" rx="5"/><path d="M4.5 12h15"/><circle class="d" cx="12" cy="15.5" r="1.1"/><path d="M8 8V5.5M16 8V5.5"/>',
  consolebox: '<path d="M2.5 10l3-3.5h16l-3 3.5z"/><path d="M2.5 10h16v7h-16z"/><path d="M18.5 17l3-3.5v-7"/><path class="dl" d="M5 13.5h7"/>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5"/><path d="M12 12v9"/>',
};

export function Thumb({ kind, category, size }: { kind: string; category: string; size: number }) {
  const c = categoryOf(category) ?? { bg: "#222823", line: "#ADB4AA" };
  const inner = (G[kind] ?? G.box)
    .replace(/class="d"/g, `fill="${c.line}" stroke="${c.line}"`)
    .replace(/class="dl"/g, `stroke="${c.line}" stroke-width="2.5"`);
  const radius = size >= 80 ? 16 : size >= 60 ? 14 : 12;
  return (
    <span className="thumb" style={{ width: size, height: size, background: c.bg, borderRadius: radius }} aria-hidden="true">
      <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: inner }} />
    </span>
  );
}
