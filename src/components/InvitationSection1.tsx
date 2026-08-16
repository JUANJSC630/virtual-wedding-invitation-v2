import { motion } from "framer-motion";

import { useAssets } from "@/context/AssetContext";
import { useEventContext } from "@/context/EventContext";
import { getEventType, getHonoreesInitials } from "@/lib/honorees";
import { getOccasionDefaults } from "@/lib/occasions";

const InvitationSection1 = () => {
  const { event } = useEventContext();
  const assets = useAssets();

  const occ = getOccasionDefaults(getEventType(event));
  const verse = event?.config?.verse;
  const verseText = verse?.text ?? occ.verse.text;
  const verseRef = verse?.reference ?? occ.verse.reference;

  // Multi-ocasión: iniciales de los protagonistas (boda → 2, XV/bautizo → 1).
  const initials = getHonoreesInitials(event);
  const firstInitial = initials[0] ?? "J";
  const secondInitial = initials[1]; // undefined en eventos de un solo protagonista
  // Anuncio: config del evento → default de la ocasión (boda → "¡NOS CASAMOS!").
  const announcementText = event?.config?.announcementText || occ.announcementText;

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-label="Wedding invitation header with biblical quote"
    >
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${assets.background}')`,
        }}
      />
      {/* Flor en la esquina superior izquierda */}
      <motion.div
        className="absolute w-72 h-72 md:w-80 md:h-80 opacity-80 transform rotate-180"
        style={{ top: "-20px", left: "-40px" }}
        initial={{ opacity: 0, scale: 0.8, rotate: 160 }}
        animate={{ opacity: 0.8, scale: 1, rotate: 180 }}
        transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
      >
        <img
          src={assets.cornerFlower}
          alt="Decorative floral border in upper left corner"
          loading="lazy"
          className="w-full h-full object-contain"
        />
      </motion.div>

      {/* Ramo en el centro derecho */}
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] opacity-60">
        <img
          src={assets.bouquet}
          alt="Wedding flower bouquet decoration on the right side"
          loading="lazy"
          className="w-full h-full object-contain"
        />
      </div>
      <div className="max-w-sm mx-auto px-6 relative z-10">
        {/* Contenido principal */}
        <div className="pt-20 pb-12 text-center gap-8 flex flex-col items-center justify-center">
          {/* Cita bíblica elegante */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {verseText && (
              <p className="text-xl font-serif text-[var(--color-primary)] leading-relaxed italic mb-4">
                "{verseText}"
              </p>
            )}
            {verseRef && (
              <p className="text-sm text-[var(--color-primary)] opacity-70 font-light">{verseRef}</p>
            )}
          </motion.div>

          {/* Iniciales elegantes */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-4">
              <motion.span
                className="font-serif text-[var(--color-primary)] font-bold"
                style={{ fontSize: "clamp(4rem, 18vw, 6rem)" }}
                initial={{ opacity: 0, x: secondInitial ? -50 : 0, scale: secondInitial ? 1 : 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {firstInitial}
              </motion.span>
              {secondInitial && (
                <>
                  <motion.div
                    className="w-px h-16 bg-[var(--color-accent)]"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  ></motion.div>
                  <motion.span
                    className="font-serif text-[var(--color-primary)] font-bold"
                    style={{ fontSize: "clamp(4rem, 18vw, 6rem)" }}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    {secondInitial}
                  </motion.span>
                </>
              )}
            </div>
          </motion.div>

          {/* Anuncio */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <p className="text-3xl font-medium text-[var(--color-primary)] tracking-wider">{announcementText}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InvitationSection1;
