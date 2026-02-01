"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";

type Photo = {
  src: string;
  alt?: string;
};

export default function PhotoCarousel({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const count = photos.length;

  const safePhotos = useMemo(() => (count > 0 ? photos : [{ src: "/photos/placeholder.jpg", alt: "Photo" }]), [photos, count]);

  const go = (next: number) => {
    const n = safePhotos.length;
    setIndex(((next % n) + n) % n);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX.current;
    const dx = endX - startX.current;

    // Swipe threshold
    if (Math.abs(dx) > 40) {
      if (dx < 0) go(index + 1); // swipe left -> next
      else go(index - 1); // swipe right -> prev
    }

    startX.current = null;
  };

  const current = safePhotos[index];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-zinc-50">
      <div
        className="relative aspect-[4/3] w-full"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={current.src}
          alt={current.alt ?? "BBA Waste Hauling Services"}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 50vw, 100vw"
          priority
        />
      </div>

      {/* Arrows (desktop) */}
      {safePhotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900 shadow hover:bg-white"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-900 shadow hover:bg-white"
            aria-label="Next photo"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {safePhotos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  i === index ? "bg-red-600" : "bg-white/80",
                ].join(" ")}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
