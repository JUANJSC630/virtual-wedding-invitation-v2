/**
 * Saneado de las preguntas y respuestas del RSVP en el backend.
 *
 * La definición canónica de los tipos vive en `src/lib/rsvpQuestions.ts`, que
 * además tiene los tests. Aquí se replica la parte que el servidor necesita
 * porque corre en Node plano y no puede importar TypeScript — mismo motivo por
 * el que `buildConfig` sanea `layout` y `honorees` a mano.
 *
 * Si cambias las reglas, cambia los dos lados.
 */

const isChoice = (type) => type === "single" || type === "multi";

/** Sanea la definición de preguntas que llega del panel. */
export function sanitizeRsvpQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    const id = typeof item.id === "string" ? item.id.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!id || !label || seen.has(id)) continue;

    const type = item.type === "multi" || item.type === "text" ? item.type : "single";

    const options = isChoice(type)
      ? (Array.isArray(item.options) ? item.options : [])
          .filter(o => typeof o === "string")
          .map(o => o.trim())
          .filter(Boolean)
      : [];

    // Una pregunta de elección sin opciones no tendría nada que mostrar.
    if (isChoice(type) && options.length === 0) continue;

    seen.add(id);
    const q = { id, type, label, options, required: item.required === true };
    if (typeof item.help === "string" && item.help.trim()) q.help = item.help.trim();
    out.push(q);
  }
  return out;
}

/**
 * Normaliza las respuestas de un invitado contra las preguntas vigentes.
 * Descarta respuestas de preguntas ya eliminadas y opciones inventadas: el
 * cuerpo de la petición es público (viene del formulario del invitado).
 */
export function normalizeRsvpAnswers(questions, raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = {};

  for (const q of questions) {
    const value = source[q.id];

    if (q.type === "text") {
      const text = typeof value === "string" ? value.trim() : "";
      if (text) out[q.id] = text;
      continue;
    }

    if (q.type === "single") {
      const choice = typeof value === "string" ? value.trim() : "";
      if (q.options.includes(choice)) out[q.id] = choice;
      continue;
    }

    const list = [
      ...new Set(
        (Array.isArray(value) ? value : [])
          .filter(v => typeof v === "string")
          .map(v => v.trim())
          .filter(v => q.options.includes(v))
      ),
    ];
    if (list.length > 0) out[q.id] = list;
  }
  return out;
}

/** Ids de las preguntas obligatorias que quedaron sin responder. */
export function missingRequiredRsvp(questions, answers) {
  return questions
    .filter(q => q.required)
    .filter(q => {
      const a = answers[q.id];
      if (a === undefined) return true;
      return Array.isArray(a) ? a.length === 0 : String(a).trim() === "";
    })
    .map(q => q.id);
}
