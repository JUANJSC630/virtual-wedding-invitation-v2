import { useEffect, useRef, useState } from "react";

import { Variants, motion, useInView } from "framer-motion";

import Countdown from "@/components/Countdown";

// Definimos el componente de la sección de invitación
const InvitationSection5 = () => {
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
          variants={fadeInUp}
          className="w-full max-w-md mx-auto"
          style={{ padding: "0 3rem 3rem 3rem" }}
        >
          <div className="flex flex-col gap-8 text-center">
            <div className="flex flex-col gap-6 relative">
              {/* Placeholders invisibles para reservar el espacio y mantener el layout estable */}
              <div
                className="absolute -top-7 -left-30 w-72 h-72 md:w-80 md:h-80 opacity-0 pointer-events-none"
                style={{ transform: "rotate(180deg)" }}
              ></div>
              <div
                className="absolute -top-0 left-60 w-72 h-72 md:w-80 md:h-80 opacity-0 pointer-events-none"
                style={{ transform: "rotate(180deg)" }}
              ></div>

              {/* Contenido personalizado con animación en cascada */}
              <motion.h2
                className="text-2xl md:text-3xl text-[#bfa15a] font-serif text-center mb-2"
                custom={0}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                Con la bendición de Dios y de nuestros padres
              </motion.h2>
              <motion.div
                className="text-center mb-2"
                custom={1}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                <span className="font-bold text-lg">Padres de la novia</span>
                <br />
                <span>Maria Lucelly Zapata Bedoya</span>
                <br />
                <span>Alvaro Libreros Caicedo</span>
              </motion.div>
              <motion.div
                className="text-center mb-2"
                custom={2}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                <span className="font-bold text-lg">Padres del novio</span>
                <br />
                <span>Leandra Susana Naranjo Monsalve</span>
                <br />
                <span>John Jairo Ordoñes Corrales</span>
              </motion.div>
              <motion.h3
                className="text-xl md:text-2xl text-[#bfa15a] font-serif text-center my-2"
                custom={3}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                Y en compañía de nuestros padrinos, damas y caballeros de honor
              </motion.h3>
              <motion.div
                className="text-center mb-2"
                custom={4}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                <span className="font-bold text-lg">Padrinos</span>
                <br />
                <span>Isabel Cristina Castro Pineda</span>
                <br />
                <span>Marco Tulio Naranjo Monsalve</span>
              </motion.div>
              <motion.div
                className="flex flex-col md:flex-row justify-center gap-8 mt-4 w-full max-w-2xl mx-auto"
                custom={5}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                <div className="flex-1 text-center">
                  <span className="font-bold text-lg">Damas de honor</span>
                  <ul className="mt-1">
                    <li>Claudia Reyes</li>
                    <li>Yensi Mora</li>
                    <li>Sofia Naranjo</li>
                    <li>Manuela Naranjo</li>
                    <li>Ana Garcia</li>
                    <li>Laura Bedoya</li>
                    <li>Alejandra Rivera</li>
                  </ul>
                </div>
                <div className="flex-1 text-center">
                  <span className="font-bold text-lg">Caballeros de honor</span>
                  <ul className="mt-1">
                    <li>Stiwar Ordoñes</li>
                    <li>Danny Ospina</li>
                    <li>Cristian Naranjo</li>
                    <li>Santiago Ordoñes</li>
                    <li>Brayan Ordoñes</li>
                    <li>Harold Naranjo</li>
                    <li>Marlon Estupiñan</li>
                  </ul>
                </div>
              </motion.div>
            </div>
            {/* Countdown solo se muestra cuando la sección está en vista */}
            <motion.div
              initial={{ opacity: 0, x: 60, scale: 0.8 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 1.05, duration: 0.9, ease: "easeOut" }}
            >
              {isInView && <Countdown />}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvitationSection5;
