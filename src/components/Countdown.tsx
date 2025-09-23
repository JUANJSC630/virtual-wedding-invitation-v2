import { useEffect, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

const EVENT_DATE = new Date("2025-11-15T18:00:00-05:00"); // 15 Noviembre 2025, 6:00pm

function getTimeLeft() {
  const now = new Date();
  const diff = EVENT_DATE.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
        Sábado
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
          Noviembre
        </motion.span>
        <motion.span
          className="text-5xl md:text-6xl font-serif mx-2 leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          15
        </motion.span>
        <motion.span
          className="mb-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          del 2025
        </motion.span>
      </motion.div>
      <motion.div
        className="text-[#bfa15a] text-2xl md:text-3xl font-serif my-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        Faltan
      </motion.div>
      <motion.div
        className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-[#162b4e]"
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
        <span className="text-[#bfa15a] font-normal">:</span>
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
        <span className="text-[#bfa15a] font-normal">:</span>
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
        <span className="text-[#bfa15a] font-normal">:</span>
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
