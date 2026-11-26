"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, HomeIcon, TagIcon } from "./Icons";

const LINKS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/deals", label: "Deals", Icon: TagIcon },
  { href: "/stuff", label: "My Stuff", Icon: BoxIcon },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

/** Top nav from 768px up. */
export function TopNav() {
  const isActive = useActive();
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Bottom tab bar under 768px. */
export function BottomTabs() {
  const isActive = useActive();
  return (
    <nav className="tabs" aria-label="Main">
      {LINKS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}>
          <span className="tab-ic">
            <Icon />
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export default TopNav;
