"use client";

import { useState } from "react";
import { SafeImage } from "@/components/shared/safe-image";
import { cn } from "@/lib/utils";

type GalleryImage = { url: string; alt: string | null };

export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const list: GalleryImage[] =
    images.length > 0 ? images : [{ url: "/placeholder-shoe.svg", alt: null }];
  const [active, setActive] = useState(0);
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-mist">
        <SafeImage
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {list.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {list.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Lihat foto ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl bg-mist ring-offset-2 transition",
                  i === active ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100"
                )}
              >
                <SafeImage
                  src={img.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}