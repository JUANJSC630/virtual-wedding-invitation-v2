import { useRef, useState, useEffect } from "react";
import { motion, useInView, Variants } from "framer-motion";

// Definimos el componente de la sección de invitación
const InvitationSection7 = () => {
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

    imagesToLoad.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [layoutReady]);

  const isInView = useInView(ref, {
    once: true,
    margin: "-50px",
    amount: 0.3,
  });

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: i * 0.25,
      },
    }),
  };

  return (
    <section className="relative flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/fondo.png')`,
        }}
      />

      {/* Contenido principal */}
      <div className="relative z-10 flex items-center justify-center w-full">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="w-full max-w-lg mx-auto flex flex-col gap-7"
          style={{ padding: "0 3rem 3rem 3rem" }}
        >
          <div className="flex flex-col">
            <p className="text-4xl font-serif text-[#bfa15a] text-center">
              Itinerario
            </p>
          </div>
          <div className="w-full max-w-3xl mx-auto grid grid-cols-3 gap-0 relative">
            {/* Columna izquierda */}
            <div className="flex flex-col items-end justify-center gap-12 ">
              {/* Evento 1 */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0 }}
                className="flex flex-col items-end"
              >
                <img
                  src="/iglesia.png"
                  alt="Ceremonia religiosa"
                  className="w-20 h-20 mb-1"
                />
                <span className="text-base font-semibold text-[#162b4e]">
                  6:00 PM
                </span>
                <span className="text-sm md:text-base font-serif text-[#162b4e] text-right">
                  CEREMONIA RELIGIOSA
                </span>
              </motion.div>
              {/* Evento 2 */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="flex flex-col items-end"
              >
                <img
                  src="/copas.png"
                  alt="Brindis"
                  className="w-20 h-20 mb-1"
                />
                <span className="text-base font-semibold text-[#162b4e]">
                  9:00 PM
                </span>
                <span className="text-sm md:text-base font-serif text-[#162b4e] text-right">
                  BRINDIS
                </span>
              </motion.div>
              {/* Evento 3 */}
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="flex flex-col items-end"
              >
                <img src="/cena.png" alt="Cena" className="w-20 h-20 mb-1" />
                <span className="text-base font-semibold text-[#162b4e]">
                  11:00 PM
                </span>
                <span className="text-sm md:text-base font-serif text-[#162b4e] text-right">
                  CENA
                </span>
              </motion.div>
            </div>
            {/* Columna central: línea decorativa */}
            <div className="flex flex-col items-center justify-center relative">
              <img
                src="/linea.png"
                alt="Línea decorativa"
                className="h-[90%] w-8 object-contain mx-auto"
              />
            </div>
            {/* Columna derecha */}
            <div className="flex flex-col items-start justify-center gap-12 pt-24">
              {/* Evento 4 */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="flex flex-col items-start"
              >
                <img
                  src="/mesa.png"
                  alt="Recepción"
                  className="w-20 h-20 mb-1"
                />
                <span className="text-base font-semibold text-[#162b4e]">
                  8:00 PM
                </span>
                <span className="text-sm md:text-base font-serif text-[#162b4e] text-left">
                  RECEPCION
                </span>
              </motion.div>
              {/* Evento 5 */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col items-start"
              >
                <img src="/vals.png" alt="Vals" className="w-20 h-20 mb-1" />
                <span className="text-base font-semibold text-[#162b4e]">
                  9:30 PM
                </span>
                <span className="text-sm md:text-base font-serif text-[#162b4e] text-left">
                  VALS
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvitationSection7;
