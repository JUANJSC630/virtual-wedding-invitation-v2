/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROOM_PHONE: string;
  readonly VITE_BRIDE_PHONE: string;
  readonly VITE_WEDDING_DATE: string;
  readonly VITE_RSVP_DEADLINE: string;
  readonly VITE_GROOM_WHATSAPP_MESSAGE: string;
  readonly VITE_BRIDE_WHATSAPP_MESSAGE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
