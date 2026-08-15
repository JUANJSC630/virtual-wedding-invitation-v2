import { Event, EventTypeSlug, Honoree } from "@/types";

/**
 * Fase C — Multi-ocasión.
 *
 * Capa de abstracción que reemplaza el acceso directo a `groomName`/`brideName`
 * por un concepto genérico de "protagonistas" (`honorees`). Es NO-destructivo:
 * si un evento no trae `honorees` (datos legacy o columna aún sin migrar), se
 * derivan de los campos boda. Así los eventos existentes siguen idénticos.
 */

// Catálogo de tipos de evento y los roles de protagonista que pide cada uno.
// Sirve al panel (qué campos mostrar) y a los defaults al crear un evento.
export const EVENT_TYPES: Record<
  EventTypeSlug,
  { name: string; honoreeRoles: { role: string; label: string }[] }
> = {
  wedding: {
    name: "Boda",
    honoreeRoles: [
      { role: "bride", label: "Novia" },
      { role: "groom", label: "Novio" },
    ],
  },
  quinceanera: {
    name: "XV Años",
    honoreeRoles: [{ role: "celebrant", label: "Quinceañera" }],
  },
  baptism: {
    name: "Bautizo",
    honoreeRoles: [{ role: "baby", label: "Bautizado/a" }],
  },
  communion: {
    name: "Primera Comunión",
    honoreeRoles: [{ role: "celebrant", label: "Homenajeado/a" }],
  },
  birthday: {
    name: "Cumpleaños",
    honoreeRoles: [{ role: "celebrant", label: "Cumpleañero/a" }],
  },
  corporate: {
    name: "Corporativo",
    honoreeRoles: [{ role: "host", label: "Organiza" }],
  },
  other: {
    name: "Otro",
    honoreeRoles: [{ role: "host", label: "Anfitrión" }],
  },
};

/** Tipo de evento efectivo (default: "wedding" para compatibilidad legacy). */
export function getEventType(event?: Pick<Event, "eventType"> | null): EventTypeSlug {
  return event?.eventType ?? "wedding";
}

/**
 * Protagonistas del evento. Usa `event.honorees` si viene poblado; si no,
 * los deriva de los campos legacy `brideName`/`groomName` (orden novia → novio,
 * igual que la UI actual).
 */
export function getHonorees(
  event?: Pick<Event, "honorees" | "brideName" | "groomName"> | null
): Honoree[] {
  if (event?.honorees && event.honorees.length > 0) {
    return event.honorees.filter(h => h.name && h.name.trim() !== "");
  }
  const legacy: Honoree[] = [];
  if (event?.brideName?.trim()) legacy.push({ role: "bride", label: "Novia", name: event.brideName });
  if (event?.groomName?.trim()) legacy.push({ role: "groom", label: "Novio", name: event.groomName });
  return legacy;
}

/** Nombres unidos para títulos, p. ej. "Jimena & Juan" o "Laura Sofía". */
export function getHonoreesNames(
  event?: Pick<Event, "honorees" | "brideName" | "groomName"> | null,
  separator = " & "
): string {
  return getHonorees(event)
    .map(h => h.name.trim())
    .filter(Boolean)
    .join(separator);
}

/** Iniciales de cada protagonista, p. ej. ["J", "J"]. */
export function getHonoreesInitials(
  event?: Pick<Event, "honorees" | "brideName" | "groomName"> | null
): string[] {
  return getHonorees(event).map(h => (h.name.trim()[0] ?? "").toUpperCase());
}

/** ¿El evento tiene dos protagonistas (formato pareja)? Útil para layouts. */
export function isCoupleEvent(
  event?: Pick<Event, "honorees" | "brideName" | "groomName"> | null
): boolean {
  return getHonorees(event).length >= 2;
}
