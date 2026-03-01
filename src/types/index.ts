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

// Timeline item for Section 7
export interface TimelineItem {
  id: string;
  time: string;
  label: string;
  icon: "church" | "glasses" | "dinner" | "reception" | "waltz" | string;
}

// Theme Config
export interface ThemeConfig {
  primaryColor?: string;  // default #162b4e (navy)
  accentColor?:  string;  // default #bfa15a (gold)
  actionColor?:  string;  // default #466691 (blue buttons)
  textColor?:    string;  // default #374151 (body text)
  fontSpecial?:  string;  // default "Great Vibes", cursive
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
}

// Event Config
export interface EventConfig {
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
  };
}

// Event Types
export interface Event {
  id: string;
  slug: string;
  groomName: string;
  brideName: string;
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
  createdAt: Date;
  updatedAt: Date;
  companions: Companion[];
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
