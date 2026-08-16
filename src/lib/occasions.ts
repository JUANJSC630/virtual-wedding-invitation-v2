import { EventTypeSlug } from "@/types";

/**
 * Fase C.6 — Textos por defecto según la ocasión.
 *
 * Cuando un evento no define un texto en `config`, se usa el default de su
 * `eventType` en lugar del wording de boda hardcodeado. Un admin siempre puede
 * sobrescribir cualquiera desde el panel.
 */
export interface OccasionDefaults {
  announcementText: string; // Sección 1 — anuncio grande
  shareTitle: string;       // Sección 8 — sufijo al compartir la invitación
}

const OCCASION_DEFAULTS: Record<EventTypeSlug, OccasionDefaults> = {
  wedding:     { announcementText: "¡NOS CASAMOS!",          shareTitle: " — Te invitamos a nuestra boda" },
  quinceanera: { announcementText: "¡MIS XV AÑOS!",          shareTitle: " — Te invito a mis XV años" },
  baptism:     { announcementText: "¡ME BAUTIZO!",           shareTitle: " — Te invitamos a mi bautizo" },
  communion:   { announcementText: "¡MI PRIMERA COMUNIÓN!",  shareTitle: " — Te invitamos a mi Primera Comunión" },
  birthday:    { announcementText: "¡ESTOY DE CUMPLEAÑOS!",  shareTitle: " — Te invito a mi cumpleaños" },
  corporate:   { announcementText: "TE INVITAMOS",           shareTitle: " — Te invitamos a nuestro evento" },
  other:       { announcementText: "TE INVITAMOS",           shareTitle: " — Te invitamos" },
};

/** Defaults de textos de una ocasión (cae a "other" si el tipo es desconocido). */
export function getOccasionDefaults(type: EventTypeSlug): OccasionDefaults {
  return OCCASION_DEFAULTS[type] ?? OCCASION_DEFAULTS.other;
}
