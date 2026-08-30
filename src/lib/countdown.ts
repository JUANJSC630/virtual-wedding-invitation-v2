export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Tiempo restante hasta `eventDate` medido desde `now`.
 *
 * Una vez alcanzada la fecha devuelve todo en cero: la cuenta regresiva se
 * detiene en 00:00:00:00 en vez de mostrar valores negativos.
 */
export function getTimeLeft(eventDate: Date, now: Date = new Date()): TimeLeft {
  const diff = eventDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
