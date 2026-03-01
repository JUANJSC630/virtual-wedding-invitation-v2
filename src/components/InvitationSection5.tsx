import { useRef } from "react";

import { Variants, motion, useInView } from "framer-motion";

import { useAssets } from "@/context/AssetContext";
import { useEventContext } from "@/context/EventContext";

import Countdown from "@/components/Countdown";

const InvitationSection5 = () => {
  const { event } = useEventContext();
  const assets = useAssets();

  const parents       = event?.config?.parents;
  const labels        = event?.config?.labels;

  const brideParents  = parents?.bride    ?? [];
  const groomParents  = parents?.groom    ?? [];
  const godparents    = event?.config?.godparents  ?? [];
  const bridesmaids   = event?.config?.bridesmaids ?? [];
  const groomsmen     = event?.config?.groomsmen   ?? [];

  const familyTitle    = labels?.familyTitle    ?? "Con la bendición de Dios y de nuestros padres";
  const companionTitle = labels?.companionTitle ?? "Y en compañía de nuestros padrinos, damas y caballeros de honor";
  const brideParentsLabel  = labels?.brideParents  ?? "Padres de la novia";
  const groomParentsLabel  = labels?.groomParents  ?? "Padres del novio";
  const godparentsLabel    = labels?.godparents    ?? "Padrinos";
  const bridesmaidsLabel   = labels?.bridesmaids   ?? "Damas de honor";
  const groomsmenLabel     = labels?.groomsmen     ?? "Caballeros de honor";

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px", amount: 0.3 });

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: i * 0.25 },
    }),
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${assets.background}')` }}
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
              <motion.h2
                className="text-2xl md:text-3xl text-[var(--color-accent)] font-serif text-center mb-2"
                custom={0}
                variants={fadeInUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
              >
                {familyTitle}
              </motion.h2>

              {brideParents.length > 0 && (
                <motion.div
                  className="text-center mb-2 text-[var(--color-primary)]"
                  custom={1}
                  variants={fadeInUp}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  <span className="font-bold text-lg">{brideParentsLabel}</span>
                  {brideParents.map(name => (
                    <><br key={name} /><span>{name}</span></>
                  ))}
                </motion.div>
              )}

              {groomParents.length > 0 && (
                <motion.div
                  className="text-center mb-2 text-[var(--color-primary)]"
                  custom={2}
                  variants={fadeInUp}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  <span className="font-bold text-lg">{groomParentsLabel}</span>
                  {groomParents.map(name => (
                    <><br key={name} /><span>{name}</span></>
                  ))}
                </motion.div>
              )}

              {(godparents.length > 0 || bridesmaids.length > 0 || groomsmen.length > 0) && (
                <motion.h3
                  className="text-xl md:text-2xl text-[var(--color-accent)] font-serif text-center my-2"
                  custom={3}
                  variants={fadeInUp}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  {companionTitle}
                </motion.h3>
              )}

              {godparents.length > 0 && (
                <motion.div
                  className="text-center mb-2 text-[var(--color-primary)]"
                  custom={4}
                  variants={fadeInUp}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  <span className="font-bold text-lg">{godparentsLabel}</span>
                  {godparents.map(name => (
                    <><br key={name} /><span>{name}</span></>
                  ))}
                </motion.div>
              )}

              {(bridesmaids.length > 0 || groomsmen.length > 0) && (
                <motion.div
                  className="flex flex-col md:flex-row justify-center gap-8 mt-4 w-full max-w-2xl mx-auto text-[var(--color-primary)]"
                  custom={5}
                  variants={fadeInUp}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                >
                  {bridesmaids.length > 0 && (
                    <div className="flex-1 text-center">
                      <span className="font-bold text-lg">{bridesmaidsLabel}</span>
                      <ul className="mt-1">
                        {bridesmaids.map(name => <li key={name}>{name}</li>)}
                      </ul>
                    </div>
                  )}
                  {groomsmen.length > 0 && (
                    <div className="flex-1 text-center">
                      <span className="font-bold text-lg">{groomsmenLabel}</span>
                      <ul className="mt-1">
                        {groomsmen.map(name => <li key={name}>{name}</li>)}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
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
