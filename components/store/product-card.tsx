import Link from "next/link";
import { SafeImage } from "@/components/shared/safe-image";
import { cn, formatRupiah } from "@/lib/utils";
import { discountPercent, getStockInfo } from "@/lib/product-utils";
import type { ProductCardData } from "@/lib/data/products";

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "dark" | "accent";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        variant === "dark" ? "bg-ink text-paper" : "bg-accent text-white"
      )}
    >
      {children}
    </span>
  );
}

export function ProductCard({
  product,
  lowStockThreshold = 5,
}: {
  product: ProductCardData;
  lowStockThreshold?: number;
}) {
  const percent = discountPercent(product.price, product.discountPrice);
  const stock = getStockInfo(product.totalStock, lowStockThreshold);
  const soldOut = stock.level === "out";
  const finalPrice = percent ? product.discountPrice! : product.price;

  return (
    <article className="group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-mist">
          <SafeImage
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className={cn(
              "object-cover transition duration-500 group-hover:scale-105",
              soldOut && "opacity-50"
            )}
          />

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.isNew && <Badge variant="dark">Baru</Badge>}
            {percent && <Badge variant="accent">-{percent}%</Badge>}
          </div>

          {soldOut && (
            <div className="absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-xs font-semibold uppercase tracking-wider text-paper">
              Stok habis
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {product.brand}
          </p>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold">{formatRupiah(finalPrice)}</span>
            {percent && (
              <span className="text-sm text-neutral-400 line-through">
                {formatRupiah(product.price)}
              </span>
            )}
          </div>
          {stock.level !== "out" && (
            <p
              className={cn(
                "text-xs",
                stock.level === "low"
                  ? "font-medium text-orange-700"
                  : "text-neutral-500"
              )}
            >
              {stock.text}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}