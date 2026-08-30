import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { getTimeLeft } from "@/lib/countdown";

import { useEventContext } from "@/context/EventContext";

const FALLBACK_DATE = "2025-11-22T18:00:00-05:00";

const Countdown = () => {
  const { event } = useEventContext();
  const eventDateISO = event?.eventDate ?? FALLBACK_DATE;
  // Identidad estable: sin memo, `new Date(...)` se recrea en cada render y el
  // efecto no puede declarar deps estáticamente verificables.
  const eventDate = useMemo(() => new Date(eventDateISO), [eventDateISO]);

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(eventDate));

  useEffect(() => {
    setTimeLeft(getTimeLeft(eventDate));
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(eventDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  const locale = "es-CO";
  const tz = "America/Bogota";
  const dayOfWeek = eventDate.toLocaleDateString(locale, { weekday: "long", timeZone: tz });
  const dayCapitalized = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
  const month = eventDate.toLocaleDateString(locale, { month: "long", timeZone: tz });
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
  const dayNumber = eventDate.toLocaleDateString(locale, { day: "numeric", timeZone: tz });
  const year = eventDate.getFullYear();

  return (
    <motion.section
      className="flex flex-col items-center justify-center py-8"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        className="text-base md:text-lg font-semibold text-[#3b5a75] tracking-widest uppercase mb-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {dayCapitalized}
      </motion.div>
      <motion.div
        className="flex items-end justify-center gap-2 text-[#3b5a75] text-lg md:text-xl font-medium"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {monthCapitalized}
        </motion.span>
        <motion.span
          className="text-5xl md:text-6xl font-serif mx-2 leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          {dayNumber}
        </motion.span>
        <motion.span
          className="mb-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          del {year}
        </motion.span>
      </motion.div>
      <motion.div
        className="text-[var(--color-accent)] text-2xl md:text-3xl font-serif my-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        Faltan
      </motion.div>
      <motion.div
        className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-[var(--color-primary)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={timeLeft.days}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {String(timeLeft.days).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
        <span className="text-[var(--color-accent)] font-normal">:</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={timeLeft.hours}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {String(timeLeft.hours).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
        <span className="text-[var(--color-accent)] font-normal">:</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={timeLeft.minutes}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {String(timeLeft.minutes).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
        <span className="text-[var(--color-accent)] font-normal">:</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={timeLeft.seconds}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {String(timeLeft.seconds).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="text-xs text-gray-500 mt-2 tracking-wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        para nuestra boda
      </motion.div>
    </motion.section>
  );
};

export default Countdown;
