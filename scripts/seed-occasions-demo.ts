/**
 * Fase C.7 — Seed demo de multi-ocasión (opt-in).
 *
 * Crea un evento de ejemplo por ocasión (XV, bautizo, cumpleaños) para QA del
 * sistema multi-ocasión. Idempotente (upsert por slug). NO se ejecuta solo.
 *
 * Uso:  pnpm seed:occasions
 *
 * Los datos multi-ocasión (eventType, honorees) viven en `config`, sin migración.
 * groomName/brideName se rellenan con el nombre del protagonista (columnas
 * requeridas), igual que hace el panel para eventos no-boda.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DemoOccasion {
  slug: string;
  eventType: string;
  honorees: { role: string; label: string; name: string }[];
  eventDate: string;
  venueName: string;
  adminEmail: string;
  adminName: string;
}

const DEMOS: DemoOccasion[] = [
  {
    slug: "laura-xv",
    eventType: "quinceanera",
    honorees: [{ role: "celebrant", label: "Quinceañera", name: "Laura Sofía" }],
    eventDate: "2026-03-14T19:00:00",
    venueName: "Salón Los Jardines",
    adminEmail: "laura.xv@demo.com",
    adminName: "Laura Sofía",
  },
  {
    slug: "mateo-bautizo",
    eventType: "baptism",
    honorees: [{ role: "baby", label: "Bautizado/a", name: "Mateo" }],
    eventDate: "2026-05-10T11:00:00",
    venueName: "Parroquia San José",
    adminEmail: "mateo.bautizo@demo.com",
    adminName: "Familia de Mateo",
  },
  {
    slug: "ana-cumple",
    eventType: "birthday",
    honorees: [{ role: "celebrant", label: "Cumpleañero/a", name: "Ana" }],
    eventDate: "2026-04-20T20:00:00",
    venueName: "Terraza Mirador",
    adminEmail: "ana.cumple@demo.com",
    adminName: "Ana",
  },
];

async function main() {
  console.log("🌱 Seed demo multi-ocasión...\n");

  for (const d of DEMOS) {
    const filler = d.honorees[0]?.name ?? d.slug;
    const event = await prisma.event.upsert({
      where: { slug: d.slug },
      update: {
        config: { eventType: d.eventType, honorees: d.honorees },
      },
      create: {
        slug: d.slug,
        groomName: filler,
        brideName: filler,
        eventDate: new Date(d.eventDate),
        venueName: d.venueName,
        isActive: true,
        config: { eventType: d.eventType, honorees: d.honorees },
      },
    });

    const hashedPw = await bcrypt.hash("demo1234", 12);
    await prisma.clientAdmin.upsert({
      where: { email: d.adminEmail },
      update: {},
      create: {
        eventId: event.id,
        email: d.adminEmail,
        password: hashedPw,
        name: d.adminName,
      },
    });

    console.log(`🎊 ${d.eventType.padEnd(12)} /${d.slug}  ·  admin: ${d.adminEmail} / demo1234`);
  }

  console.log("\n✅ Listo. Abre /laura-xv, /mateo-bautizo, /ana-cumple para QA.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
