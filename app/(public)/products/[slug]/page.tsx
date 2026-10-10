import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Store } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { ProductSection } from "@/components/store/product-section";
import { DetailSkeleton } from "@/components/store/skeletons";
import { getRelatedProducts, getProductBySlug } from "@/lib/data/product-detail";
import { getStoreSettings } from "@/lib/data/store";
import { discountPercent } from "@/lib/product-utils";
import { formatRupiah } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produk tidak ditemukan" };

  const description = product.description.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: `${product.name} - ${product.brand.name}`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

async function ProductContent({ params }: Props) {
  const { slug } = await params;

  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
  ]);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category.slug, product.id, 4);

  const percent = discountPercent(product.price, product.discountPrice);
  const finalPrice = percent ? product.discountPrice! : product.price;
  const totalStock = product.variants
    .filter((v) => v.isAvailable)
    .reduce((sum, v) => sum + v.stock, 0);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <Breadcrumb
          items={[
            { label: "Beranda", href: "/" },
            { label: "Produk", href: "/products" },
            {
              label: product.category.name,
              href: `/categories/${product.category.slug}`,
            },
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {product.brand.name}
                <span className="mx-2 text-neutral-300">/</span>
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-ink hover:underline"
                >
                  {product.category.name}
                </Link>
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-extrabold">
                  {formatRupiah(finalPrice)}
                </span>
                {percent && (
                  <>
                    <span className="text-lg text-neutral-400 line-through">
                      {formatRupiah(product.price)}
                    </span>
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">
                      -{percent}%
                    </span>
                  </>
                )}
                {product.isNew && (
                  <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-paper">
                    Baru
                  </span>
                )}
              </div>
            </div>

            {totalStock <= 0 ? (
              <p
                role="status"
                className="rounded-xl bg-mist px-4 py-3 text-sm font-semibold"
              >
                Stok produk ini sedang habis. Tanyakan ke penjual untuk
                ketersediaan berikutnya.
              </p>
            ) : null}

            <ProductPurchasePanel
              variants={product.variants}
              lowStockThreshold={settings.lowStockThreshold}
              whatsappNumber={settings.whatsappNumber}
              storeName={settings.storeName}
              productName={product.name}
            />

            <div className="rounded-2xl bg-mist p-5 text-sm">
              <p className="flex items-center gap-2 font-bold">
                <Store className="size-4" aria-hidden />
                Ambil langsung di toko
              </p>
              <p className="mt-2 leading-relaxed text-neutral-600">
                Pesanan dikonfirmasi penjual lewat WhatsApp, lalu diambil di
                toko.
                {settings.pickupInstructions
                  ? ` ${settings.pickupInstructions}`
                  : ""}
              </p>
              {settings.address && (
                <p className="mt-3 flex items-start gap-2 text-neutral-700">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{settings.address}</span>
                </p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold">Deskripsi</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                {product.description}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold">Spesifikasi</h2>
              <dl className="mt-2 divide-y divide-stone-line text-sm">
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-neutral-500">Merek</dt>
                  <dd className="font-medium">{product.brand.name}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-neutral-500">Kategori</dt>
                  <dd className="font-medium">{product.category.name}</dd>
                </div>
                {product.material && (
                  <div className="flex justify-between gap-4 py-2">
                    <dt className="text-neutral-500">Bahan</dt>
                    <dd className="text-right font-medium">{product.material}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-neutral-500">Kode produk</dt>
                  <dd className="font-medium">{product.sku}</dd>
                </div>
              </dl>
              {product.specifications && (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {product.specifications}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductSection
        title="Produk terkait"
        products={related}
        href={`/categories/${product.category.slug}`}
        lowStockThreshold={settings.lowStockThreshold}
      />
    </>
  );
}

export default function ProductPage(props: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProductContent {...props} />
    </Suspense>
  );
}