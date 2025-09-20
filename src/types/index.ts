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
