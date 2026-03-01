import { useEffect, useRef, useState } from "react";

import { Variants, motion, useInView } from "framer-motion";

import { useEventContext } from "@/context/EventContext";
import { useImagePreload } from "@/hooks/useImagePreload";

import { Button } from "@/components/ui/button";

// Definimos el componente de la sección de invitación
const InvitationSection8 = () => {
  const ref = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [isAfterDeadline, setIsAfterDeadline] = useState(false);
  const { event } = useEventContext();

  const groomPhone = event?.groomPhone ?? import.meta.env.VITE_GROOM_PHONE;
  const groomWAMessage = event?.groomWAMessage ?? import.meta.env.VITE_GROOM_WHATSAPP_MESSAGE;
  const bridePhone = event?.bridePhone ?? import.meta.env.VITE_BRIDE_PHONE;
  const brideWAMessage = event?.brideWAMessage ?? import.meta.env.VITE_BRIDE_WHATSAPP_MESSAGE;
  const giftMessage = event?.config?.giftMessage ??
    "El mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros, les dejamos esta opción:";

  const labels = event?.config?.labels;
  const giftsLabel   = labels?.gifts   ?? "SUGERENCIA DE REGALOS";
  const envelopeLabel = labels?.envelope ?? "LLUVIA DE SOBRES";
  const confirmLabel = labels?.confirm  ?? "CONFIRMAR ASISTENCIA";
  const groomLabel   = labels?.groomLabel ?? "Novio";
  const brideLabel   = labels?.brideLabel ?? "Novia";
  const deadlineLabel = labels?.deadline  ?? "* Fecha límite para confirmar:";
  const closedLabel  = labels?.closed    ?? "(Cerrado)";
  const closingLabel = labels?.closing   ?? "ESPERAMOS CONTAR CON SU PRESENCIA";
  const thanksLabel  = labels?.thanks    ?? "Muchas Gracias!";

  const rsvpDeadlineDate = event?.rsvpDeadline ? new Date(event.rsvpDeadline) : null;
  const deadlineText = rsvpDeadlineDate
    ? rsvpDeadlineDate.toLocaleDateString("es-CO", { day: "numeric", month: "long", timeZone: "America/Bogota" })
    : "20 de octubre";

  // Verificar fecha límite automáticamente
  useEffect(() => {
    const checkAndUpdate = () => {
      const nowColombia = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" });
      const now = new Date(nowColombia);
      const deadlineSource = event?.rsvpDeadline || import.meta.env.VITE_RSVP_DEADLINE || "2025-10-20T12:00:00";
      const testDeadline = new Date(deadlineSource);
      const deadlineColombia = new Date(
        testDeadline.toLocaleString("en-US", { timeZone: "America/Bogota" })
      );
      setIsAfterDeadline(now > deadlineColombia);
    };

    checkAndUpdate();
    const interval = setInterval(checkAndUpdate, 3000);
    return () => clearInterval(interval);
  }, [event?.rsvpDeadline]);

  // Preparar el layout antes de mostrar cualquier contenido
  useEffect(() => {
    const layoutTimer = setTimeout(() => {
      setLayoutReady(true);
    }, 100);

    return () => clearTimeout(layoutTimer);
  }, []);

  // Usar el hook unificado para precargar imágenes
  useImagePreload(layoutReady ? ["/ramo-lateral.png", "/fondo.png"] : [], { delay: 0 });

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
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.img
                src="/regalo.png"
                alt="Gift box icon for wedding present suggestions"
                loading="lazy"
                className="w-20 h-20 mb-3"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
              />
              <motion.p
                className="text-2xl md:text-3xl font-serif font-semibold text-[#162b4e] text-center mb-2 tracking-wide"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.6 }}
              >
                {giftsLabel}
              </motion.p>
              <motion.p
                className="text-center text-base md:text-lg text-[#162b4e] mb-2 max-w-xl"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                {giftMessage}
              </motion.p>
              <motion.div
                className="text-xl md:text-2xl font-serif font-semibold text-[#162b4e] text-center mt-4 mb-2 tracking-wide"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 1.0 }}
              >
                {envelopeLabel}
              </motion.div>
              <motion.img
                src="/sobre.png"
                alt="Envelope icon for monetary gift suggestion"
                loading="lazy"
                className="w-16 h-16 mt-1"
                initial={{ scale: 0, y: 20 }}
                whileInView={{ scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 1.2, type: "spring", stiffness: 300 }}
              />
            </motion.div>

            {/* Confirmar asistencia */}
            <motion.div
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              <motion.p
                className="text-2xl md:text-3xl font-serif font-bold text-center tracking-wide text-[#bfa15a]"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 1.6 }}
              >
                {confirmLabel}
              </motion.p>
              <motion.div
                className="flex flex-row gap-4"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 1.8 }}
              >
                {/* Botón WhatsApp Novio */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: 2.0, type: "spring", stiffness: 200 }}
                >
                  <Button
                    className={`!bg-[#466691] !text-white !flex !items-center !gap-2 !px-4 !py-2 !rounded-full !shadow-md !cursor-pointer ${
                      isAfterDeadline ? "!opacity-50 !cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (!isAfterDeadline) {
                        window.open(
                          `https://wa.me/${groomPhone}?text=${groomWAMessage}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                    aria-label="WhatsApp Novio"
                    disabled={isAfterDeadline}
                  >
                    <img
                      src="/whatsapp.svg"
                      alt="WhatsApp icon"
                      loading="lazy"
                      className="w-8 h-8"
                      style={{ filter: "invert(1) brightness(2)" }}
                    />
                    {groomLabel}
                  </Button>
                </motion.div>
                {/* Botón WhatsApp Novia */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: 2.2, type: "spring", stiffness: 200 }}
                >
                  <Button
                    className={`!bg-[#466691] !text-white !flex !items-center !gap-2 !px-4 !py-2 !rounded-full !shadow-md !cursor-pointer ${
                      isAfterDeadline ? "!opacity-50 !cursor-not-allowed" : ""
                    }`}
                    onClick={() => {
                      if (!isAfterDeadline) {
                        window.open(
                          `https://wa.me/${bridePhone}?text=${brideWAMessage}`,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                    aria-label="WhatsApp Novia"
                    disabled={isAfterDeadline}
                  >
                    <img
                      src="/whatsapp.svg"
                      alt="WhatsApp icon"
                      loading="lazy"
                      className="w-8 h-8"
                      style={{ filter: "invert(1) brightness(2)" }}
                    />
                    {brideLabel}
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-row gap-4 mt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 2.4 }}
              >
                <p className="text-[#bfa15a] font-serif text-center w-full opacity-80">
                  {deadlineLabel}{" "}
                  <span className="font-semibold">{deadlineText}</span>
                </p>
              </motion.div>
              <motion.div
                className="flex flex-row gap-4 mt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: 2.6 }}
              >
                <p className="text-sm text-[#bfa15a] font-serif text-center w-full opacity-80">
                  {isAfterDeadline ? closedLabel : ""}
                </p>
              </motion.div>
            </motion.div>
          </div>
          {/* Mensaje final */}
          <div className="flex flex-col items-center justify-start w-full h-[250px] gap-2">
            <p className="text-lg md:text-xl font-serif text-[#162b4e] text-center tracking-wide mb-2">
              {closingLabel}
            </p>
            <p
              className="text-5xl font-[cursive,serif] text-gray-700 text-center font-light italic"
              style={{ fontFamily: '"Great Vibes", cursive, serif' }}
            >
              {thanksLabel}
            </p>

            <div className="absolute w-[500px] h-[500px]" style={{ bottom: "-220px" }}>
              <img
                src="/ramo-lateral.png"
                alt="Decorative flower bouquet at the bottom of the invitation"
                loading="lazy"
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
