import { useRef } from "react";

import { motion } from "framer-motion";

import { useAssets } from "@/context/AssetContext";
import { useEventContext } from "@/context/EventContext";
import DressCodeIcons from "@/components/ui/DressCodeIcons";
import { Button } from "@/components/ui/button";

const InvitationSection6 = () => {
  const { event } = useEventContext();
  const assets = useAssets();

  const ceremonyTime = event?.ceremonyTime ?? "6:00 PM";
  const ceremony = event?.config?.ceremony ?? {
    name: "IGLESIA LA MEDALLA MILAGROSA",
    address: "Zarzal, Valle Del Cauca",
    mapsUrl: "https://maps.app.goo.gl/uEAii5TKKsR2SKAcA",
  };
  const receptionTime = event?.receptionTime ?? "8:00 PM";
  const reception = event?.config?.reception ?? {
    name: "FINCA VILLA MILENA",
    address: "Corregimiento Limones, Zarzal",
    mapsUrl: "https://maps.app.goo.gl/Seqbt4m5C6LuMTPB9",
  };
  const dressCodeConfig = event?.config?.dressCode ?? {
    label: "Elegante",
    ladies: "EVITAR COLORES BLANCOS Y AZUL MARINO.",
    gentlemen: "EVITAR COLORES BEIGE Y AZUL MARINO.",
  };

  const labels         = event?.config?.labels;
  const ceremonyLabel  = labels?.ceremony    ?? "CEREMONIA";
  const receptionLabel = labels?.reception   ?? "RECEPCIÓN";
  const viewLocation   = labels?.viewLocation ?? "Ver ubicación";
  const dressCodeLabel = labels?.dressCode   ?? "Código de vestimenta:";
  const ladiesLabel    = labels?.ladies      ?? "ELLAS:";
  const gentlemenLabel = labels?.gentlemen   ?? "ELLOS:";

  const ref = useRef(null);

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
                    src={assets.church}
                    alt="Iglesia San Juan Bautista"
                    loading="lazy"
                    style={{ width: 90, height: 90 }}
                    className="mx-auto"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.25, duration: 0.9, ease: "easeOut" }}
                  className="mt-2 text-xl md:text-2xl font-serif text-[var(--color-primary)]"
                >
                  {ceremonyTime}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.45, duration: 0.9, ease: "easeOut" }}
                  className="font-bold text-2xl md:text-3xl tracking-wide text-[var(--color-accent)]"
                >
                  {ceremonyLabel}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.65, duration: 0.9, ease: "easeOut" }}
                  className="text-lg md:text-xl font-serif text-[var(--color-primary)]"
                >
                  {ceremony.name}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.85, duration: 0.9, ease: "easeOut" }}
                  className="text-base md:text-lg text-[var(--color-text)]"
                >
                  {ceremony.address}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -60, scale: 0.8 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 1.05, duration: 0.9, ease: "easeOut" }}
                >
                  <Button
                    className="!bg-[var(--color-action)] !text-white !hover:bg-[#0e1f36] !rounded-full mt-4 !text-xl"
                    onClick={() =>
                      window.open(
                        ceremony.mapsUrl,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    {viewLocation}
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
                    src={assets.glasses}
                    alt="Recepción copas brindis"
                    loading="lazy"
                    style={{ width: 90, height: 90 }}
                    className="mx-auto"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.25, duration: 0.9, ease: "easeOut" }}
                  className="mt-2 text-xl md:text-2xl font-serif text-[var(--color-primary)]"
                >
                  {receptionTime}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.45, duration: 0.9, ease: "easeOut" }}
                  className="font-bold text-2xl md:text-3xl tracking-wide font-serif text-[var(--color-accent)]"
                >
                  {receptionLabel}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.65, duration: 0.9, ease: "easeOut" }}
                  className="text-lg md:text-xl font-serif text-[var(--color-primary)]"
                >
                  {reception.name}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 0.85, duration: 0.9, ease: "easeOut" }}
                  className="text-base md:text-lg text-[var(--color-text)] font-serif"
                >
                  {reception.address}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 60, scale: 0.8 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: 1.05, duration: 0.9, ease: "easeOut" }}
                >
                  <Button
                    className="!bg-[var(--color-action)] !text-white !hover:bg-[#0e1f36] !rounded-full mt-4 !text-xl"
                    onClick={() =>
                      window.open(
                        reception.mapsUrl,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    {viewLocation}
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
                className="text-xl font-serif text-[var(--color-primary)] font-semibold mb-2"
              >
                {dressCodeLabel}
                <span className="block text-2xl md:text-3xl font-bold font-serif mt-1">
                  {`"${dressCodeConfig.label}"`}
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
                className="text-[var(--color-primary)] font-serif"
              >
                <span className="block text-sm">
                  {ladiesLabel}{" "}
                  <span className="font-semibold font-serif">
                    {dressCodeConfig.ladies}
                  </span>
                </span>
                <span className="block text-sm font-serif">
                  {gentlemenLabel} <span className="font-semibold">{dressCodeConfig.gentlemen}</span>
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
