export type NavLink = { label: string; href: string };

export const NAV_LINKS: NavLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Semua Produk", href: "/products" },
  { label: "Tentang Kami", href: "/about" },
  { label: "Kontak", href: "/contact" },
  { label: "Cek Pesanan", href: "/orders" },
];

/** Apakah menu `href` sedang aktif untuk alamat `pathname`. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/products") {
    return (
      pathname === "/products" ||
      pathname.startsWith("/products/") ||
      pathname.startsWith("/categories/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}