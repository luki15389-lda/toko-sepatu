export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-8 px-4 py-12 sm:px-6"
      aria-busy="true"
      aria-label="Memuat halaman"
    >
      <div className="h-72 animate-pulse rounded-3xl bg-stone-200" />
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}