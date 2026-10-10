import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";

export default async function DashboardPage() {
  const admin = await requireAdmin();

  const [products, variants, orders, setting] = await Promise.all([
    prisma.product.count({ where: { archivedAt: null, isPublished: true } }),
    prisma.productVariant.count(),
    prisma.order.count(),
    prisma.storeSetting.findUnique({ where: { id: "main" } }),
  ]);

  const stats = [
    { label: "Produk aktif", value: products },
    { label: "Varian ukuran", value: variants },
    { label: "Total pesanan", value: orders },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Halo, {admin.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Anda masuk ke panel admin {setting?.storeName ?? "SOLESPACE"}. Statistik
          lengkap menyusul di tahap dashboard.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-stone-line bg-white p-5"
          >
            <dt className="text-sm text-neutral-500">{s.label}</dt>
            <dd className="mt-1 text-3xl font-extrabold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}