import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { InfoPageShell } from "@/components/store/info-page-shell";
import { RichText } from "@/components/store/rich-text";
import { getContentPage } from "@/lib/data/pages";
import { getStoreSettings } from "@/lib/data/store";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Kontak dan Lokasi" };

export default async function ContactPage() {
  const [page, s] = await Promise.all([
    getContentPage("contact"),
    getStoreSettings(),
  ]);

  const waUrl = s.whatsappNumber
    ? buildWhatsAppUrl(s.whatsappNumber, `Halo ${s.storeName}, saya ingin bertanya.`)
    : null;

  const mapsUrl =
    s.mapUrl ??
    (s.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`
      : null);

  const socials = [
    { label: "Instagram", href: s.instagramUrl },
    { label: "Facebook", href: s.facebookUrl },
    { label: "TikTok", href: s.tiktokUrl },
  ].filter((x): x is { label: string; href: string } => Boolean(x.href));

  return (
    <InfoPageShell title={page?.title ?? "Kontak"} wide>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
        <div className="space-y-10">
          {page && <RichText content={page.content} />}

          <section id="lokasi" className="scroll-mt-28">
            <h2 className="mb-5 text-2xl font-extrabold">
              Lokasi dan jam operasional
            </h2>
            <div className="space-y-6">
              {s.address && (
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist">
                    <MapPin className="size-5" aria-hidden />
                  </span>
                  <div className="text-sm">
                    <h3 className="font-bold">Alamat toko</h3>
                    <p className="mt-1 leading-relaxed text-neutral-700">
                      {s.address}
                    </p>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block font-semibold underline underline-offset-4"
                      >
                        Buka di Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {s.openingHours && (
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist">
                    <Clock className="size-5" aria-hidden />
                  </span>
                  <div className="text-sm">
                    <h3 className="font-bold">Jam operasional</h3>
                    <p className="mt-1 whitespace-pre-line leading-relaxed text-neutral-700">
                      {s.openingHours}
                    </p>
                  </div>
                </div>
              )}

              {s.pickupInstructions && (
                <p className="rounded-2xl bg-mist p-5 text-sm leading-relaxed text-neutral-700">
                  <span className="font-bold">Petunjuk pengambilan: </span>
                  {s.pickupInstructions}
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl bg-mist p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Hubungi kami</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Cara tercepat adalah lewat WhatsApp.
          </p>

          <div className="mt-5 space-y-3">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800"
              >
                <MessageCircle className="size-4" aria-hidden />
                Chat via WhatsApp
              </a>
            )}
            {s.email && (
              <a
                href={`mailto:${s.email}`}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink text-sm font-semibold transition hover:bg-ink hover:text-paper"
              >
                <Mail className="size-4" aria-hidden />
                {s.email}
              </a>
            )}
          </div>

          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
              {socials.map((x) => (
                <li key={x.label}>
                  <a
                    href={x.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 hover:text-neutral-600"
                  >
                    {x.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </InfoPageShell>
  );
}