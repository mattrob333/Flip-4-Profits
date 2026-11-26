// Categories Scout knows about. `thumb` is the default drawing for ProductImage
// when a deal has no thumb_key; `bg` / `line` are legacy tile colors (unused).
export const CATEGORIES = [
  { id: "ebikes", label: "E-bikes", bg: "#1D2A28", line: "#6CCBB9", thumb: "ebike" },
  { id: "tools", label: "Tools", bg: "#2B2620", line: "#E0A85A", thumb: "drill" },
  { id: "consoles", label: "Consoles", bg: "#22232F", line: "#9BA3F0", thumb: "consolebox" },
  { id: "cards", label: "Cards", bg: "#2C2229", line: "#E58DB8", thumb: "binder" },
  { id: "electronics", label: "Electronics", bg: "#222A22", line: "#93CF83", thumb: "earbuds" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryOf(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function categoryLabel(id: string) {
  return categoryOf(id)?.label ?? id;
}

export const SOURCE_LABEL: Record<string, string> = {
  craigslist: "Craigslist",
  facebook: "FB Marketplace",
  ebay: "eBay",
  retail: "Retail clearance",
  mock: "Sample",
};

export function sourceLabel(id: string) {
  return SOURCE_LABEL[id] ?? id;
}
