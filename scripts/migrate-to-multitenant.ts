/**
 * Script de migración de datos: de schema single-tenant a multi-tenant.
 *
 * Qué hace:
 *  1. Crea el Event "jimena-juan" con los datos de la boda actual
 *  2. Crea un ClientAdmin para ese evento (opcional, via env vars)
 *  3. Actualiza todos los Guest existentes con ese eventId
 *  4. Actualiza todos los GuestAccess existentes con ese eventId
 *
 * Uso: pnpm migrate-to-multitenant
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando migración a schema multi-tenant...\n");

  // ─── 1. Crear el evento principal (Jimena & Juan) ──────────────────────────
  const eventSlug = "jimena-juan";

  let event = await prisma.event.findUnique({ where: { slug: eventSlug } });

  if (event) {
    console.log(`ℹ️  El evento "${eventSlug}" ya existe (id: ${event.id})`);
  } else {
    event = await prisma.event.create({
      data: {
        slug: eventSlug,
        groomName: "Juan",
        brideName: "Jimena",
        eventDate: new Date(process.env.VITE_WEDDING_DATE || "2025-11-22T18:00:00"),
        rsvpDeadline: process.env.VITE_RSVP_DEADLINE
          ? new Date(process.env.VITE_RSVP_DEADLINE)
          : null,
        ceremonyTime: "6:00 PM",
        receptionTime: "7:30 PM",
        venueName: "Iglesia La Medalla Milagrosa",
        dressCode: "Formal",
        groomPhone: process.env.VITE_GROOM_PHONE || null,
        bridePhone: process.env.VITE_BRIDE_PHONE || null,
        isActive: true,
        config: {},
      },
    });
    console.log(`✅ Evento creado: "${event.slug}" (id: ${event.id})`);
  }

  // ─── 2. Crear ClientAdmin para este evento (opcional) ─────────────────────
  const clientEmail = process.env.CLIENT_ADMIN_EMAIL;
  const clientPassword = process.env.CLIENT_ADMIN_PASSWORD;
  const clientName = process.env.CLIENT_ADMIN_NAME || "Jimena & Juan";

  if (clientEmail && clientPassword) {
    const existing = await prisma.clientAdmin.findUnique({ where: { email: clientEmail } });

    if (existing) {
      console.log(`ℹ️  ClientAdmin "${clientEmail}" ya existe`);
    } else {
      const hashed = await bcrypt.hash(clientPassword, 12);
      await prisma.clientAdmin.create({
        data: { eventId: event.id, email: clientEmail, password: hashed, name: clientName },
      });
      console.log(`✅ ClientAdmin creado: ${clientName} (${clientEmail})`);
    }
  } else {
    console.log("⚠️  CLIENT_ADMIN_EMAIL / CLIENT_ADMIN_PASSWORD no definidos — omitiendo ClientAdmin");
  }

  // ─── 3. Actualizar guests sin eventId ─────────────────────────────────────
  const guestsWithoutEvent = await prisma.guest.count({ where: { eventId: null } });

  if (guestsWithoutEvent === 0) {
    console.log("ℹ️  Todos los guests ya tienen eventId");
  } else {
    const { count } = await prisma.guest.updateMany({
      where: { eventId: null },
      data: { eventId: event.id },
    });
    console.log(`✅ Guests actualizados con eventId: ${count}`);
  }

  // ─── 4. Actualizar GuestAccess sin eventId ────────────────────────────────
  const accessesWithoutEvent = await prisma.guestAccess.count({ where: { eventId: null } });

  if (accessesWithoutEvent === 0) {
    console.log("ℹ️  Todos los accesos ya tienen eventId");
  } else {
    const { count } = await prisma.guestAccess.updateMany({
      where: { eventId: null },
      data: { eventId: event.id },
    });
    console.log(`✅ GuestAccess actualizados con eventId: ${count}`);
  }

  // ─── Resumen ──────────────────────────────────────────────────────────────
  const totalGuests = await prisma.guest.count({ where: { eventId: event.id } });
  const totalAccesses = await prisma.guestAccess.count({ where: { eventId: event.id } });

  console.log("\n📊 Resumen:");
  console.log(`   Evento:   ${event.slug}`);
  console.log(`   Guests:   ${totalGuests}`);
  console.log(`   Accesos:  ${totalAccesses}`);
  console.log("\n🎉 Migración completada.");
  console.log("   Siguiente paso: actualizar el schema para hacer eventId requerido.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
