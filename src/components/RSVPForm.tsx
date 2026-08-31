import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { useGuestContext } from "@/context/GuestContext";
import { useEventContext } from "@/context/EventContext";
import { Attendee, Guest } from "@/types";
import {
  RsvpAnswers,
  missingRequired,
  sanitizeQuestions,
} from "@/lib/rsvpQuestions";
import { Button } from "@/components/ui/button";

type AttendingState = true | false | null;

const RSVPForm = () => {
  const { guest, setGuest, code, eventSlug } = useGuestContext();
  const { event } = useEventContext();

  const labels = event?.config?.labels;
  const rsvpYesLabel      = labels?.rsvpYes       ?? "Sí, asistiré";
  const rsvpNoLabel       = labels?.rsvpNo        ?? "No podré asistir";
  const rsvpCompanionsLabel = labels?.rsvpCompanions ?? "¿Quiénes te acompañan?";
  const rsvpConfirmLabel  = labels?.rsvpConfirm   ?? "Confirmar";
  const rsvpConfirmedMsg  = labels?.rsvpConfirmedMsg ?? "¡Confirmación recibida!";
  const rsvpDeclinedMsg   = labels?.rsvpDeclinedMsg  ?? "Lamentamos que no puedas asistir.";
  const rsvpThankYou      = labels?.rsvpThankYou    ?? "Gracias por responder.";

  const alreadyConfirmed = guest?.confirmed === true;
  const alreadyDeclined  = guest?.confirmed === false && guest?.confirmedAt != null;

  // Local state
  const [attending, setAttending] = useState<AttendingState>(
    alreadyConfirmed ? true : alreadyDeclined ? false : null
  );
  const [companionMap, setCompanionMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    guest?.companions?.forEach(c => { map[c.id] = c.confirmed; });
    return map;
  });
  // Preguntas personalizadas del evento. Se siembran con lo ya respondido para
  // que "Modificar respuesta" no obligue a rellenarlo todo de nuevo.
  const questions = sanitizeQuestions(event?.config?.rsvpQuestions);
  // Las personas de la invitación. Cada una responde lo suyo (su menú, sus
  // alergias). Si el evento aún no tiene asistentes, se cae al invitado solo.
  const attendees: Attendee[] =
    guest?.attendees?.length
      ? guest.attendees
      : guest
        ? [{ id: guest.id, name: guest.name, isPrimary: true, confirmed: guest.confirmed }]
        : [];

  const [answersByAttendee, setAnswersByAttendee] = useState<Record<string, RsvpAnswers>>(() =>
    Object.fromEntries(attendees.map(a => [a.id, (a.rsvpAnswers ?? {}) as RsvpAnswers]))
  );
  const [missingByAttendee, setMissingByAttendee] = useState<Record<string, string[]>>({});

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyConfirmed || alreadyDeclined);
  const [error, setError] = useState<string | null>(null);

  const companions = guest?.companions ?? [];

  /** Personas que van a asistir según lo marcado ahora mismo. */
  const asistentesActivos = attendees.filter(a =>
    a.isPrimary ? attending === true : companionMap[a.companionId ?? ""] ?? false
  );

  const setAnswer = (attendeeId: string, questionId: string, value: RsvpAnswers[string]) =>
    setAnswersByAttendee(prev => ({
      ...prev,
      [attendeeId]: { ...(prev[attendeeId] ?? {}), [questionId]: value },
    }));

  const handleSubmit = async () => {
    if (attending === null || !code) return;

    // Solo se piden al asistir; al declinar el backend las limpia.
    if (attending && questions.length > 0) {
      const faltan: Record<string, string[]> = {};
      for (const a of asistentesActivos) {
        const suyas = missingRequired(questions, answersByAttendee[a.id] ?? {});
        if (suyas.length > 0) faltan[a.id] = suyas;
      }
      setMissingByAttendee(faltan);
      if (Object.keys(faltan).length > 0) {
        const nombres = asistentesActivos
          .filter(a => faltan[a.id])
          .map(a => a.name)
          .join(", ");
        setError(`Faltan respuestas obligatorias de: ${nombres}`);
        return;
      }
    }
    setMissingByAttendee({});
    setLoading(true);
    setError(null);
    try {
      const companionsPayload = companions.map(c => ({
        id: c.id,
        confirmed: attending ? (companionMap[c.id] ?? false) : false,
      }));

      const res = await fetch("/api/guests/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestCode: code,
          confirmed: attending,
          companions: companionsPayload,
          eventSlug,
          ...(attending
            ? {
                // El titular también viaja en `answers` por compatibilidad.
                answers: answersByAttendee[attendees.find(a => a.isPrimary)?.id ?? ""] ?? {},
                attendeeAnswers: Object.fromEntries(
                  asistentesActivos.map(a => [a.id, answersByAttendee[a.id] ?? {}])
                ),
              }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Error al confirmar");
      }
      const updated: Guest = await res.json();
      setGuest(updated);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        className="flex flex-col items-center gap-3 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
      >
        <div className="text-5xl">{attending ? "🎉" : "💌"}</div>
        <p className="text-xl font-serif font-semibold text-[var(--color-accent)]">
          {attending ? rsvpConfirmedMsg : rsvpDeclinedMsg}
        </p>
        <p className="text-base font-serif text-[var(--color-primary)]">{rsvpThankYou}</p>
        {attending && companions.length > 0 && (
          <div className="mt-2 text-sm font-serif text-[var(--color-text)] space-y-1">
            {companions.map(c => (
              <div key={c.id} className="flex items-center gap-2 justify-center">
                <span>{companionMap[c.id] ? "✓" : "✗"}</span>
                <span className={companionMap[c.id] ? "" : "line-through opacity-60"}>{c.name}</span>
              </div>
            ))}
          </div>
        )}
        <Button
          className="!bg-transparent !border !border-[var(--color-accent)] !text-[var(--color-accent)] !rounded-full !text-sm mt-2"
          onClick={() => setSubmitted(false)}
        >
          Modificar respuesta
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Attending selection */}
      <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:justify-center">
        <button
          onClick={() => setAttending(true)}
          className={`min-h-12 touch-manipulation px-5 py-2 rounded-full font-serif text-base border-2 transition-all ${
            attending === true
              ? "bg-[var(--color-action)] border-[var(--color-action)] text-white"
              : "bg-transparent border-[var(--color-accent)] text-[var(--color-accent)]"
          }`}
        >
          ✓ {rsvpYesLabel}
        </button>
        <button
          onClick={() => setAttending(false)}
          className={`min-h-12 touch-manipulation px-5 py-2 rounded-full font-serif text-base border-2 transition-all ${
            attending === false
              ? "bg-red-400 border-red-400 text-white"
              : "bg-transparent border-[var(--color-accent)] text-[var(--color-accent)]"
          }`}
        >
          ✗ {rsvpNoLabel}
        </button>
      </div>

      {/* Companions (only when attending === true and there are companions) */}
      <AnimatePresence>
        {attending === true && companions.length > 0 && (
          <motion.div
            className="flex flex-col gap-3 w-full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-sm font-serif text-[var(--color-primary)] text-center font-semibold">
              {rsvpCompanionsLabel}
            </p>
            {companions.map(c => (
              <label
                key={c.id}
                className="flex min-h-12 touch-manipulation items-center gap-3 cursor-pointer px-4 py-2 rounded-xl border border-[var(--color-accent)]/30 bg-white/30"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 shrink-0 accent-[var(--color-action)]"
                  checked={companionMap[c.id] ?? false}
                  onChange={e =>
                    setCompanionMap(prev => ({ ...prev, [c.id]: e.target.checked }))
                  }
                />
                <span className="font-serif text-[var(--color-primary)]">{c.name}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preguntas personalizadas: un bloque por persona que asiste */}
      <AnimatePresence>
        {attending === true && questions.length > 0 && asistentesActivos.length > 0 && (
          <motion.div
            className="flex flex-col gap-6 w-full"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
          >
            {asistentesActivos.map(persona => {
              const suyas = answersByAttendee[persona.id] ?? {};
              const faltanSuyas = missingByAttendee[persona.id] ?? [];
              return (
                <div key={persona.id} className="flex w-full flex-col gap-3">
                  {/* El nombre solo hace falta si hay más de una persona */}
                  {asistentesActivos.length > 1 && (
                    <p className="border-b border-[var(--color-accent)]/30 pb-1 font-serif text-base font-semibold text-[var(--color-accent)]">
                      {persona.name}
                    </p>
                  )}

                  {questions.map(q => {
                    const falta = faltanSuyas.includes(q.id);
                    const value = suyas[q.id];
                    return (
                      <div key={q.id} className="flex w-full flex-col gap-2">
                        <p className="font-serif text-sm font-semibold text-[var(--color-primary)]">
                          {q.label}
                          {q.required && <span className="text-[var(--color-accent)]"> *</span>}
                        </p>
                        {q.help && (
                          <p className="font-serif text-xs text-[var(--color-text)] opacity-70">{q.help}</p>
                        )}

                        {q.type === "text" ? (
                          <input
                            type="text"
                            value={typeof value === "string" ? value : ""}
                            onChange={e => setAnswer(persona.id, q.id, e.target.value)}
                            className={`min-h-12 w-full rounded-xl border bg-white/40 px-4 py-2 font-serif text-base text-[var(--color-primary)] ${
                              falta ? "border-red-400" : "border-[var(--color-accent)]/30"
                            }`}
                            placeholder="Tu respuesta"
                          />
                        ) : (
                          <div className="flex flex-col gap-2">
                            {q.options.map(opt => {
                              const checked =
                                q.type === "single"
                                  ? value === opt
                                  : Array.isArray(value) && value.includes(opt);
                              return (
                                <label
                                  key={opt}
                                  className={`flex min-h-12 touch-manipulation cursor-pointer items-center gap-3 rounded-xl border bg-white/30 px-4 py-2 ${
                                    falta ? "border-red-400" : "border-[var(--color-accent)]/30"
                                  }`}
                                >
                                  <input
                                    type={q.type === "single" ? "radio" : "checkbox"}
                                    name={`${persona.id}-${q.id}`}
                                    className="h-5 w-5 shrink-0 accent-[var(--color-action)]"
                                    checked={checked}
                                    onChange={() => {
                                      if (q.type === "single") {
                                        setAnswer(persona.id, q.id, opt);
                                        return;
                                      }
                                      const actuales = Array.isArray(value) ? value : [];
                                      setAnswer(
                                        persona.id,
                                        q.id,
                                        actuales.includes(opt)
                                          ? actuales.filter(o => o !== opt)
                                          : [...actuales, opt]
                                      );
                                    }}
                                  />
                                  <span className="font-serif text-[var(--color-primary)]">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm font-serif text-center">{error}</p>
      )}

      {/* Submit */}
      <Button
        className="!min-h-12 !w-full !bg-[var(--color-action)] !text-white !rounded-full !px-8 !py-2 !text-base disabled:!opacity-50 sm:!w-auto"
        onClick={handleSubmit}
        disabled={attending === null || loading}
      >
        {loading ? "Enviando..." : rsvpConfirmLabel}
      </Button>
    </div>
  );
};

export default RSVPForm;
