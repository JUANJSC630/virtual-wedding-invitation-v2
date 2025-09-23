import { useEffect, useRef, useState } from "react";

import { motion } from "framer-motion";

import DressCodeIcons from "@/components/ui/DressCodeIcons";
import { Button } from "@/components/ui/button";

// Definimos el componente de la sección de invitación
const InvitationSection6 = () => {
  const ref = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);

  // Preparar el layout antes de mostrar cualquier contenido
  useEffect(() => {
    // Dar tiempo al navegador para calcular el layout correctamente
    const layoutTimer = setTimeout(() => {
      setLayoutReady(true);
    }, 100);

    return () => clearTimeout(layoutTimer);
  }, []);

  // Precargar las imágenes de manera más robusta
  useEffect(() => {
    // Solo intentar cargar imágenes cuando el layout esté listo
    if (!layoutReady) return;

    const imagesToLoad = ["/ramo-lateral.png", "/fondo.png"];

    imagesToLoad.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [layoutReady]);

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
        <div ref={ref} className="w-full max-w-lg mx-auto" style={{ padding: "0 3rem 3rem 3rem" }}>
          <div className="flex flex-col gap-16 text-center justify-between items-center min-h-[80vh] w-full">
            {/* Bloque eventos */}
            <div className="flex flex-col gap-12 w-full">
              {/* Evento 1: Ceremonia */}
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  <img
                    src="/iglesia.png"
                    alt="Iglesia San Juan Bautista"
                    style={{ width: 90, height: 90 }}
                    className="mx-auto"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.25, duration: 0.9, ease: "easeOut" }}
                  className="mt-2 text-xl md:text-2xl font-serif text-[#162b4e]"
                >
                  6:00 PM
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.45, duration: 0.9, ease: "easeOut" }}
                  className="font-bold text-2xl md:text-3xl tracking-wide"
                >
                  CEREMONIA
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.65, duration: 0.9, ease: "easeOut" }}
                  className="text-lg md:text-xl font-serif text-[#162b4e]"
                >
                  IGLESIA LA MEDALLA MILAGROSA
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.85, duration: 0.9, ease: "easeOut" }}
                  className="text-base md:text-lg text-gray-700"
                >
                  Zarzal, Valle Del Cauca
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60, scale: 0.8 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 1.05, duration: 0.9, ease: "easeOut" }}
                >
                  <Button
                    className="!bg-[#466691] !text-white !hover:bg-[#0e1f36] !rounded-full mt-4 !text-xl"
                    onClick={() =>
                      window.open(
                        "https://maps.app.goo.gl/uEAii5TKKsR2SKAcA",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Ver ubicación
                  </Button>
                </motion.div>
              </div>
              {/* Evento 2: Recepción */}
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.7,
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                >
                  <img
                    src="/copas.png"
                    alt="Recepción copas brindis"
                    style={{ width: 90, height: 90 }}
                    className="mx-auto"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.25, duration: 0.9, ease: "easeOut" }}
                  className="mt-2 text-xl md:text-2xl font-serif text-[#162b4e]"
                >
                  8:00 PM
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.45, duration: 0.9, ease: "easeOut" }}
                  className="font-bold text-2xl md:text-3xl tracking-wide font-serif"
                >
                  RECEPCIÓN
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.65, duration: 0.9, ease: "easeOut" }}
                  className="text-lg md:text-xl font-serif text-[#162b4e]"
                >
                  FINCA VILLA MILENA
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.85, duration: 0.9, ease: "easeOut" }}
                  className="text-base md:text-lg text-gray-700 font-serif"
                >
                  Corregimiento Limones, Zarzal
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60, scale: 0.8 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 1.05, duration: 0.9, ease: "easeOut" }}
                >
                  <Button
                    className="!bg-[#466691] !text-white !hover:bg-[#0e1f36] !rounded-full mt-4 !text-xl"
                    onClick={() =>
                      window.open(
                        "https://maps.app.goo.gl/Seqbt4m5C6LuMTPB9",
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Ver ubicación
                  </Button>
                </motion.div>
              </div>
            </div>
            {/* Bloque código de vestimenta */}
            <motion.div className="flex flex-col items-center justify-center w-full gap-6">
              {/* Título animado hacia abajo */}
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 80 }}
                className="text-xl font-serif text-[#162b4e] font-semibold mb-2"
              >
                Código de vestimenta:
                <span className="block text-2xl md:text-3xl font-bold font-serif mt-1">
                  “Elegante”
                </span>
              </motion.div>
              {/* Íconos con fadeIn y escala */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.4, type: "spring", stiffness: 120 }}
              >
                <DressCodeIcons />
              </motion.div>
              {/* Reglas animadas hacia arriba */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.7, type: "spring", stiffness: 80 }}
                className="text-[#162b4e] font-serif"
              >
                <span className="block text-sm">
                  ELLAS:{" "}
                  <span className="font-semibold font-serif">
                    EVITAR COLORES BLANCOS Y AZUL MARINO.
                  </span>
                </span>
                <span className="block text-sm font-serif">
                  ELLOS: <span className="font-semibold">EVITAR COLORES BEIGE Y AZUL MARINO.</span>
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvitationSection6;
