/**
 * Modelo del formulario de evento del panel maestro.
 *
 * Extraído de MasterDashboard.tsx, que acumulaba 2004 líneas con tres
 * componentes y todo este modelo dentro.
 */
import { buildLegacyLayout } from "@/blocks/legacyLayout";
import { BlockInstance } from "@/blocks/types";

import { RsvpQuestion, sanitizeQuestions } from "@/lib/rsvpQuestions";

import {
  AssetMap,
  EventTypeSlug,
  EventWithStats,
  GalleryPhoto,
  Honoree,
  SectionsConfig,
  ThemeConfig,
  TimelineItem,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventFormData {
  slug: string;
  // Multi-ocasión (Fase C)
  eventType: EventTypeSlug;
  honorees: Honoree[];
  eventTitle: string;
  groomName: string;
  brideName: string;
  eventDate: string;
  rsvpDeadline: string;
  isActive: boolean;
  // Venues
  ceremonyTime: string;
  ceremonyName: string;
  ceremonyAddress: string;
  ceremonyMapsUrl: string;
  receptionTime: string;
  receptionName: string;
  receptionAddress: string;
  receptionMapsUrl: string;
  venueName: string;
  venueAddress: string;
  // Texts
  verseText: string;
  verseReference: string;
  heroMessage: string;
  giftMessage: string;
  dressCode: string;
  dressCodeLabel: string;
  dressCodeLadies: string;
  dressCodeGentlemen: string;
  // Families
  parentsBride: string;
  parentsGroom: string;
  godparents: string;
  bridesmaids: string;
  groomsmen: string;
  // Contact & Assets
  groomPhone: string;
  bridePhone: string;
  groomWAMessage: string;
  brideWAMessage: string;
  heroPhotoUrl: string;
  photo2Url: string;
  photo3Url: string;
  audioUrl: string;
  // Section-specific
  announcementText: string;
  timeline: TimelineItem[];
  // Assets
  assets: AssetMap;
  // Theme
  theme: ThemeConfig;
  // Gallery
  gallery: GalleryPhoto[];
  // Sections
  sections: SectionsConfig;
  // RSVP mode
  rsvpMode: "whatsapp" | "form";
  rsvpQuestions: RsvpQuestion[];
  // Labels
  labels: Record<string, string>;
  // Secciones dinámicas (Fase B)
  layout: BlockInstance[];
}

export interface ClientAdminRow {
  id: string;
  email: string;
  name: string;
}

// ─── Color palettes ───────────────────────────────────────────────────────────

export interface ColorPalette {
  name: string;
  primaryColor: string;
  accentColor: string;
  actionColor: string;
  textColor: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  { name: "Navy + Gold",        primaryColor: "#162b4e", accentColor: "#bfa15a", actionColor: "#466691", textColor: "#bfa15a" },
  { name: "Blush + Rosa",       primaryColor: "#f5e6e0", accentColor: "#c4887f", actionColor: "#b06f65", textColor: "#4a3030" },
  { name: "Sage + Marfil",      primaryColor: "#f8f5f0", accentColor: "#7d9b76", actionColor: "#5a7a53", textColor: "#3d4a38" },
  { name: "Borgoña + Champán",  primaryColor: "#3d1a24", accentColor: "#d4b896", actionColor: "#8b3a52", textColor: "#d4b896" },
  { name: "Azul Pizarra + Plata", primaryColor: "#2c3e5c", accentColor: "#c0c8d4", actionColor: "#5b7fa6", textColor: "#c0c8d4" },
  { name: "Terracota + Beige",  primaryColor: "#f5ede4", accentColor: "#c27755", actionColor: "#a05c3b", textColor: "#4a3520" },
  { name: "Negro + Oro",        primaryColor: "#1a1a1a", accentColor: "#d4af37", actionColor: "#8b6914", textColor: "#d4af37" },
  { name: "Lavanda + Blanco",   primaryColor: "#f8f5ff", accentColor: "#9b7cc8", actionColor: "#7b5aa6", textColor: "#3d2d5c" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const emptyForm: EventFormData = {
  slug: "", eventType: "wedding", honorees: [], eventTitle: "",
  groomName: "", brideName: "", eventDate: "", rsvpDeadline: "",
  isActive: true, ceremonyTime: "", ceremonyName: "", ceremonyAddress: "",
  ceremonyMapsUrl: "", receptionTime: "", receptionName: "", receptionAddress: "",
  receptionMapsUrl: "", venueName: "", venueAddress: "", verseText: "",
  verseReference: "", heroMessage: "", giftMessage: "", dressCode: "",
  dressCodeLabel: "", dressCodeLadies: "", dressCodeGentlemen: "",
  parentsBride: "", parentsGroom: "", godparents: "", bridesmaids: "",
  groomsmen: "", groomPhone: "", bridePhone: "", groomWAMessage: "",
  brideWAMessage: "", heroPhotoUrl: "", photo2Url: "", photo3Url: "",
  audioUrl: "", announcementText: "", timeline: [], gallery: [],
  sections: { showVerse: true, showNames: true, showPhotos: true, showFamily: true, showVenues: true, showTimeline: true, showGifts: true, showGallery: true },
  rsvpMode: "whatsapp",
  rsvpQuestions: [],
  assets: {}, theme: {}, labels: {},
  layout: buildLegacyLayout(undefined),
};

export function eventToForm(ev: EventWithStats): EventFormData {
  return {
    slug: ev.slug,
    eventType: ev.config?.eventType ?? "wedding",
    honorees: ev.config?.honorees ?? [],
    eventTitle: ev.config?.eventTitle ?? "",
    groomName: ev.groomName,
    brideName: ev.brideName,
    eventDate: ev.eventDate ? ev.eventDate.slice(0, 10) : "",
    rsvpDeadline: ev.rsvpDeadline ? ev.rsvpDeadline.slice(0, 10) : "",
    isActive: ev.isActive,
    ceremonyTime: ev.ceremonyTime || "",
    ceremonyName: ev.config?.ceremony?.name || "",
    ceremonyAddress: ev.config?.ceremony?.address || "",
    ceremonyMapsUrl: ev.config?.ceremony?.mapsUrl || "",
    receptionTime: ev.receptionTime || "",
    receptionName: ev.config?.reception?.name || "",
    receptionAddress: ev.config?.reception?.address || "",
    receptionMapsUrl: ev.config?.reception?.mapsUrl || "",
    venueName: ev.venueName || "",
    venueAddress: ev.venueAddress || "",
    verseText: ev.config?.verse?.text || "",
    verseReference: ev.config?.verse?.reference || "",
    heroMessage: ev.config?.heroMessage || "",
    giftMessage: ev.config?.giftMessage || "",
    dressCode: ev.dressCode || "",
    dressCodeLabel: ev.config?.dressCode?.label || "",
    dressCodeLadies: ev.config?.dressCode?.ladies || "",
    dressCodeGentlemen: ev.config?.dressCode?.gentlemen || "",
    parentsBride: ev.config?.parents?.bride?.join("\n") || "",
    parentsGroom: ev.config?.parents?.groom?.join("\n") || "",
    godparents: ev.config?.godparents?.join("\n") || "",
    bridesmaids: ev.config?.bridesmaids?.join("\n") || "",
    groomsmen: ev.config?.groomsmen?.join("\n") || "",
    groomPhone: ev.groomPhone || "",
    bridePhone: ev.bridePhone || "",
    groomWAMessage: ev.groomWAMessage || "",
    brideWAMessage: ev.brideWAMessage || "",
    heroPhotoUrl: ev.heroPhotoUrl || "",
    photo2Url: ev.photo2Url || "",
    photo3Url: ev.photo3Url || "",
    audioUrl: ev.audioUrl || "",
    announcementText: ev.config?.announcementText || "",
    timeline: ev.config?.timeline ?? [],
    gallery: ev.config?.gallery ?? [],
    sections: {
      showVerse:    ev.config?.sections?.showVerse    ?? true,
      showNames:    ev.config?.sections?.showNames    ?? true,
      showPhotos:   ev.config?.sections?.showPhotos   ?? true,
      showFamily:   ev.config?.sections?.showFamily   ?? true,
      showVenues:   ev.config?.sections?.showVenues   ?? true,
      showTimeline: ev.config?.sections?.showTimeline ?? true,
      showGifts:    ev.config?.sections?.showGifts    ?? true,
      showGallery:  ev.config?.sections?.showGallery  ?? true,
    },
    rsvpMode: (ev.config?.rsvpMode === "form" ? "form" : "whatsapp") as "whatsapp" | "form",
    rsvpQuestions: sanitizeQuestions(ev.config?.rsvpQuestions),
    assets: (ev.assets as AssetMap) ?? {},
    theme: (ev.theme as ThemeConfig) ?? {},
    labels: (ev.config?.labels as Record<string, string>) ?? {},
    // Materializa el layout desde el legacy si el evento aún no tiene uno,
    // para que el constructor de Diseño muestre las secciones actuales.
    layout: ev.config?.layout?.length ? ev.config.layout : buildLegacyLayout(ev.config?.sections),
  };
}

export const ASSET_LABELS: Record<string, string> = {
  background:   "Fondo de pantalla",
  cornerFlower: "Flor esquina",
  bouquet:      "Ramo central",
  sideBouquet:  "Ramo lateral",
  flowers:      "Flores decorativas",
  tornPaper:    "Hoja rasgada",
  church:       "Icono iglesia",
  glasses:      "Icono copas / brindis",
  dinner:       "Icono cena",
  reception:    "Icono recepción",
  waltz:        "Icono vals",
  decorLine:    "Línea decorativa (itinerario)",
  gift:         "Icono regalo",
  envelope:     "Icono sobre",
  entryBg:      "Fondo pantalla de entrada",
  infoBg:       "Fondo pantalla de confirmación",
};
