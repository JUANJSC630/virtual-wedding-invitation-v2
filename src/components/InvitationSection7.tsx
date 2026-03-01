import { useRef } from "react";

import { Variants, motion, useInView } from "framer-motion";

import { useAssets } from "@/context/AssetContext";
import { useEventContext } from "@/context/EventContext";
import { TimelineItem } from "@/types";

const DEFAULT_TIMELINE: TimelineItem[] = [
  { id: "1", time: "6:00 PM",  label: "CEREMONIA RELIGIOSA", icon: "church" },
  { id: "2", time: "8:00 PM",  label: "RECEPCIÓN",            icon: "reception" },
  { id: "3", time: "9:00 PM",  label: "BRINDIS",              icon: "glasses" },
  { id: "4", time: "9:30 PM",  label: "VALS",                 icon: "waltz" },
  { id: "5", time: "11:00 PM", label: "CENA",                 icon: "dinner" },
];

const InvitationSection7 = () => {
  const { event } = useEventContext();
  const assets = useAssets();

  const ICON_MAP: Record<string, { src: string; alt: string }> = {
    church:    { src: assets.church,    alt: "Ceremonia religiosa" },
    glasses:   { src: assets.glasses,   alt: "Brindis" },
    dinner:    { src: assets.dinner,    alt: "Cena" },
    reception: { src: assets.reception, alt: "Recepción" },
    waltz:     { src: assets.waltz,     alt: "Vals" },
  };
  const ref = useRef(null);

  const timeline = event?.config?.timeline ?? DEFAULT_TIMELINE;
  const title = event?.config?.labels?.timelineTitle ?? "Itinerario";

  // Even indices (0, 2, 4…) → left column; odd (1, 3, 5…) → right column
  const leftItems  = timeline.filter((_, i) => i % 2 === 0);
  const rightItems = timeline.filter((_, i) => i % 2 !== 0);

  const isInView = useInView(ref, { once: true, margin: "-50px", amount: 0.3 });

  const fadeInUp: Variants = {
    hidden:  { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const renderItem = (item: TimelineItem, side: "left" | "right", delay: number) => {
    const icon = ICON_MAP[item.icon] ?? { src: item.icon, alt: item.label };
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: side === "left" ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, delay }}
        className={`flex flex-col ${side === "left" ? "items-end" : "items-start"}`}
      >
        <img src={icon.src} alt={icon.alt} loading="lazy" className="w-20 h-20 mb-1" />
        <span className="text-base font-semibold text-[#162b4e]">{item.time}</span>
        <span className={`text-sm md:text-base font-serif text-[#162b4e] ${side === "left" ? "text-right" : "text-left"}`}>
          {item.label}
        </span>
      </motion.div>
    );
  };

  return (
    <section className="relative flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${assets.background}')` }}
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
          {/* Título */}
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-4xl font-serif text-[#bfa15a] text-center">{title}</p>
          </motion.div>

          {/* Grid de 3 columnas */}
          <div className="w-full max-w-3xl mx-auto grid grid-cols-3 gap-0 relative">
            {/* Columna izquierda */}
            <div className="flex flex-col items-end justify-center gap-12">
              {leftItems.map((item, i) => renderItem(item, "left", i * 0.2))}
            </div>

            {/* Columna central: línea decorativa */}
            <div className="flex flex-col items-center justify-center relative">
              <motion.img
                src={assets.decorLine}
                alt="Línea decorativa"
                className="h-[90%] w-8 object-contain mx-auto"
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              />
            </div>

            {/* Columna derecha */}
            <div className="flex flex-col items-start justify-center gap-12 pt-24">
              {rightItems.map((item, i) => renderItem(item, "right", i * 0.2 + 0.1))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InvitationSection7;
