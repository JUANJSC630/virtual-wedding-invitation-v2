import { useEffect, useRef, useState } from "react";

import { Variants, motion, useInView } from "framer-motion";

import { useAssets } from "@/context/AssetContext";
import { useEventContext } from "@/context/EventContext";
import { useImagePreload } from "@/hooks/useImagePreload";

import AudioPlayer from "@/components/ui/AudioPlayer";

// Definimos el componente de la sección de invitación
const InvitationSection3 = () => {
  const { event } = useEventContext();
  const assets = useAssets();

  const brideName = (event?.brideName ?? "Jimena").toUpperCase();
  const groomName = (event?.groomName ?? "Jhon").toUpperCase();

  const getNameFontSize = (name: string): string => {
    const len = name.length;
    if (len <= 6)  return "clamp(2.8rem, 11vw, 3.75rem)";
    if (len <= 10) return "clamp(2.2rem, 8.5vw, 3rem)";
    if (len <= 14) return "clamp(1.75rem, 6.5vw, 2.4rem)";
    return "clamp(1.4rem, 5vw, 2rem)";
  };
  const audioUrl = event?.audioUrl ?? "/cancion.mp3";
  const heroMessage = event?.config?.heroMessage ??
    "Hay momentos en la vida que son especiales por si solos, pero compartirlos con las personas que queremos los hacen inolvidables.\n\nPor eso queremos invitarlos a celebrar nuestra boda y que hagan parte de este día tan especial para nosotros.";
  const ref = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);

  // Preparar el layout antes de mostrar cualquier contenido
  useEffect(() => {
    const layoutTimer = setTimeout(() => {
      setLayoutReady(true);
    }, 100);

    return () => clearTimeout(layoutTimer);
  }, []);

  // Usar el hook unificado para precargar imágenes
  const { imagesLoaded } = useImagePreload(layoutReady ? ["/ramo-lateral.png", "/fondo.png"] : [], {
    delay: 0,
  });

  const isInView = useInView(ref, {
    once: true,
    margin: "-50px",
    amount: 0.3,
  });

  // Variantes para animar la aparición secuencial
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.4,
      },
    },
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${assets.background}')`,
        }}
      />

      {/* Contenido principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={containerVariants}
          className="w-full max-w-md mx-auto"
          style={{ padding: "0 3rem 3rem 3rem" }}
        >
          <div className="flex flex-col gap-8 text-center">
            <div className="flex flex-col gap-6 relative">
              {/* Placeholders invisibles para reservar el espacio y mantener el layout estable */}
              <div
                className="absolute w-72 h-72 md:w-80 md:h-80 opacity-0 pointer-events-none"
                style={{ transform: "rotate(180deg)", top: "-20px", left: "-240px" }}
              ></div>
              <div
                className="absolute w-72 h-72 md:w-80 md:h-80 opacity-0 pointer-events-none"
                style={{ transform: "rotate(180deg)", top: "-20px", left: "280px" }}
              ></div>

              <motion.p
                className="text-start font-serif text-[var(--color-primary)] italic font-light tracking-wider"
                style={{ fontSize: getNameFontSize(brideName) }}
                variants={fadeInUp}
              >
                {brideName}
              </motion.p>
              {imagesLoaded && (
                <motion.div
                  className="absolute w-80 h-80 opacity-0"
                  style={{ transform: "rotate(180deg)", top: "-60px", left: "-180px" }}
                  animate={{ opacity: 0.8 }}
                  transition={{
                    duration: 1.5,
                    delay: 0.8,
                    ease: "easeOut",
                  }}
                  whileInView={{
                    rotate: [180, 175, 190],
                    transition: {
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    },
                  }}
                >
                  <img
                    src={assets.sideBouquet}
                    alt="Flores decorativas"
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              )}
              <motion.div className="py-1" variants={fadeInUp}>
                <span className="text-4xl text-[var(--color-accent)]">&</span>
              </motion.div>
              {imagesLoaded && (
                <motion.div
                  className="absolute w-80 h-80 opacity-0"
                  style={{ transform: "rotate(180deg)", top: "-30px", left: "180px" }}
                  animate={{ opacity: 0.8 }}
                  transition={{
                    duration: 1.5,
                    delay: 1.2,
                    ease: "easeOut",
                  }}
                  whileInView={{
                    rotate: [170, 185, 190],
                    transition: {
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    },
                  }}
                >
                  <img
                    src={assets.sideBouquet}
                    alt="Flores decorativas"
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              )}

              <motion.p
                className="text-end font-serif text-[var(--color-primary)] italic font-light tracking-wider"
                style={{ fontSize: getNameFontSize(groomName) }}
                variants={fadeInUp}
              >
                {groomName}
              </motion.p>
            </div>

            <motion.div variants={fadeInUp}>
              <AudioPlayer src={audioUrl} songTitle="Nuestra Canción" />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <p className="font-serif text-[var(--color-text)] tracking-wide leading-relaxed text-base whitespace-pre-line">
                {heroMessage}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvitationSection3;
