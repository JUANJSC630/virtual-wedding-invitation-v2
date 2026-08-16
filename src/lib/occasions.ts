import { EventTypeSlug } from "@/types";

/**
 * Fase C.6 — Defaults de textos por ocasión.
 *
 * Cuando un evento no define un texto en `config`, se usa el default de su
 * `eventType` en lugar del wording de boda hardcodeado. Un admin siempre puede
 * sobrescribir cualquiera desde el panel.
 *
 * IMPORTANTE: los valores de `wedding` son EXACTAMENTE los que estaban
 * hardcodeados en las secciones → una boda se ve idéntica.
 */
export interface OccasionDefaults {
  announcementText: string; // Sección 1 — anuncio grande
  shareTitle: string;       // Sección 8 — sufijo al compartir la invitación
  verse: { text: string; reference: string }; // Sección 1 — cita (vacío ⇒ se oculta)
  heroMessage: string;      // Sección 3 — mensaje de bienvenida
  confirmedMessage: string; // GuestInfo — mensaje al confirmar
  family: {
    title: string;           // familyTitle
    companionTitle: string;  // companionTitle
    parentsPrimary: string;  // etiqueta de la 1ª columna de padres
    parentsSecondary: string;// etiqueta de la 2ª columna de padres ("" ⇒ oculta)
    godparents: string;
    attendants1: string;     // damas / corte
    attendants2: string;     // caballeros / chambelanes
  };
}

const WEDDING: OccasionDefaults = {
  announcementText: "¡NOS CASAMOS!",
  shareTitle: " — Te invitamos a nuestra boda",
  verse: {
    text: "El que encontró una esposa encontró la felicidad; Yavé es quien le otorgó ese favor.",
    reference: "Proverbios 18:22",
  },
  heroMessage:
    "Hay momentos en la vida que son especiales por si solos, pero compartirlos con las personas que queremos los hacen inolvidables.\n\nPor eso queremos invitarlos a celebrar nuestra boda y que hagan parte de este día tan especial para nosotros.",
  confirmedMessage: "¡Gracias por confirmar tu asistencia!\nTe esperamos en nuestra boda.",
  family: {
    title: "Con la bendición de Dios y de nuestros padres",
    companionTitle: "Y en compañía de nuestros padrinos, damas y caballeros de honor",
    parentsPrimary: "Padres de la novia",
    parentsSecondary: "Padres del novio",
    godparents: "Padrinos",
    attendants1: "Damas de honor",
    attendants2: "Caballeros de honor",
  },
};

const OCCASION_DEFAULTS: Record<EventTypeSlug, OccasionDefaults> = {
  wedding: WEDDING,

  quinceanera: {
    announcementText: "¡MIS XV AÑOS!",
    shareTitle: " — Te invito a mis XV años",
    verse: {
      text: "Este es el día que hizo el Señor; regocijémonos y alegrémonos en él.",
      reference: "Salmos 118:24",
    },
    heroMessage:
      "Hoy celebro una etapa muy especial de mi vida y quiero compartirla con las personas que más quiero.\n\nMe encantaría contar con tu presencia en mis XV años.",
    confirmedMessage: "¡Gracias por confirmar tu asistencia!\nTe espero en mis XV años.",
    family: {
      title: "Con la bendición de Dios y de mis padres",
      companionTitle: "Y en compañía de mis padrinos y mi corte de honor",
      parentsPrimary: "Mis padres",
      parentsSecondary: "",
      godparents: "Padrinos",
      attendants1: "Damas",
      attendants2: "Chambelanes",
    },
  },

  baptism: {
    announcementText: "¡ME BAUTIZO!",
    shareTitle: " — Te invitamos a mi bautizo",
    verse: {
      text: "Dejen que los niños vengan a mí, porque de ellos es el reino de los cielos.",
      reference: "Mateo 19:14",
    },
    heroMessage:
      "Con inmensa alegría celebramos el bautizo de nuestro pequeño y queremos compartir este día tan especial contigo.",
    confirmedMessage: "¡Gracias por confirmar tu asistencia!\nTe esperamos en la celebración.",
    family: {
      title: "Con la bendición de Dios",
      companionTitle: "Y en compañía de nuestros padrinos",
      parentsPrimary: "Padres",
      parentsSecondary: "",
      godparents: "Padrinos",
      attendants1: "",
      attendants2: "",
    },
  },

  communion: {
    announcementText: "¡MI PRIMERA COMUNIÓN!",
    shareTitle: " — Te invitamos a mi Primera Comunión",
    verse: {
      text: "Yo soy el pan de vida; el que viene a mí nunca tendrá hambre.",
      reference: "Juan 6:35",
    },
    heroMessage:
      "Con gran alegría celebro mi Primera Comunión y quiero compartir este día tan importante junto a ti.",
    confirmedMessage: "¡Gracias por confirmar tu asistencia!\nTe esperamos en la celebración.",
    family: {
      title: "Con la bendición de Dios y de mis padres",
      companionTitle: "Y en compañía de mis padrinos",
      parentsPrimary: "Padres",
      parentsSecondary: "",
      godparents: "Padrinos",
      attendants1: "",
      attendants2: "",
    },
  },

  birthday: {
    announcementText: "¡ESTOY DE CUMPLEAÑOS!",
    shareTitle: " — Te invito a mi cumpleaños",
    verse: { text: "", reference: "" },
    heroMessage:
      "Quiero celebrar un año más de vida rodeado de las personas que quiero. ¡Me encantaría que me acompañes!",
    confirmedMessage: "¡Gracias por confirmar tu asistencia!\nNos vemos en la fiesta.",
    family: {
      title: "Junto a mi familia",
      companionTitle: "",
      parentsPrimary: "",
      parentsSecondary: "",
      godparents: "",
      attendants1: "",
      attendants2: "",
    },
  },

  corporate: {
    announcementText: "TE INVITAMOS",
    shareTitle: " — Te invitamos a nuestro evento",
    verse: { text: "", reference: "" },
    heroMessage:
      "Nos complace invitarte a nuestro evento. Será un gusto contar con tu presencia.",
    confirmedMessage: "¡Gracias por confirmar tu asistencia!\nTe esperamos.",
    family: {
      title: "",
      companionTitle: "",
      parentsPrimary: "",
      parentsSecondary: "",
      godparents: "",
      attendants1: "",
      attendants2: "",
    },
  },

  other: {
    announcementText: "TE INVITAMOS",
    shareTitle: " — Te invitamos",
    verse: { text: "", reference: "" },
    heroMessage:
      "Nos encantaría contar con tu presencia en este día tan especial.",
    confirmedMessage: "¡Gracias por confirmar tu asistencia!\nTe esperamos.",
    family: {
      title: "",
      companionTitle: "",
      parentsPrimary: "",
      parentsSecondary: "",
      godparents: "",
      attendants1: "",
      attendants2: "",
    },
  },
};

/** Defaults de textos de una ocasión (cae a "other" si el tipo es desconocido). */
export function getOccasionDefaults(type: EventTypeSlug): OccasionDefaults {
  return OCCASION_DEFAULTS[type] ?? OCCASION_DEFAULTS.other;
}
