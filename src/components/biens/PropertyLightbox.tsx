import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyLightboxProps {
  images: { url: string; alt?: string }[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export const PropertyLightbox = ({ images, index, onClose, onIndexChange }: PropertyLightboxProps) => {
  const open = index >= 0 && index < images.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange(Math.min(images.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndexChange(Math.max(0, index - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, images.length, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          {index > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index - 1);
              }}
              className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index + 1);
              }}
              className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              aria-label="Suivant"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <motion.img
            key={images[index].url}
            src={images[index].url}
            alt={images[index].alt || ""}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
            {index + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
