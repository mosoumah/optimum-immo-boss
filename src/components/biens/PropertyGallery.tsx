import { useState } from "react";
import { Building, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyLightbox } from "./PropertyLightbox";

interface PropertyGalleryProps {
  images: { url: string; alt?: string }[];
  fallbackCover?: string | null;
}

export const PropertyGallery = ({ images, fallbackCover }: PropertyGalleryProps) => {
  const list = images.length > 0
    ? images
    : fallbackCover
      ? [{ url: fallbackCover, alt: "Couverture" }]
      : [];

  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(-1);

  if (list.length === 0) {
    return (
      <div className="w-full aspect-[16/10] rounded-xl bg-muted flex items-center justify-center">
        <Building className="w-16 h-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative group rounded-xl overflow-hidden bg-muted">
        <img
          src={list[active].url}
          alt={list[active].alt || ""}
          className="w-full aspect-[16/10] object-cover cursor-zoom-in"
          onClick={() => setLightbox(active)}
        />
        <button
          type="button"
          onClick={() => setLightbox(active)}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Plein écran"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all",
                i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <PropertyLightbox
        images={list}
        index={lightbox}
        onClose={() => setLightbox(-1)}
        onIndexChange={setLightbox}
      />
    </div>
  );
};
