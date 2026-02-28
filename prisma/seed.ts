/**
 * Seed de desarrollo — solo para entornos locales nuevos.
 * En producción usa scripts/migrate-to-multitenant.ts para migrar datos reales.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creando datos de prueba...\n");

  // ─── Master Admin ──────────────────────────────────────────────────────────
  const hashedMasterPw = await bcrypt.hash("admin123", 12);
  await prisma.admin.upsert({
    where: { email: "admin@plataforma.com" },
    update: {},
    create: { email: "admin@plataforma.com", password: hashedMasterPw, name: "Master Admin" },
  });
  console.log("👤 Master Admin: admin@plataforma.com / admin123");

  // ─── Evento de prueba ──────────────────────────────────────────────────────
  const event = await prisma.event.upsert({
    where: { slug: "jimena-juan" },
    update: {},
    create: {
      slug: "jimena-juan",
      groomName: "Juan",
      brideName: "Jimena",
      eventDate: new Date("2025-11-22T18:00:00"),
      rsvpDeadline: new Date("2025-10-15T12:00:00"),
      ceremonyTime: "6:00 PM",
      receptionTime: "7:30 PM",
      venueName: "Iglesia La Medalla Milagrosa",
      dressCode: "Formal",
      isActive: true,
    },
  });
  console.log(`🎊 Evento: ${event.slug} (id: ${event.id})`);

  // ─── Client Admin para el evento ──────────────────────────────────────────
  const hashedClientPw = await bcrypt.hash("boda2025", 12);
  await prisma.clientAdmin.upsert({
    where: { email: "jimena.juan@boda.com" },
    update: {},
    create: {
      eventId: event.id,
      email: "jimena.juan@boda.com",
      password: hashedClientPw,
      name: "Jimena & Juan",
    },
  });
  console.log("👥 Client Admin: jimena.juan@boda.com / boda2025");

  // ─── Invitados de prueba ───────────────────────────────────────────────────
  const guests = [
    { code: "AYP001", name: "Mercedes, Marc, Xavier, Claudia", maxGuests: 4 },
    { code: "AYP002", name: "Juan Pérez", maxGuests: 2 },
    { code: "AYP003", name: "María García, Carlos López", maxGuests: 3 },
    { code: "AYP004", name: "Ana Rodríguez", maxGuests: 1, confirmed: true, confirmedAt: new Date() },
    { code: "AYP005", name: "Pedro Martínez, Lucía Fernández", maxGuests: 5 },
  ];

  for (const g of guests) {
    const guest = await prisma.guest.upsert({
      where: { eventId_code: { eventId: event.id, code: g.code } },
      update: {},
      create: { eventId: event.id, ...g },
    });
    console.log(`   ✅ ${guest.code}: ${guest.name}`);
  }

  console.log("\n🎉 Seed completado.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
