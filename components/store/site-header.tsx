import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { CartButton } from "@/components/store/cart-button";
import { MobileNav } from "@/components/store/mobile-nav";
import { getStoreSettings } from "@/lib/data/store";
import { NAV_LINKS } from "@/lib/nav";

export async function SiteHeader() {
  const settings = await getStoreSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <MobileNav links={NAV_LINKS} storeName={settings.storeName} />

        <Link href="/" aria-label={`${settings.storeName} - Beranda`}>
          <Logo name={settings.storeName} />
        </Link>

        <nav aria-label="Menu utama" className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.href}
                  data-nav={link.id}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-mist hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form
          action="/products"
          method="get"
          role="search"
          className="ml-auto hidden w-full max-w-xs md:block"
        >
          <label htmlFor="header-search" className="sr-only">
            Cari sepatu
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
              aria-hidden
            />
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder="Cari sepatu..."
              className="h-10 w-full rounded-full bg-mist pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-ink/20"
            />
          </div>
        </form>

        <CartButton />
      </div>
    </header>
  );
}