import { BlockComponentProps, BlockType } from "./types";

import InvitationSection1 from "@/components/InvitationSection1";
import InvitationSection2 from "@/components/InvitationSection2";
import InvitationSection3 from "@/components/InvitationSection3";
import InvitationSection4 from "@/components/InvitationSection4";
import InvitationSection5 from "@/components/InvitationSection5";
import InvitationSection6 from "@/components/InvitationSection6";
import InvitationSection7 from "@/components/InvitationSection7";
import InvitationSection8 from "@/components/InvitationSection8";
import InvitationSection9 from "@/components/InvitationSection9";
import InvitationSectionGallery from "@/components/InvitationSectionGallery";
import DividerBlock from "./DividerBlock";
import MyTableBlock from "./MyTableBlock";
import FaqBlock from "./FaqBlock";
import TextBlock from "./TextBlock";

interface RegistryEntry {
  component: React.FC<BlockComponentProps>;
  label: string; // nombre visible en el panel
  icon: string;  // emoji para el panel
  canDuplicate: boolean; // si tiene sentido tener varios (texto/foto sí; rsvp no)
}

/**
 * Registro de bloques: type → componente + metadatos para el panel.
 * Los componentes de sección existentes no declaran props (leen EventContext);
 * son asignables a React.FC<BlockComponentProps> porque ignoran `config`.
 */
export const SECTION_REGISTRY: Record<BlockType, RegistryEntry> = {
  hero:         { component: InvitationSection1,       label: "Portada",          icon: "✨", canDuplicate: false },
  photoTorn:    { component: InvitationSection2,       label: "Foto (rasgada)",   icon: "🖼️", canDuplicate: true },
  names:        { component: InvitationSection3,       label: "Protagonistas",    icon: "💗", canDuplicate: false },
  photoFlowers: { component: InvitationSection4,       label: "Foto (flores)",    icon: "🌸", canDuplicate: true },
  gallery:      { component: InvitationSectionGallery, label: "Galería",          icon: "📸", canDuplicate: false },
  family:       { component: InvitationSection5,       label: "Familia + Cuenta regresiva", icon: "👪", canDuplicate: false },
  venues:       { component: InvitationSection6,       label: "Lugares",          icon: "📍", canDuplicate: false },
  photoHero:    { component: InvitationSection9,       label: "Foto principal",   icon: "🌟", canDuplicate: true },
  timeline:     { component: InvitationSection7,       label: "Itinerario",       icon: "🕒", canDuplicate: false },
  rsvp:         { component: InvitationSection8,       label: "Confirmación",     icon: "✅", canDuplicate: false },
  text:         { component: TextBlock,                label: "Texto libre",      icon: "📝", canDuplicate: true },
  faq:          { component: FaqBlock,                 label: "Preguntas frecuentes", icon: "❓", canDuplicate: true },
  divider:      { component: DividerBlock,             label: "Separador",        icon: "➖", canDuplicate: true },
  myTable:      { component: MyTableBlock,             label: "Tu mesa",          icon: "🍽️", canDuplicate: false },
};

/** Lista ordenada para el menú "Añadir bloque" del panel. */
export const BLOCK_MENU: { type: BlockType; label: string; icon: string }[] = (
  Object.keys(SECTION_REGISTRY) as BlockType[]
).map(type => ({ type, label: SECTION_REGISTRY[type].label, icon: SECTION_REGISTRY[type].icon }));
