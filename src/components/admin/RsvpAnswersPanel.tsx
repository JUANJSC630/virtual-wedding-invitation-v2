import { useState } from "react";

import { ChevronDown, ChevronRight } from "lucide-react";

import { Guest } from "@/types";

import { RsvpAnswers, RsvpQuestion, tallyAnswers } from "@/lib/rsvpQuestions";

interface Props {
  guests: Guest[];
  /**
   * Preguntas del evento. Se pasan explícitamente porque los paneles de
   * administración no están envueltos en EventContext — ese contexto solo
   * existe en la invitación pública.
   */
  questions: RsvpQuestion[];
}

/**
 * Resumen de las respuestas al RSVP.
 *
 * Para las preguntas de elección muestra el conteo por opción — es lo que el
 * organizador le pasa al catering. Para las abiertas, la lista de respuestas
 * con el nombre de quien la escribió.
 */
export const RsvpAnswersPanel: React.FC<Props> = ({ guests, questions }) => {
  const [open, setOpen] = useState(true);

  if (questions.length === 0) return null;

  const answered = guests.filter(g => g.rsvpAnswers && Object.keys(g.rsvpAnswers).length > 0);
  const allAnswers = answered.map(g => g.rsvpAnswers as RsvpAnswers);

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex min-h-12 w-full touch-manipulation items-center gap-2 px-4 py-3 text-left"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="min-w-0 flex-1">
          <span className="block font-medium">Respuestas del RSVP</span>
          <span className="block text-sm text-muted-foreground">
            {answered.length} de {guests.length} invitados respondieron
          </span>
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-4 border-t p-4 sm:grid-cols-2">
          {questions.map(q => {
            if (q.type === "text") {
              const respuestas = answered
                .map(g => ({ name: g.name, value: (g.rsvpAnswers as RsvpAnswers)[q.id] }))
                .filter(r => typeof r.value === "string" && r.value);
              return (
                <div key={q.id} className="space-y-1">
                  <p className="text-sm font-medium">{q.label}</p>
                  {respuestas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin respuestas todavía.</p>
                  ) : (
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                      {respuestas.map(r => (
                        <li key={r.name} className="text-muted-foreground">
                          <span className="text-foreground">{r.value as string}</span>
                          <span className="opacity-60"> — {r.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            const counts = tallyAnswers(q, allAnswers);
            const total = Object.values(counts).reduce((a, b) => a + b, 0);
            return (
              <div key={q.id} className="space-y-1">
                <p className="text-sm font-medium">{q.label}</p>
                <ul className="space-y-1 text-sm">
                  {q.options.map(opt => {
                    const n = counts[opt] ?? 0;
                    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                    return (
                      <li key={opt} className="flex items-center gap-2">
                        <span className="w-8 text-right font-medium tabular-nums">{n}</span>
                        <span className="flex-1 truncate text-muted-foreground">{opt}</span>
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
