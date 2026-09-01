/**
 * Fase B — Secciones dinámicas.
 *
 * Una invitación es un array ordenado de instancias de bloque (`BlockInstance[]`)
 * guardado en `event.config.layout`. El orden del array = orden en pantalla.
 * Ver ARQUITECTURA_SECCIONES_DINAMICAS.md.
 */

export type BlockType =
  | "hero"         // portada: frase/versículo + iniciales + anuncio
  | "photoTorn"    // foto con papel rasgado (ex-S2)
  | "names"        // nombres + mensaje + música (ex-S3)
  | "photoFlowers" // foto con flores (ex-S4)
  | "gallery"      // galería de fotos
  | "family"       // familia / padrinos + cuenta regresiva (ex-S5)
  | "venues"       // ceremonia/recepción + dress code (ex-S6)
  | "photoHero"    // foto principal (ex-S9)
  | "timeline"     // itinerario (ex-S7)
  | "rsvp"         // confirmación + regalos + contacto (ex-S8)
  | "text"         // NUEVO: bloque de texto libre
  | "faq"          // NUEVO: preguntas frecuentes
  | "divider"      // NUEVO: separador decorativo
  | "myTable";     // NUEVO: dónde se sienta el invitado

export interface BlockInstance {
  id: string;
  type: BlockType;
  enabled: boolean;
  config?: Record<string, unknown>;
}

/** Todos los componentes de bloque aceptan (y opcionalmente usan) su config. */
export interface BlockComponentProps {
  config?: Record<string, unknown>;
}
