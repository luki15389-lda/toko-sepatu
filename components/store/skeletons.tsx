export function CatalogSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-label="Memuat produk"
    >
      <div className="mb-8 h-9 w-56 animate-pulse rounded bg-stone-200" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square animate-pulse rounded-2xl bg-stone-200" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div
      className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Memuat produk"
    >
      <div className="aspect-square animate-pulse rounded-3xl bg-stone-200" />
      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
        <div className="h-9 w-3/4 animate-pulse rounded bg-stone-200" />
        <div className="h-7 w-40 animate-pulse rounded bg-stone-200" />
        <div className="h-32 animate-pulse rounded-xl bg-stone-200" />
      </div>
    </div>
  );
}