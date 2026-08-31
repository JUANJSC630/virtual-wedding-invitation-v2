/**
 * Rellena la tabla `Attendee` a partir de los datos existentes.
 *
 * Cada `Guest` (el hogar) produce un asistente titular con `isPrimary: true`, y
 * cada `Companion` produce el suyo. Es el cimiento de mesas, menú por persona y
 * check-in — ver INVESTIGACION_SISTEMA_COMPLETO_2026.md §1.
 *
 * Es IDEMPOTENTE: se puede correr las veces que haga falta. No crea duplicados
 * porque comprueba lo que ya existe por (guestId, isPrimary) y por nombre para
 * los acompañantes, y no borra nada.
 *
 * Se escribe en JS y no en TS a propósito: el loader `ts-node/esm` que usan los
 * demás scripts revienta bajo Node 20 (mismo fallo de loaders ESM que documenta
 * CLAUDE.md §1). Así se ejecuta con `node` a secas.
 *
 *   node scripts/backfill-attendees.js --dry   # solo informa, no escribe
 *   node scripts/backfill-attendees.js         # aplica
 */
import "dotenv/config";

import prisma from "../src/lib/prisma.js";

const dryRun = process.argv.includes("--dry");

async function main() {
  const guests = await prisma.guest.findMany({
    include: { companions: true, attendees: true },
    orderBy: { createdAt: "asc" },
  });

  let creadosTitulares = 0;
  let creadosAcompanantes = 0;
  let yaExistian = 0;

  for (const guest of guests) {
    // ── Titular ──────────────────────────────────────────────────────────
    const titular = guest.attendees.find(a => a.isPrimary);
    if (titular) {
      yaExistian++;
    } else {
      creadosTitulares++;
      if (!dryRun) {
        await prisma.attendee.create({
          data: {
            guestId: guest.id,
            name: guest.name,
            isPrimary: true,
            confirmed: guest.confirmed,
            confirmedAt: guest.confirmedAt,
            rsvpAnswers: guest.rsvpAnswers ?? undefined,
          },
        });
      }
    }

    // ── Acompañantes ─────────────────────────────────────────────────────
    for (const companion of guest.companions) {
      const existe = guest.attendees.some(a => a.companionId === companion.id)
        || guest.attendees.some(a => !a.isPrimary && !a.companionId && a.name === companion.name);
      if (existe) {
        yaExistian++;
        continue;
      }
      creadosAcompanantes++;
      if (!dryRun) {
        await prisma.attendee.create({
          data: {
            guestId: guest.id,
            name: companion.name,
            isPrimary: false,
            companionId: companion.id,
            confirmed: companion.confirmed,
            confirmedAt: companion.confirmedAt,
          },
        });
      }
    }
  }

  // Enlaza los asistentes creados antes de que existiera `companionId`.
  let enlazados = 0;
  for (const guest of guests) {
    for (const companion of guest.companions) {
      const huerfano = guest.attendees.find(
        a => !a.isPrimary && !a.companionId && a.name === companion.name
      );
      if (!huerfano) continue;
      enlazados++;
      if (!dryRun) {
        await prisma.attendee.update({
          where: { id: huerfano.id },
          data: { companionId: companion.id },
        });
        huerfano.companionId = companion.id; // evita reusarlo con un homónimo
      }
    }
  }

  const total = await prisma.attendee.count();
  console.log(dryRun ? "— SIMULACRO, no se escribió nada —" : "— aplicado —");
  console.log(`  hogares (Guest)      : ${guests.length}`);
  console.log(`  titulares creados    : ${creadosTitulares}`);
  console.log(`  acompañantes creados : ${creadosAcompanantes}`);
  console.log(`  ya existían          : ${yaExistian}`);
  console.log(`  enlazados a Companion: ${enlazados}`);
  console.log(`  total en attendees   : ${total}`);
}

main()
  .catch(e => {
    console.error("Error en el backfill:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
