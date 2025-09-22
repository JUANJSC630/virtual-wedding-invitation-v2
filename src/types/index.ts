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

// Guest Management Types
export interface Guest {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  maxGuests: number;
  confirmed: boolean;
  confirmedAt?: Date;
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
  guestId: string;
  confirmed: boolean;
  companions: Array<{
    id?: string;
    name: string;
    confirmed: boolean;
  }>;
}

// Admin Types
export interface Admin {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestAccess {
  id: string;
  guestCode: string;
  ipAddress?: string;
  userAgent?: string;
  accessedAt: Date;
}
