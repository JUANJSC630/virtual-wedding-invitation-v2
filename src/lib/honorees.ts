import { Event, EventConfig, EventTypeSlug, Honoree } from "@/types";

/**
 * Fuente flexible de datos de evento para los helpers: acepta el `Event`
 * completo o cualquier subconjunto (incluida la config donde viven los datos
 * multi-ocasión mientras no se promueva a columnas propias).
 */
type EventLike =
  | (Partial<Pick<Event, "honorees" | "eventType" | "brideName" | "groomName">> & {
      config?: Partial<EventConfig> | null;
    })
  | null
  | undefined;

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
export function getEventType(event?: EventLike): EventTypeSlug {
  return event?.eventType ?? event?.config?.eventType ?? "wedding";
}

/**
 * Protagonistas del evento. Prioridad: `event.honorees` (columna futura) →
 * `event.config.honorees` (donde se guardan hoy) → derivados de los campos
 * legacy `brideName`/`groomName` (orden novia → novio, igual que la UI actual).
 */
export function getHonorees(event?: EventLike): Honoree[] {
  const source =
    (event?.honorees && event.honorees.length > 0 ? event.honorees : event?.config?.honorees) ?? [];
  const list = source.filter(h => h?.name && h.name.trim() !== "");
  if (list.length > 0) return list;

  const legacy: Honoree[] = [];
  if (event?.brideName?.trim()) legacy.push({ role: "bride", label: "Novia", name: event.brideName });
  if (event?.groomName?.trim()) legacy.push({ role: "groom", label: "Novio", name: event.groomName });
  return legacy;
}

/** Nombres unidos para títulos, p. ej. "Jimena & Juan" o "Laura Sofía". */
export function getHonoreesNames(event?: EventLike, separator = " & "): string {
  return getHonorees(event)
    .map(h => h.name.trim())
    .filter(Boolean)
    .join(separator);
}

/** Iniciales de cada protagonista, p. ej. ["J", "J"]. */
export function getHonoreesInitials(event?: EventLike): string[] {
  return getHonorees(event).map(h => (h.name.trim()[0] ?? "").toUpperCase());
}

/** ¿El evento tiene dos protagonistas (formato pareja)? Útil para layouts. */
export function isCoupleEvent(event?: EventLike): boolean {
  return getHonorees(event).length >= 2;
}
