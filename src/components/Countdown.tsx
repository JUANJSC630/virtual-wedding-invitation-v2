import React, { useEffect, useState } from "react";

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
    <section className="flex flex-col items-center justify-center py-8">
      <div className="text-base md:text-lg font-semibold text-[#3b5a75] tracking-widest uppercase mb-1">Sábado</div>
      <div className="flex items-end justify-center gap-2 text-[#3b5a75] text-lg md:text-xl font-medium">
        <span>Noviembre</span>
        <span className="text-5xl md:text-6xl font-serif mx-2 leading-none">15</span>
        <span className="mb-1">del 2025</span>
      </div>
      <div className="text-[#bfa15a] text-2xl md:text-3xl font-serif my-1">Faltan</div>
      <div className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-[#162b4e]">
        <span>{String(timeLeft.days).padStart(2, "0")}</span>
        <span className="text-[#bfa15a] font-normal">:</span>
        <span>{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="text-[#bfa15a] font-normal">:</span>
        <span>{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="text-[#bfa15a] font-normal">:</span>
        <span className="text-[#bfa15a]">{String(timeLeft.seconds).padStart(2, "0")}</span>
      </div>
      <div className="text-xs text-gray-500 mt-2 tracking-wide">para nuestra boda</div>
    </section>
  );
};

export default Countdown;
