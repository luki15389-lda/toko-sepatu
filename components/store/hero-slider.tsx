"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 5000;

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", callback);
      return () => query.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function HeroSlider({ images, alt }: { images: string[]; alt: string }) {
  // Jika belum ada foto yang diunggah: tampilkan foto bawaan / placeholder
  const list = images.length > 0 ? images : ["/images/hero.jpg"];
  const count = list.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const current = Math.min(index, count - 1);

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      INTERVAL_MS
    );
    return () => window.clearInterval(id);
  }, [count, paused, reducedMotion]);

  const go = (next: number) => setIndex((next + count) % count);

  const arrow =
    "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink opacity-0 shadow transition hover:bg-white focus-visible:opacity-100 group-hover:opacity-100";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Foto koleksi"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-mist lg:aspect-auto lg:h-[420px]"
    >
      {list.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== current}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
            i === current ? "opacity-100" : "opacity-0"
          )}
        >
          <SafeImage
            src={src}
            alt={i === current ? alt : ""}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Foto sebelumnya"
            className={cn(arrow, "left-3")}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Foto berikutnya"
            className={cn(arrow, "right-3")}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {list.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Tampilkan foto ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
                className={cn(
                  "h-2 rounded-full shadow-[0_0_4px_rgba(0,0,0,0.4)] transition-all",
                  i === current ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}