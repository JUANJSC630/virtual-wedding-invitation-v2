import type { BlockInstance } from "@/blocks/types";
import type { RsvpQuestion, RsvpAnswers } from "@/lib/rsvpQuestions";

// Audio Player Types
export interface AudioPlayerProps {
  src: string;
  songTitle?: string;
}

// Lazy Image Types
export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  threshold?: number;
  rootMargin?: string;
}

// Hook Types
export interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
}

export interface UseImagePreloadOptions {
  delay?: number;
  onLoadComplete?: () => void;
}

export interface UseImagePreloadReturn {
  imagesLoaded: boolean;
  loadedCount: number;
  totalImages: number;
  loadingProgress: number;
}

// Button Types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "custom";
}

// Animation Types
export interface AnimationVariants {
  hidden: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
    scaleY?: number;
  };
  visible: {
    opacity: number;
    y?: number;
    x?: number;
    scale?: number;
    scaleY?: number;
    transition?: {
      duration?: number;
      delay?: number;
      staggerChildren?: number;
    };
  };
}

// Environment Variables Types
export interface EnvConfig {
  VITE_GROOM_PHONE: string;
  VITE_BRIDE_PHONE: string;
  VITE_WEDDING_DATE: string;
  VITE_RSVP_DEADLINE: string;
}

// Wedding Event Types
export interface WeddingEvent {
  id: string;
  title: string;
  time: string;
  description?: string;
  icon?: string;
}

// Contact Types
export interface ContactInfo {
  phone: string;
  whatsappMessage: string;
  label: string;
}

// Gallery photo
export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
}

// Timeline item for Section 7
export interface TimelineItem {
  id: string;
  time: string;
  label: string;
  icon: "church" | "glasses" | "dinner" | "reception" | "waltz" | string;
}

// Theme Config
export interface ThemeConfig {
  primaryColor?:    string;  // default #162b4e (navy)
  accentColor?:     string;  // default #bfa15a (gold)
  actionColor?:     string;  // default #466691 (blue buttons)
  textColor?:       string;  // default #374151 (body text)
  fontSpecial?:     string;  // default "Great Vibes", cursive
  fontSerif?:       string;  // default "" (system serif); Google Font name e.g. "Playfair Display"
  overlayOpacity?:  number;  // 0-80, default 20 — black overlay on entry/info screens
  cardOpacity?:     number;  // 10-95, default 30 — card background opacity on entry/info screens
  cardBgColor?:     string;  // default #ffffff — card background color on entry/info screens
  inputBgColor?:    string;  // default #ffffff — input background color on entry screen
  inputOpacity?:    number;  // 10-95, default 70 — input background opacity on entry screen
}

// Asset Map
export interface AssetMap {
  background?: string;
  cornerFlower?: string;
  bouquet?: string;
  sideBouquet?: string;
  flowers?: string;
  tornPaper?: string;
  church?: string;
  glasses?: string;
  dinner?: string;
  reception?: string;
  waltz?: string;
  decorLine?: string;
  gift?: string;
  envelope?: string;
  entryBg?: string;
  infoBg?: string;
}

// Section visibility toggles
export interface SectionsConfig {
  showVerse: boolean;       // Section 1 — versículo
  showNames: boolean;       // Section 3 — nombres & mensaje
  showPhotos: boolean;      // Sections 2, 4, 9 — fotos decorativas
  showFamily: boolean;      // Section 5 — familias & padrinos
  showVenues: boolean;      // Section 6 — lugares & vestimenta
  showTimeline: boolean;    // Section 7 — itinerario
  showGifts: boolean;       // Section 8 — regalos & RSVP
  showGallery: boolean;     // Gallery — Nuestra Historia
}

// Event Config
export interface EventConfig {
  // Multi-ocasión (Fase C) — se guarda dentro de config para no requerir
  // migración de schema (la columna config Json ya existe y fluye por las rutas).
  eventType?: EventTypeSlug;
  honorees?: Honoree[];
  eventTitle?: string;
  // Secciones dinámicas (Fase B) — array ordenado de bloques. Ausente ⇒ legacy.
  layout?: BlockInstance[];
  verse?: { text: string; reference: string };
  ceremony?: { name: string; address: string; mapsUrl: string };
  reception?: { name: string; address: string; mapsUrl: string };
  parents?: { bride: string[]; groom: string[] };
  godparents?: string[];
  bridesmaids?: string[];
  groomsmen?: string[];
  heroMessage?: string;
  giftMessage?: string;
  dressCode?: { label: string; ladies: string; gentlemen: string };
  announcementText?: string;
  timeline?: TimelineItem[];
  gallery?: GalleryPhoto[];
  sections?: SectionsConfig;
  rsvpMode?: "whatsapp" | "form";
  // Preguntas personalizadas del RSVP (ver src/lib/rsvpQuestions.ts).
  rsvpQuestions?: RsvpQuestion[];
  labels?: {
    // Section 5
    familyTitle?: string;
    companionTitle?: string;
    brideParents?: string;
    groomParents?: string;
    godparents?: string;
    bridesmaids?: string;
    groomsmen?: string;
    // Section 6
    ceremony?: string;
    reception?: string;
    dressCode?: string;
    viewLocation?: string;
    ladies?: string;
    gentlemen?: string;
    // Section 7
    timelineTitle?: string;
    // Section 8
    gifts?: string;
    envelope?: string;
    confirm?: string;
    closing?: string;
    thanks?: string;
    deadline?: string;
    closed?: string;
    groomLabel?: string;
    brideLabel?: string;
    // Gallery
    galleryTitle?: string;
    // Section 8 RSVP form mode
    rsvpYes?: string;
    rsvpNo?: string;
    rsvpCompanions?: string;
    rsvpConfirm?: string;
    rsvpConfirmedMsg?: string;
    rsvpDeclinedMsg?: string;
    rsvpThankYou?: string;
    // Entry screen (GuestCodeEntry)
    entryTitle?: string;
    entrySubtitle?: string;
    entryButton?: string;
    entrySavedCode?: string;
    // Info screen (GuestInfo)
    infoConfirmed?: string;
    infoConfirmedMessage?: string;
    infoPendingMessage?: string;
    infoGuestsLabel?: string;
    infoStatusTitle?: string;
    infoMainGuest?: string;
    infoCompanions?: string;
    infoTotal?: string;
    infoContinueButton?: string;
    infoViewButton?: string;
    addToCalendar?: string;
    shareTitle?: string;
  };
}

// Event Types
// ─── Multi-ocasión (Fase C) ───────────────────────────────────────────────────
// Slug del tipo de evento. "other" es el comodín para ocasiones no catalogadas.
export type EventTypeSlug =
  | "wedding"
  | "quinceanera"
  | "baptism"
  | "communion"
  | "birthday"
  | "corporate"
  | "other";

// Un protagonista genérico del evento. Reemplaza los campos boda-específicos
// groomName/brideName por un array flexible que sirve a cualquier ocasión.
export interface Honoree {
  role: string;  // "groom" | "bride" | "celebrant" | "baby" | "host" | ...
  label: string; // "Novio" | "Novia" | "Quinceañera" | "Bautizado/a" | ...
  name: string;
}

export interface Event {
  id: string;
  slug: string;
  eventType?: EventTypeSlug; // Fase C — opcional; ausente ⇒ se trata como "wedding" (legacy)
  honorees?: Honoree[];      // Fase C — opcional; ausente ⇒ se deriva de groom/brideName
  eventTitle?: string;       // Fase C — nombre libre del evento (para ocasiones sin protagonistas)
  groomName: string;         // legacy — conservar hasta migrar todos los eventos
  brideName: string;         // legacy
  eventDate: string;
  rsvpDeadline?: string;
  venueName?: string;
  venueAddress?: string;
  ceremonyTime?: string;
  receptionTime?: string;
  dressCode?: string;
  config: EventConfig;
  assets: AssetMap;
  theme: ThemeConfig;
  isActive: boolean;
  archivedAt?: string | null;
  heroPhotoUrl?: string;
  photo2Url?: string;
  photo3Url?: string;
  audioUrl?: string;
  groomPhone?: string;
  bridePhone?: string;
  groomWAMessage?: string;
  brideWAMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// Master Panel Types
export interface EventStats {
  totalGuests: number;
  confirmedGuests: number;
  totalAccesses: number;
}

export interface EventWithStats extends Event {
  clientAdmins: Pick<ClientAdmin, "id" | "email" | "name">[];
  stats: EventStats;
}

// Admin Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "master" | "client";
  eventId?: string | null;
  eventSlug?: string | null;
}

export interface ClientAdmin {
  id: string;
  eventId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Guest Management Types
export interface Guest {
  id: string;
  eventId: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  maxGuests: number;
  confirmed: boolean;
  confirmedAt?: Date;
  notes?: string;
  rsvpAnswers?: RsvpAnswers | null;
  createdAt: Date;
  updatedAt: Date;
  companions: Companion[];
  /** Las personas de esta invitación. Ausente en payloads antiguos. */
  attendees?: Attendee[];
  accessCount?: number;
}

/**
 * Una PERSONA de la invitación (titular incluido, vía `isPrimary`).
 * `Guest` modela el hogar; `Attendee`, a cada individuo — es lo que permite
 * menú, silla y código propios. Ver ESTADO_Y_ROADMAP_2026.md §4quater.
 */
export interface Attendee {
  id: string;
  guestId: string;
  name: string;
  isPrimary: boolean;
  confirmed: boolean;
  confirmedAt?: Date | null;
  rsvpAnswers?: RsvpAnswers | null;
}

export interface Companion {
  id: string;
  guestId: string;
  name: string;
  confirmed: boolean;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGuestInput {
  code: string;
  name: string;
  email?: string;
  phone?: string;
  maxGuests?: number;
}

export interface UpdateGuestInput {
  name?: string;
  email?: string;
  phone?: string;
  maxGuests?: number;
  confirmed?: boolean;
  notes?: string;
}

export interface CreateCompanionInput {
  guestId: string;
  name: string;
}

export interface GuestValidationResult {
  valid: boolean;
  guest?: Guest;
  error?: string;
}

export interface RSVPData {
  guestCode: string;
  confirmed: boolean;
  eventSlug: string;
  answers?: RsvpAnswers;
  companions: Array<{
    id?: string;
    name: string;
    confirmed: boolean;
  }>;
}


export interface GuestAccess {
  id: string;
  guestCode: string;
  ipAddress?: string;
  userAgent?: string;
  accessedAt: Date;
}
