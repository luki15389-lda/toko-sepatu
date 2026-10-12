export type NavId = "home" | "products" | "about" | "contact" | "orders";
export type NavLink = { id: NavId; label: string; href: string };

export const NAV_LINKS: NavLink[] = [
  { id: "home", label: "Beranda", href: "/" },
  { id: "products", label: "Semua Produk", href: "/products" },
  { id: "about", label: "Tentang Kami", href: "/about" },
  { id: "contact", label: "Kontak", href: "/contact" },
  { id: "orders", label: "Cek Pesanan", href: "/orders" },
];