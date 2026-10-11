import Link from "next/link";

export function Pager({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (p: number) => string;
}) {
  if (totalPages <= 1) return null;
  const cls = "h-10 rounded-full border px-5 text-sm font-semibold leading-10";

  return (
    <nav aria-label="Halaman" className="flex items-center justify-between">
      <p className="text-sm text-neutral-600">
        Halaman {page} dari {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={`${cls} border-stone-300 hover:border-ink`}>
            Sebelumnya
          </Link>
        ) : (
          <span className={`${cls} border-stone-200 text-stone-300`}>Sebelumnya</span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className={`${cls} border-stone-300 hover:border-ink`}>
            Berikutnya
          </Link>
        ) : (
          <span className={`${cls} border-stone-200 text-stone-300`}>Berikutnya</span>
        )}
      </div>
    </nav>
  );
}