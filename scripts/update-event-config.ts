/**
 * Actualiza el evento "jimena-juan" con la configuración completa
 * extraída de los componentes hardcodeados.
 *
 * Uso: pnpm update-event-config
 */
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const config = {
    verse: {
      text: "El que encontró una esposa encontró la felicidad; Yavé es quien le otorgó ese favor.",
      reference: "Proverbios 18:22",
    },
    ceremony: {
      name: "IGLESIA LA MEDALLA MILAGROSA",
      address: "Zarzal, Valle Del Cauca",
      mapsUrl: "https://maps.app.goo.gl/uEAii5TKKsR2SKAcA",
    },
    reception: {
      name: "FINCA VILLA MILENA",
      address: "Corregimiento Limones, Zarzal",
      mapsUrl: "https://maps.app.goo.gl/Seqbt4m5C6LuMTPB9",
    },
    parents: {
      bride: ["Maria Lucelly Zapata Bedoya", "Alvaro Libreros Caicedo"],
      groom: ["Leandra Susana Naranjo Monsalve", "John Jairo Ordoñes Corrales"],
    },
    godparents: ["Isabel Cristina Castro Pineda", "Marco Tulio Naranjo Monsalve"],
    bridesmaids: [
      "Claudia Reyes", "Yensi Mora", "Sofia Naranjo", "Manuela Naranjo",
      "Ana Garcia", "Laura Bedoya", "Alejandra Rivera",
    ],
    groomsmen: [
      "Stiwar Ordoñes", "Danny Ospina", "Cristian Naranjo", "Santiago Ordoñes",
      "Brayan Ordoñes", "Harold Naranjo", "Marlon Estupiñan",
    ],
    heroMessage:
      "Hay momentos en la vida que son especiales por si solos, pero compartirlos con las personas que queremos los hacen inolvidables.\n\nPor eso queremos invitarlos a celebrar nuestra boda y que hagan parte de este día tan especial para nosotros.",
    giftMessage:
      "El mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros, les dejamos esta opción:",
    dressCode: {
      label: "Elegante",
      ladies: "EVITAR COLORES BLANCOS Y AZUL MARINO.",
      gentlemen: "EVITAR COLORES BEIGE Y AZUL MARINO.",
    },
    groomWAMessage: process.env.VITE_GROOM_WHATSAPP_MESSAGE || "",
    brideWAMessage: process.env.VITE_BRIDE_WHATSAPP_MESSAGE || "",
  };

  const event = await prisma.event.update({
    where: { slug: "jimena-juan" },
    data: {
      groomName: "Jhon",
      brideName: "Jimena",
      eventDate: new Date("2025-11-22T18:00:00"),  // Fecha correcta (no Nov 15)
      rsvpDeadline: new Date("2025-10-20T12:00:00"),
      ceremonyTime: "6:00 PM",
      receptionTime: "8:00 PM",
      venueName: "Iglesia La Medalla Milagrosa",
      venueAddress: "Zarzal, Valle Del Cauca",
      dressCode: "Elegante",
      heroPhotoUrl: "/photos/IMG_2041.jpeg",
      audioUrl: "/cancion.mp3",
      groomPhone: process.env.VITE_GROOM_PHONE || null,
      bridePhone: process.env.VITE_BRIDE_PHONE || null,
      groomWAMessage: process.env.VITE_GROOM_WHATSAPP_MESSAGE || null,
      brideWAMessage: process.env.VITE_BRIDE_WHATSAPP_MESSAGE || null,
      config,
    },
  });

  console.log(`✅ Evento "${event.slug}" actualizado con config completa`);
  console.log(`   Fecha: ${event.eventDate.toLocaleDateString("es-CO")}`);
  console.log(`   Novio: ${event.groomName} | Novia: ${event.brideName}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
