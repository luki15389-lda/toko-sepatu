"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, type NavLink } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {links.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                active
                  ? "bg-ink text-paper"
                  : "text-neutral-700 hover:bg-mist hover:text-ink"
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}