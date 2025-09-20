import Button from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { motion, useInView, Variants } from "framer-motion";

// Definimos el componente de la sección de invitación
const InvitationSection8 = () => {
  const ref = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [isAfterDeadline, setIsAfterDeadline] = useState(false);

  // Verificar fecha límite automáticamente
  useEffect(() => {
    const checkAndUpdate = () => {
      // Hora actual en Colombia (UTC-5)
      const nowColombia = new Date().toLocaleString("en-US", {timeZone: "America/Bogota"});
      const now = new Date(nowColombia);

      // Fecha límite: 15 de octubre 2025, 12:00 PM hora Colombia
      const testDeadline = new Date("2025-10-15T12:00:00");
      // Convertir a zona horaria de Colombia
      const deadlineColombia = new Date(testDeadline.toLocaleString("en-US", {timeZone: "America/Bogota"}));

      setIsAfterDeadline(now > deadlineColombia);
    };

    // Verificar inmediatamente
    checkAndUpdate();

    // Verificar cada 3 segundos
    const interval = setInterval(checkAndUpdate, 3000);

    return () => clearInterval(interval);
  }, []);

  // Preparar el layout antes de mostrar cualquier contenido
  useEffect(() => {
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
            <div className="flex flex-col items-center gap-6">
              <p className="text-2xl md:text-3xl font-serif font-bold text-center tracking-wide text-[#bfa15a]">
                CONFIRMAR ASISTENCIA
              </p>
              <div className="flex flex-row gap-4">
                {/* Botón WhatsApp Novio */}
                <Button
                  variant="custom"
                  className={`!bg-[#bfa15a] !hover:bg-[#a88a3c] !text-white !flex !items-center !gap-2 !px-4 !py-2 !rounded-full !shadow-md !cursor-pointer ${
                    isAfterDeadline ? "!opacity-50 !cursor-not-allowed" : ""
                  }`}
                  onClick={() => {
                    if (!isAfterDeadline) {
                      window.open(
                        "https://wa.me/573126067185?text=Hola%20Novio,%20confirmo%20mi%20asistencia%20a%20la%20boda!",
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                  aria-label="WhatsApp Novio"
                  disabled={isAfterDeadline}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.85.504 3.624 1.457 5.18L2 22l4.93-1.43A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.64 0-3.232-.443-4.61-1.28l-.33-.2-2.92.85.87-2.84-.21-.34A7.963 7.963 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.13-5.47c-.2-.1-1.18-.58-1.36-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.61.78-.11.13-.22.15-.41.05-.19-.1-.8-.29-1.52-.92-.56-.5-.94-1.12-1.05-1.31-.11-.19-.01-.29.08-.39.08-.08.19-.22.29-.33.1-.11.13-.19.2-.32.07-.13.03-.25-.01-.35-.04-.1-.44-1.06-.6-1.45-.16-.39-.32-.34-.44-.35-.11-.01-.25-.01-.39-.01-.14 0-.36.05-.55.25-.19.2-.73.71-.73 1.73s.75 2.01.85 2.15c.1.14 1.48 2.27 3.6 3.09.5.17.89.27 1.19.34.5.11.96.09 1.32.05.4-.05 1.18-.48 1.35-.94.17-.46.17-.85.12-.94-.05-.09-.18-.13-.38-.23z" />
                  </svg>
                  Novio
                </Button>
                {/* Botón WhatsApp Novia */}
                <Button
                  variant="custom"
                  className={`!bg-[#bfa15a] !hover:bg-[#a88a3c] !text-white !flex !items-center !gap-2 !px-4 !py-2 !rounded-full !shadow-md !cursor-pointer ${
                    isAfterDeadline ? "!opacity-50 !cursor-not-allowed" : ""
                  }`}
                  onClick={() => {
                    if (!isAfterDeadline) {
                      window.open(
                        "https://wa.me/573185643630?text=Hola%20Novia,%20confirmo%20mi%20asistencia%20a%20la%20boda!",
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }
                  }}
                  aria-label="WhatsApp Novia"
                  disabled={isAfterDeadline}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.85.504 3.624 1.457 5.18L2 22l4.93-1.43A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.64 0-3.232-.443-4.61-1.28l-.33-.2-2.92.85.87-2.84-.21-.34A7.963 7.963 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.13-5.47c-.2-.1-1.18-.58-1.36-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.61.78-.11.13-.22.15-.41.05-.19-.1-.8-.29-1.52-.92-.56-.5-.94-1.12-1.05-1.31-.11-.19-.01-.29.08-.39.08-.08.19-.22.29-.33.1-.11.13-.19.2-.32.07-.13.03-.25-.01-.35-.04-.1-.44-1.06-.6-1.45-.16-.39-.32-.34-.44-.35-.11-.01-.25-.01-.39-.01-.14 0-.36.05-.55.25-.19.2-.73.71-.73 1.73s.75 2.01.85 2.15c.1.14 1.48 2.27 3.6 3.09.5.17.89.27 1.19.34.5.11.96.09 1.32.05.4-.05 1.18-.48 1.35-.94.17-.46.17-.85.12-.94-.05-.09-.18-.13-.38-.23z" />
                  </svg>
                  Novia
                </Button>
              </div>

              <div className="flex flex-row gap-4 mt-4">
                <p className="text-sm text-[#bfa15a] font-serif text-center w-full opacity-80">
                  * Fecha límite para confirmar:{" "}
                  <span className="font-semibold">15 de octubre</span>
                </p>
              </div>
              <div className="flex flex-row gap-4 mt-4">
                <p className="text-sm text-[#bfa15a] font-serif text-center w-full opacity-80">
                  {isAfterDeadline ? " (Cerrado)" : ""}
                </p>
              </div>
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
