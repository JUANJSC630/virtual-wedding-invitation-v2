import Button from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, Variants } from "framer-motion";

// Definimos el componente de la sección de invitación
const InvitationSection8 = () => {
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
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
          className="w-full max-w-md mx-auto flex flex-col gap-12"
          style={{ padding: "0 1rem 3rem 1rem" }}
        >
          <div className="flex flex-col gap-12 text-center items-center">
            {/* Sugerencia de regalos */}
            <div className="flex flex-col items-center gap-2">
              <img src="/regalo.png" alt="Regalo" className="w-20 h-20 mb-3" />
              <p className="text-2xl md:text-3xl font-serif font-semibold text-[#162b4e] text-center mb-2 tracking-wide">
                SUGERENCIA DE REGALOS
              </p>
              <p className="text-center text-base md:text-lg text-[#162b4e] mb-2 max-w-xl">
                El mejor regalo es tu presencia, pero si deseas tener un detalle
                con nosotros, les dejamos estas opciones:
              </p>
              <div className="text-xl md:text-2xl font-serif font-semibold text-[#162b4e] text-center mt-4 mb-2 tracking-wide">
                LLUVIA DE SOBRES
              </div>
              <img src="/sobre.png" alt="Sobre" className="w-16 h-16 mt-1" />
            </div>
            {/* Confirmar asistencia */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-2xl md:text-3xl font-serif font-bold text-center mb-2 tracking-wide text-[#bfa15a]">
                CONFIRMAR ASISTENCIA
              </p>
              <Button
                className="mt-2"
                onClick={() =>
                  window.open(
                    "https://docs.google.com/forms/d/e/1FAIpQLSdu7mtATTHSZc_VK-iJRHUqVEqZeinsz6dvqTSXci9ooPj0SA/viewform",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Confirmar asistencia
              </Button>
            </div>
          </div>
          {/* Mensaje final */}
          <div className="flex flex-col items-center justify-start w-full h-[250px] gap-2">
            <p className="text-lg md:text-xl font-serif text-[#162b4e] text-center tracking-wide mb-2">
              ESPERAMOS CONTAR CON SU PRESENCIA
            </p>
            <p
              className="text-5xl font-[cursive,serif] text-gray-700 text-center font-light italic"
              style={{ fontFamily: '"Great Vibes", cursive, serif' }}
            >
              Muchas Gracias!
            </p>

            <div className="absolute -bottom-55 w-[500px] h-[500px]">
              <img
                src="/ramo-lateral.png"
                alt="Ramo de flores"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvitationSection8;
