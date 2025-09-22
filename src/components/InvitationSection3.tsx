import { useEffect, useRef, useState } from "react";

import { Variants, motion, useInView } from "framer-motion";

import { useImagePreload } from "@/hooks/useImagePreload";

import AudioPlayer from "@/components/ui/AudioPlayer";

// Definimos el componente de la sección de invitación
const InvitationSection3 = () => {
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
          backgroundImage: `url('/fondo.png')`,
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
                className="text-start text-6xl font-serif text-gray-700 italic font-light tracking-wider"
                variants={fadeInUp}
              >
                JIMENA
              </motion.p>
              {imagesLoaded && (
                <motion.div
                  className="absolute w-80 h-80 opacity-0"
                  style={{ transform: "rotate(180deg)", top: "-60px", left: "-180px" }}
                  animate={{ opacity: 0.8 }}
                  transition={{
                    duration: 2,
                    delay: 0.3,
                    ease: "easeOut",
                  }}
                  whileInView={{
                    rotate: [180, 175, 190],
                    transition: {
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    },
                  }}
                >
                  <img
                    src="/ramo-lateral.png"
                    alt="Flores decorativas"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              )}
              <motion.div className="py-1" variants={fadeInUp}>
                <span className="text-4xl text-gray-700">&</span>
              </motion.div>
              {imagesLoaded && (
                <motion.div
                  className="absolute w-80 h-80 opacity-0"
                  style={{ transform: "rotate(180deg)", top: "-30px", left: "180px" }}
                  animate={{ opacity: 0.8 }}
                  transition={{
                    duration: 1.2,
                    delay: 0.6,
                    ease: "easeOut",
                  }}
                  whileInView={{
                    rotate: [170, 185, 190],
                    transition: {
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                    },
                  }}
                >
                  <img
                    src="/ramo-lateral.png"
                    alt="Flores decorativas"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              )}

              <motion.p
                className="text-end text-6xl font-serif text-gray-700 italic font-light tracking-wider"
                variants={fadeInUp}
              >
                JHON
              </motion.p>
            </div>

            <motion.div variants={fadeInUp}>
              <AudioPlayer src="/cancion.mp3" songTitle="Nuestra Canción" />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <p className="font-serif text-gray-700 tracking-wide leading-relaxed text-base">
                Hay momentos en la vida que son especiales por si solos, pero compartirlos con las
                personas que queremos los hacen inolvidables.
                <br />
                <br />
                Por eso queremos invitarlos a celebrar nuestra boda y que hagan parte de este dia
                tan especial para nosotros.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvitationSection3;
