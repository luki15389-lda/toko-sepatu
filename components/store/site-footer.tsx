import Link from "next/link";
import { getStoreSettings } from "@/lib/data/store";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const SHOP_LINKS = [{ label: "Semua Produk", href: "/products" }];

const INFO_LINKS = [
  { label: "Tentang Kami", href: "/about" },
  { label: "Kontak", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Kebijakan Toko", href: "/policies" },
];

export async function SiteFooter() {
  const s = await getStoreSettings();

  const socials = [
    { label: "Instagram", href: s.instagramUrl },
    { label: "Facebook", href: s.facebookUrl },
    { label: "TikTok", href: s.tiktokUrl },
  ].filter((x): x is { label: string; href: string } => Boolean(x.href));

  const waUrl = s.whatsappNumber
    ? buildWhatsAppUrl(
        s.whatsappNumber,
        `Halo ${s.storeName}, saya ingin bertanya.`
      )
    : null;

  return (
    <footer className="mt-16 bg-ink text-neutral-300">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight text-white">
            {s.storeName}
          </p>
          {(s.tagline || s.description) && (
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              {s.tagline ?? s.description}
            </p>
          )}
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {socials.map((x) => (
                <li key={x.label}>
                  <a
                    href={x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:text-white hover:underline"
                  >
                    {x.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Belanja">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Belanja
          </p>
          <ul className="space-y-2.5 text-sm">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Informasi">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Informasi
          </p>
          <ul className="space-y-2.5 text-sm">
            {INFO_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Kontak
          </p>
          <ul className="space-y-2.5 text-sm">
            {s.address && <li className="leading-relaxed">{s.address}</li>}
            {s.openingHours && (
              <li className="whitespace-pre-line leading-relaxed">
                {s.openingHours}
              </li>
            )}
            {waUrl && (
              <li>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline-offset-4 hover:underline"
                >
                  Chat via WhatsApp
                </a>
              </li>
            )}
            {s.email && (
              <li>
                <a href={`mailto:${s.email}`} className="hover:text-white">
                  {s.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-neutral-400 sm:px-6">
          {s.footerText ?? `© ${s.storeName}. Seluruh hak dilindungi.`}
        </p>
      </div>
    </footer>
  );
}