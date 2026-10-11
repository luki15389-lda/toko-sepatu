import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MapPin,
  MessageCircle,
  PackageCheck,
  Store,
} from "lucide-react";
import { SafeImage } from "@/components/shared/safe-image";
import { ProductSection } from "@/components/store/product-section";
import { getStoreSettings } from "@/lib/data/store";
import {
  getBestSellingProducts,
  getFeaturedProducts,
  getHomeCategories,
  getLatestProducts,
} from "@/lib/data/products";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const ADVANTAGES = [
  {
    icon: PackageCheck,
    title: "Stok per ukuran",
    text: "Ketersediaan setiap ukuran selalu terbarui.",
  },
  {
    icon: Store,
    title: "Ambil di toko",
    text: "Pesan online, ambil langsung tanpa menunggu pengiriman.",
  },
  {
    icon: MessageCircle,
    title: "Konfirmasi personal",
    text: "Penjual mengonfirmasi pesanan Anda lewat WhatsApp.",
  },
  {
    icon: BadgeCheck,
    title: "Pembayaran terverifikasi",
    text: "Setiap pembayaran dicek dan dicatat oleh admin toko.",
  },
];

export default async function HomePage() {
  const [settings, categories, featured, latest, bestSelling] =
    await Promise.all([
      getStoreSettings(),
      getHomeCategories(),
      getFeaturedProducts(4),
      getLatestProducts(4),
      getBestSellingProducts(4),
    ]);

  const waUrl = settings.whatsappNumber
    ? buildWhatsAppUrl(
        settings.whatsappNumber,
        `Halo ${settings.storeName}, saya ingin bertanya tentang produk.`
      )
    : null;

  const mapsUrl =
    settings.mapUrl ??
    (settings.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
      : null);

  const steps = [
    {
      title: "Pilih sepatu dan ukuran",
      text: "Telusuri koleksi, pilih ukuran, lalu masukkan ke keranjang.",
    },
    {
      title: "Buat pesanan",
      text: "Isi nama dan nomor WhatsApp. Pesanan Anda tercatat dengan nomor unik.",
    },
    {
      title: "Konfirmasi lewat WhatsApp",
      text: "Kirim pesan yang sudah disiapkan ke penjual untuk konfirmasi stok dan pembayaran.",
    },
    {
      title: "Bayar dan ambil di toko",
      text: `Pembayaran sesuai kesepakatan (DP ${settings.dpPercentage}% atau lunas, sesuai persetujuan penjual). Ambil pesanan di toko.`,
    },
  ];

  return (
    <>
      {/* HERO */}
      <section className="border-b border-stone-line">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-12">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em]">
              <span className="inline-block h-0.5 w-8 bg-accent" aria-hidden />
              Koleksi sneakers
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Sneakers pilihan,
              <br />
              siap kamu bawa pulang.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-600">
              {settings.tagline ??
                "Pesan online, konfirmasi lewat WhatsApp, lalu ambil langsung di toko."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-semibold text-paper transition hover:bg-neutral-800"
              >
                Belanja Sekarang
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#cara-pesan"
                className="inline-flex h-12 items-center rounded-full border border-stone-300 px-7 text-sm font-semibold transition hover:border-ink"
              >
                Cara memesan
              </a>
            </div>
          </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-mist lg:aspect-auto lg:h-[420px]">
            {/* Letakkan foto hero di public/images/hero.jpg.
                Selama file itu belum ada, placeholder yang tampil. */}
            <SafeImage
              src="/images/hero.jpg"
              alt="Koleksi sneakers pilihan"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* KATEGORI */}
      {categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <h2 className="mb-8 text-2xl font-extrabold sm:text-3xl">
            Belanja per kategori
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  className={cn(
                    "group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-mist p-4 transition",
                    !c.imageUrl && "hover:bg-ink hover:text-paper"
                  )}
                >
                  {c.imageUrl && (
                    <>
                      <SafeImage
                        src={c.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                      />
                    </>
                  )}
                  <span className={cn("relative", c.imageUrl && "text-white")}>
                    <span className="block text-lg font-bold">{c.name}</span>
                    <span
                      className={cn(
                        "text-xs",
                        c.imageUrl ? "text-white/80" : "opacity-70"
                      )}
                    >
                      {c.productCount} produk
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* PRODUK */}
      <ProductSection
        title="Produk unggulan"
        description="Pilihan utama dari toko kami."
        products={featured}
        href="/products"
        lowStockThreshold={settings.lowStockThreshold}
      />
      <ProductSection
        title="Produk terbaru"
        products={latest}
        href="/products?sort=newest"
        lowStockThreshold={settings.lowStockThreshold}
      />
      <ProductSection
        title="Produk terlaris"
        description="Paling banyak dipesan pelanggan."
        products={bestSelling}
        href="/products"
        lowStockThreshold={settings.lowStockThreshold}
      />

      {/* BANNER PROMO */}
      {settings.promoBannerTitle && (
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-14 text-paper sm:px-14">
            {settings.promoBannerImageUrl && (
              <SafeImage
                src={settings.promoBannerImageUrl}
                alt=""
                fill
                sizes="100vw"
                className="object-cover opacity-30"
              />
            )}
            <div className="relative max-w-xl">
              <h2 className="text-3xl font-extrabold sm:text-4xl">
                {settings.promoBannerTitle}
              </h2>
              {settings.promoBannerText && (
                <p className="mt-3 text-neutral-300">
                  {settings.promoBannerText}
                </p>
              )}
              <Link
                href="/products"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Lihat koleksi
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* KEUNGGULAN */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CARA PESAN */}
      <section
        id="cara-pesan"
        className="scroll-mt-24 border-y border-stone-line bg-mist"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="mb-10 max-w-xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Cara memesan
            </h2>
            <p className="mt-2 text-neutral-600">
              Pesanan diambil langsung di toko. Pesan di website ini belum
              dianggap transaksi sebelum dikonfirmasi penjual.
            </p>
          </div>

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl bg-white p-6">
                <span className="font-display text-3xl font-extrabold text-accent">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-ink px-6 text-sm font-semibold transition hover:bg-ink hover:text-paper"
            >
              <MessageCircle className="size-4" aria-hidden />
              Tanya penjual via WhatsApp
            </a>
          )}
        </div>
      </section>

      {/* LOKASI */}
      {(settings.address || settings.openingHours) && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <h2 className="mb-8 text-2xl font-extrabold sm:text-3xl">
            Ambil di toko
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {settings.address && (
              <div className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist">
                  <MapPin className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-bold">Alamat toko</h3>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {settings.address}
                  </p>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-semibold underline underline-offset-4"
                    >
                      Buka di Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}
            {settings.openingHours && (
              <div className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist">
                  <Clock className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-bold">Jam operasional</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                    {settings.openingHours}
                  </p>
                </div>
              </div>
            )}
          </div>
          {settings.pickupInstructions && (
            <p className="mt-8 max-w-2xl rounded-2xl bg-mist p-5 text-sm leading-relaxed text-neutral-700">
              <span className="font-bold">Petunjuk pengambilan: </span>
              {settings.pickupInstructions}
            </p>
          )}
        </section>
      )}
    </>
  );
}