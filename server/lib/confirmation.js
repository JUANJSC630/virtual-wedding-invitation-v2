/**
 * Campos de confirmación para un update de invitado o acompañante.
 *
 * Devuelve `{}` cuando el body no trae `confirmed`, de modo que un PATCH parcial
 * —renombrar a un invitado, cambiarle el teléfono— no toque `confirmedAt`.
 *
 * Antes se escribía `confirmedAt: confirmed ? new Date() : null` siempre: como
 * Prisma ignora `confirmed: undefined` pero sí aplica `confirmedAt: null`, un
 * invitado confirmado conservaba `confirmed: true` pero perdía la fecha. Eso
 * corrompía la analítica y el listado de últimas confirmaciones, que filtra por
 * `confirmedAt: { not: null }`.
 */
export function confirmationFields(confirmed) {
  if (confirmed === undefined) return {};
  return { confirmed, confirmedAt: confirmed ? new Date() : null };
}
