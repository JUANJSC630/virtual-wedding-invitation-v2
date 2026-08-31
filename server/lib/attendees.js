import prisma from "../../src/lib/prisma.js";

/**
 * Espejo de `Attendee` durante la transición.
 *
 * `Guest` es el hogar y `Companion` sigue siendo lo que la app lee hoy; estas
 * funciones mantienen la tabla de personas al día para que no derive mientras
 * se completa el cambio. Cuando las lecturas pasen a `Attendee`, este módulo se
 * reduce a las escrituras directas y `Companion` desaparece.
 *
 * Son "best effort" a propósito: un fallo del espejo se registra pero no tumba
 * la operación principal — hay un evento en producción recibiendo RSVPs, y es
 * peor romper una confirmación que tener un asistente desfasado.
 * `scripts/backfill-attendees.js` es idempotente y repara cualquier desfase.
 */

async function safely(label, fn) {
  try {
    await fn();
  } catch (error) {
    console.error(`No se pudo sincronizar el asistente (${label}):`, error);
  }
}

/** Crea o actualiza al asistente titular a partir de su Guest. */
export async function syncPrimaryAttendee(guest) {
  if (!guest?.id) return;
  await safely(`guest ${guest.id}`, async () => {
    const existing = await prisma.attendee.findFirst({
      where: { guestId: guest.id, isPrimary: true },
    });
    const data = {
      name: guest.name,
      confirmed: guest.confirmed ?? false,
      confirmedAt: guest.confirmedAt ?? null,
      rsvpAnswers: guest.rsvpAnswers ?? null,
    };
    if (existing) {
      await prisma.attendee.update({ where: { id: existing.id }, data });
    } else {
      await prisma.attendee.create({ data: { ...data, guestId: guest.id, isPrimary: true } });
    }
  });
}

/** Espeja un acompañante en su asistente, enlazado por `companionId`. */
export async function syncCompanionAttendee(guestId, companion) {
  if (!guestId || !companion?.id) return;
  await safely(`companion ${companion.id}`, async () => {
    const existing = await prisma.attendee.findFirst({ where: { companionId: companion.id } });
    const data = {
      name: companion.name,
      confirmed: companion.confirmed ?? false,
      confirmedAt: companion.confirmedAt ?? null,
    };
    if (existing) {
      await prisma.attendee.update({ where: { id: existing.id }, data });
    } else {
      await prisma.attendee.create({
        data: { ...data, guestId, isPrimary: false, companionId: companion.id },
      });
    }
  });
}

/** Retira al asistente de un acompañante eliminado. */
export async function deleteCompanionAttendee(companionId) {
  if (!companionId) return;
  await safely(`borrado de companion ${companionId}`, () =>
    prisma.attendee.deleteMany({ where: { companionId } })
  );
}

/** Espeja de golpe a todos los acompañantes de un invitado. */
export async function syncAllCompanionAttendees(guestId, companions = []) {
  for (const companion of companions) {
    await syncCompanionAttendee(guestId, companion);
  }
}
