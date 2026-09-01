import { useState } from "react";

import { ChevronDown, ChevronRight, Download } from "lucide-react";

import { Guest } from "@/types";

import { downloadCsv } from "@/lib/csv";
import { RsvpAnswers, RsvpQuestion, tallyAnswers } from "@/lib/rsvpQuestions";

import { Button } from "@/components/ui/button";

interface Props {
  guests: Guest[];
  /** Mesas del evento, para poder desglosar por mesa. Ausente en el panel cliente. */
  tables?: { id: string; name: string }[];
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
export const RsvpAnswersPanel: React.FC<Props> = ({ guests, questions, tables = [] }) => {
  const [open, setOpen] = useState(true);

  if (questions.length === 0) return null;

  /**
   * Se cuenta por PERSONA, no por invitación: en una boda cada comensal elige su
   * plato. Si un evento antiguo aún no tiene asistentes, se cae al invitado.
   */
  const personas = guests.flatMap(g =>
    g.attendees?.length
      ? g.attendees.map(a => ({ name: a.name, answers: a.rsvpAnswers, tableId: a.tableId ?? null }))
      : [{ name: g.name, answers: g.rsvpAnswers, tableId: null }]
  );
  const answered = personas.filter(p => p.answers && Object.keys(p.answers).length > 0);
  const allAnswers = answered.map(p => p.answers as RsvpAnswers);

  /** Resumen agregado: lo que se le manda al catering, no la lista completa. */
  const exportSummary = () => {
    const rows: unknown[][] = [["Pregunta", "Respuesta", "Cantidad"]];
    for (const q of questions) {
      if (q.type === "text") {
        for (const p of answered) {
          const value = (p.answers as RsvpAnswers)[q.id];
          if (typeof value === "string" && value) rows.push([q.label, value, p.name]);
        }
        continue;
      }
      const counts = tallyAnswers(q, allAnswers);
      for (const opt of q.options) rows.push([q.label, opt, counts[opt] ?? 0]);
    }
    downloadCsv(`respuestas-rsvp-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  /**
   * Desglose MESA POR MESA. Es lo que la cocina necesita de verdad: se sirve por
   * mesas, no por totales del salón. Un camarero llega a la Mesa 7 y tiene que
   * saber que salen 3 carnes, 2 pescados y 1 vegetariano.
   */
  const exportPorMesa = () => {
    const eleccion = questions.filter(q => q.type !== "text");
    const abiertas = questions.filter(q => q.type === "text");

    const rows: unknown[][] = [[
      "Mesa", "Comensales",
      ...eleccion.flatMap(q => q.options.map(o => `${q.label}: ${o}`)),
      ...abiertas.map(q => q.label),
    ]];

    const grupos = [
      ...tables.map(t => ({ nombre: t.name, gente: personas.filter(p => p.tableId === t.id) })),
      { nombre: "Sin mesa asignada", gente: personas.filter(p => !p.tableId) },
    ].filter(g => g.gente.length > 0);

    for (const grupo of grupos) {
      const respuestas = grupo.gente
        .map(p => p.answers)
        .filter(Boolean) as RsvpAnswers[];

      rows.push([
        grupo.nombre,
        grupo.gente.length,
        ...eleccion.flatMap(q => {
          const counts = tallyAnswers(q, respuestas);
          return q.options.map(o => counts[o] ?? 0);
        }),
        // Las abiertas se listan con el nombre de quien las escribió: el catering
        // necesita saber que la alergia es de Ana, no que "hay una alergia".
        ...abiertas.map(q =>
          grupo.gente
            .map(p => {
              const v = p.answers?.[q.id];
              return typeof v === "string" && v ? `${p.name}: ${v}` : null;
            })
            .filter(Boolean)
            .join(" · ")
        ),
      ]);
    }

    downloadCsv(`catering-por-mesa-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

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
              {answered.length} de {personas.length} personas respondieron
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportSummary}
              disabled={answered.length === 0}
              className="!w-full sm:!w-auto"
            >
              <Download className="mr-2 h-4 w-4" /> Resumen general
            </Button>
            {tables.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportPorMesa}
                disabled={answered.length === 0}
                className="!w-full sm:!w-auto"
              >
                <Download className="mr-2 h-4 w-4" /> Desglose por mesa
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {questions.map(q => {
            if (q.type === "text") {
              const respuestas = answered
                .map(p => ({ name: p.name, value: (p.answers as RsvpAnswers)[q.id] }))
                .filter(r => typeof r.value === "string" && r.value);
              return (
                <div key={q.id} className="space-y-1">
                  <p className="text-sm font-medium">{q.label}</p>
                  {respuestas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin respuestas todavía.</p>
                  ) : (
                    <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                      {respuestas.map((r, i) => (
                        <li key={`${r.name}-${i}`} className="text-muted-foreground">
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
        </div>
      )}
    </div>
  );
};
