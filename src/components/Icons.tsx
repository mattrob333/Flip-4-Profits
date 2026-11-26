// Line icons on a 24 grid, one stroke weight. aria-hidden: always paired with text.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size: number, sw: number, p: P) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p,
});

export const TriIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, 2, p)}><path d="M12 3.5L2.5 20h19z" /><path d="M12 10v4.5" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></svg>
);
export const ArrowIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, 2, p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const BookmarkIcon = ({ size = 18, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, 1.9, p)} fill={filled ? "currentColor" : "none"}><path d="M6 3.5h12v17l-6-4-6 4z" /></svg>
);
export const XIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, 2, p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ChevIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, 2, p)}><path d="M9 6l6 6-6 6" /></svg>
);
export const SortIcon = ({ up, ...p }: P & { up?: boolean }) => (
  <svg className="ar" {...base(12, 2.5, p)}>{up ? <path d="M12 19V5M6 11l6-6 6 6" /> : <path d="M12 5v14M6 13l6 6 6-6" />}</svg>
);
export const FilterIcon = ({ size = 18, ...p }: P) => (
  <svg {...base(size, 1.9, p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);
export const CheckIcon = ({ size = 16, ...p }: P) => (
  <svg {...base(size, 2.5, p)}><path d="M5 12.5l4.5 4.5L19 7" /></svg>
);
export const HomeIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, 1.75, p)}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>
);
export const TagIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, 1.75, p)}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></svg>
);
export const BoxIcon = ({ size = 22, ...p }: P) => (
  <svg {...base(size, 1.75, p)}><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z" /><path d="M3 7.5l9 4.5 9-4.5" /><path d="M12 12v9" /></svg>
);
export const LockIcon = ({ size = 14, ...p }: P) => (
  <svg {...base(size, 2, p)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
