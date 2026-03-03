import { useAssets } from "@/context/AssetContext";
import { useEventContext } from "@/context/EventContext";
import { GalleryPhoto } from "@/types";

import { motion } from "framer-motion";

const InvitationSectionGallery = () => {
  const { event } = useEventContext();
  const assets = useAssets();

  const gallery: GalleryPhoto[] = event?.config?.gallery ?? [];
  const title = event?.config?.labels?.galleryTitle ?? "Nuestra Historia";

  // No renderizar si no hay fotos
  if (gallery.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-12">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${assets.background}')` }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        {/* Título */}
        <motion.p
          className="text-3xl md:text-4xl font-serif text-center mb-8 text-[var(--color-accent)]"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          {title}
        </motion.p>

        {/* Grid 2 columnas con gap uniforme */}
        <div className="flex gap-4">
          {[gallery.filter((_, i) => i % 2 === 0), gallery.filter((_, i) => i % 2 !== 0)].map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-4">
              {col.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  className="relative rounded-2xl overflow-hidden shadow-md"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: (colIdx * col.length + i) * 0.08 }}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Foto ${i + 1}`}
                    loading="lazy"
                    className="w-full h-auto object-cover block"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                      <p className="text-white text-xs font-serif italic text-center">
                        {photo.caption}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InvitationSectionGallery;
