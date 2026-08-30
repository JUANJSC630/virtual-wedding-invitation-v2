import prisma from "../../src/lib/prisma.js";

/**
 * Importa filas de un CSV de invitados a un evento.
 *
 * Lógica compartida por `POST /api/admin/guests/import` (panel cliente) y
 * `POST /api/master/events/:id/import-guests` (panel master), que antes tenían
 * el mismo bucle duplicado línea por línea.
 *
 * Hace 2 consultas en total en vez de 2 por fila: antes, un CSV de 200
 * invitados provocaba 400 viajes secuenciales a Neon.
 *
 * Semántica (idéntica a la del bucle original):
 * - fila sin código o sin nombre → entra en `errors`, no cuenta como omitida
 * - código repetido dentro del propio CSV → `skipped`
 * - código que ya existe en el evento → `skipped`
 * - `maxGuests` no numérico → 1
 * - códigos normalizados a mayúsculas
 */
export async function importGuestRows(eventId, rows) {
  const errors = [];
  const parsed = [];
  const seen = new Set();
  let skipped = 0;

  for (const row of rows) {
    const code = (row.code || "").trim().toUpperCase();
    const name = (row.name || "").trim();
    if (!code || !name) {
      errors.push({ code: code || "?", reason: "código y nombre son obligatorios" });
      continue;
    }
    // Repetido dentro del propio archivo: se omite, igual que si ya existiera.
    if (seen.has(code)) {
      skipped++;
      continue;
    }
    seen.add(code);
    parsed.push({
      eventId,
      code,
      name,
      email: row.email?.trim() || undefined,
      phone: row.phone?.trim() || undefined,
      maxGuests: parseInt(row.maxGuests, 10) || 1,
    });
  }

  if (parsed.length === 0) return { created: 0, skipped, errors };

  // 1 consulta para todos los códigos ya existentes (antes: 1 findUnique/fila).
  const existing = await prisma.guest.findMany({
    where: { eventId, code: { in: parsed.map(g => g.code) } },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map(g => g.code));

  const toCreate = parsed.filter(g => !existingCodes.has(g.code));
  skipped += parsed.length - toCreate.length;

  if (toCreate.length === 0) return { created: 0, skipped, errors };

  // 1 INSERT para todas las filas (antes: 1 create/fila). skipDuplicates cubre
  // la carrera entre la comprobación de arriba y esta escritura.
  const { count } = await prisma.guest.createMany({ data: toCreate, skipDuplicates: true });
  skipped += toCreate.length - count;

  return { created: count, skipped, errors };
}
