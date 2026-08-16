import { SectionsConfig } from "@/types";

import { BlockInstance } from "./types";

/**
 * Layout por defecto que reproduce EXACTAMENTE el orden y los toggles actuales
 * de App.tsx. Se usa cuando un evento no tiene `config.layout` todavía →
 * compatibilidad total con eventos existentes.
 *
 * Orden legacy real: hero, photoTorn, names, photoFlowers, gallery, family,
 * venues, photoHero, timeline, rsvp. Los 3 bloques de foto y el hero/rsvp usan
 * los toggles showPhotos/showVerse/showGifts, igual que antes.
 */
export function buildLegacyLayout(sections?: Partial<SectionsConfig> | null): BlockInstance[] {
  const on = (k: keyof SectionsConfig): boolean => sections?.[k] ?? true;
  return [
    { id: "hero",          type: "hero",         enabled: on("showVerse"),    config: {} },
    { id: "photo-torn",    type: "photoTorn",    enabled: on("showPhotos"),   config: {} },
    { id: "names",         type: "names",        enabled: on("showNames"),    config: {} },
    { id: "photo-flowers", type: "photoFlowers", enabled: on("showPhotos"),   config: {} },
    { id: "gallery",       type: "gallery",      enabled: on("showGallery"),  config: {} },
    { id: "family",        type: "family",       enabled: on("showFamily"),   config: {} },
    { id: "venues",        type: "venues",       enabled: on("showVenues"),   config: {} },
    { id: "photo-hero",    type: "photoHero",    enabled: on("showPhotos"),   config: {} },
    { id: "timeline",      type: "timeline",     enabled: on("showTimeline"), config: {} },
    { id: "rsvp",          type: "rsvp",         enabled: on("showGifts"),    config: {} },
  ];
}

/** Devuelve el layout efectivo: el guardado si existe y no está vacío, si no el legacy. */
export function resolveLayout(
  layout: BlockInstance[] | undefined | null,
  sections?: Partial<SectionsConfig> | null
): BlockInstance[] {
  return layout && layout.length > 0 ? layout : buildLegacyLayout(sections);
}
