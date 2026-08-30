/**
 * Preguntas personalizadas del RSVP.
 *
 * Las define el organizador por evento y viven en `config.rsvpQuestions`, sin
 * columnas nuevas — mismo patrón que el layout (Fase B) y los honorees (Fase C).
 * Las respuestas de cada invitado van en `Guest.rsvpAnswers` (Json).
 *
 * Tipos soportados y por qué solo estos tres:
 * - `single`: elegir una. Cubre menú y transporte, y permite contar platos para
 *   el catering. Un tipo "sí/no" aparte sería esto mismo con dos opciones.
 * - `text`:   respuesta abierta. Cubre alergias, canción, accesibilidad y notas
 *             — 4 de los 6 campos con demanda probada del catálogo.
 * - `multi`:  varias a la vez. El catálogo pide las restricciones dietéticas
 *             como "texto o checkboxes".
 */

export type RsvpQuestionType = "single" | "multi" | "text";

export interface RsvpQuestion {
  id: string;
  type: RsvpQuestionType;
  label: string;
  /** Opciones para `single`/`multi`. Vacío en `text`. */
  options: string[];
  required: boolean;
  /** Aclaración opcional bajo la pregunta. */
  help?: string;
}

/** Respuesta de un invitado: texto para `text`, opción para `single`, lista para `multi`. */
export type RsvpAnswer = string | string[];
export type RsvpAnswers = Record<string, RsvpAnswer>;

export const RSVP_QUESTION_TYPES: { value: RsvpQuestionType; label: string; hint: string }[] = [
  { value: "single", label: "Elección única", hint: "El invitado elige una opción (menú, transporte…)" },
  { value: "multi",  label: "Elección múltiple", hint: "Puede marcar varias (restricciones alimentarias…)" },
  { value: "text",   label: "Texto libre", hint: "Respuesta abierta (alergias, canción, notas…)" },
];

const isChoice = (type: RsvpQuestionType): boolean => type === "single" || type === "multi";

/**
 * Sanea la definición de preguntas venida de la config (que es Json libre).
 * Descarta lo que no tenga id y etiqueta, y las de elección que se queden sin
 * opciones — no tendrían nada que mostrar.
 */
export function sanitizeQuestions(raw: unknown): RsvpQuestion[] {
  if (!Array.isArray(raw)) return [];
  const out: RsvpQuestion[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;

    const id = typeof q.id === "string" ? q.id.trim() : "";
    const label = typeof q.label === "string" ? q.label.trim() : "";
    if (!id || !label || seen.has(id)) continue;

    const type: RsvpQuestionType =
      q.type === "multi" || q.type === "text" ? q.type : "single";

    const options = isChoice(type)
      ? (Array.isArray(q.options) ? q.options : [])
          .filter((o): o is string => typeof o === "string")
          .map(o => o.trim())
          .filter(Boolean)
      : [];

    if (isChoice(type) && options.length === 0) continue;

    seen.add(id);
    out.push({
      id,
      type,
      label,
      options,
      required: q.required === true,
      ...(typeof q.help === "string" && q.help.trim() ? { help: q.help.trim() } : {}),
    });
  }
  return out;
}

/**
 * Normaliza la respuesta cruda de un invitado al tipo de su pregunta y descarta
 * las opciones que no existen (nadie debería poder inventarse una).
 * Devuelve `null` si no queda respuesta utilizable.
 */
export function normalizeAnswer(question: RsvpQuestion, raw: unknown): RsvpAnswer | null {
  if (question.type === "text") {
    const value = typeof raw === "string" ? raw.trim() : "";
    return value ? value : null;
  }

  if (question.type === "single") {
    const value = typeof raw === "string" ? raw.trim() : "";
    return question.options.includes(value) ? value : null;
  }

  const list = (Array.isArray(raw) ? raw : [])
    .filter((v): v is string => typeof v === "string")
    .map(v => v.trim())
    .filter(v => question.options.includes(v));
  const unique = [...new Set(list)];
  return unique.length > 0 ? unique : null;
}

/** Filtra las respuestas a solo las preguntas existentes, ya normalizadas. */
export function normalizeAnswers(questions: RsvpQuestion[], raw: unknown): RsvpAnswers {
  const source = (raw && typeof raw === "object" && !Array.isArray(raw))
    ? (raw as Record<string, unknown>)
    : {};
  const out: RsvpAnswers = {};
  for (const q of questions) {
    const value = normalizeAnswer(q, source[q.id]);
    if (value !== null) out[q.id] = value;
  }
  return out;
}

/** Ids de las preguntas obligatorias que quedaron sin responder. */
export function missingRequired(questions: RsvpQuestion[], answers: RsvpAnswers): string[] {
  return questions
    .filter(q => q.required)
    .filter(q => {
      const a = answers[q.id];
      if (a === undefined) return true;
      return Array.isArray(a) ? a.length === 0 : a.trim() === "";
    })
    .map(q => q.id);
}

/**
 * Agrega las respuestas de una pregunta de elección en conteos por opción.
 * Es lo que permite decirle al catering cuántos platos de cada tipo salen.
 */
export function tallyAnswers(question: RsvpQuestion, all: RsvpAnswers[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(question.options.map(o => [o, 0]));
  if (!isChoice(question.type)) return counts;

  for (const answers of all) {
    const a = answers?.[question.id];
    if (a === undefined) continue;
    for (const value of Array.isArray(a) ? a : [a]) {
      if (value in counts) counts[value] = (counts[value] ?? 0) + 1;
    }
  }
  return counts;
}
