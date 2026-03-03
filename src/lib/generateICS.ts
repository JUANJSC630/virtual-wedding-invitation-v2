/**
 * Generates and downloads an .ics (iCalendar) file for a wedding event.
 * Compatible with Google Calendar, Apple Calendar, and Outlook.
 */

interface ICSEvent {
  title: string;
  date: string;        // ISO date string e.g. "2025-11-21T00:00:00.000Z"
  ceremonyTime: string; // "6:00 PM"
  ceremonyName: string;
  ceremonyAddress: string;
  receptionTime: string; // "8:00 PM"
  receptionName: string;
  receptionAddress: string;
}

/** Parse "6:00 PM" or "18:00" → { hours, minutes } */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const clean = (timeStr ?? "").trim();
  const ampm = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return { hours: h, minutes: m };
  }
  const plain = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (plain) return { hours: parseInt(plain[1]), minutes: parseInt(plain[2]) };
  return { hours: 18, minutes: 0 }; // fallback 6 PM
}

/** Format Date as YYYYMMDDTHHMMSS (local, no Z suffix — let calendar app handle timezone) */
function formatDT(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

function uid(): string {
  return `wedding-${Date.now()}-${Math.random().toString(36).slice(2)}@invitation`;
}

export function downloadICS(event: ICSEvent): void {
  const baseDate = new Date(event.date);
  const year  = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day   = baseDate.getUTCDate();

  const { hours: cH, minutes: cM } = parseTime(event.ceremonyTime);
  const { hours: rH, minutes: rM } = parseTime(event.receptionTime);

  const ceremonyStart = new Date(year, month, day, cH, cM);
  const ceremonyEnd   = new Date(year, month, day, cH + 2, cM);
  const receptionStart = new Date(year, month, day, rH, rM);
  const receptionEnd   = new Date(year, month, day, rH + 3, rM);

  const escape = (s: string) => s.replace(/[,;\\]/g, "\\$&").replace(/\n/g, "\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Virtual Wedding Invitation//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",

    // Ceremonia
    "BEGIN:VEVENT",
    `UID:ceremony-${uid()}`,
    `DTSTART:${formatDT(ceremonyStart)}`,
    `DTEND:${formatDT(ceremonyEnd)}`,
    `SUMMARY:${escape(event.title)} — Ceremonia`,
    `LOCATION:${escape(event.ceremonyName)}\\, ${escape(event.ceremonyAddress)}`,
    `DESCRIPTION:Ceremonia religiosa a las ${escape(event.ceremonyTime)} en ${escape(event.ceremonyName)}.`,
    "END:VEVENT",

    // Recepción
    "BEGIN:VEVENT",
    `UID:reception-${uid()}`,
    `DTSTART:${formatDT(receptionStart)}`,
    `DTEND:${formatDT(receptionEnd)}`,
    `SUMMARY:${escape(event.title)} — Recepción`,
    `LOCATION:${escape(event.receptionName)}\\, ${escape(event.receptionAddress)}`,
    `DESCRIPTION:Recepción a las ${escape(event.receptionTime)} en ${escape(event.receptionName)}.`,
    "END:VEVENT",

    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "boda.ics";
  a.click();
  URL.revokeObjectURL(url);
}
