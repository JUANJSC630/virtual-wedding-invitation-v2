import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";

import { RSVP_QUESTION_TYPES, RsvpQuestion, RsvpQuestionType } from "@/lib/rsvpQuestions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  questions: RsvpQuestion[];
  onChange: (questions: RsvpQuestion[]) => void;
}

const isChoice = (type: RsvpQuestionType) => type === "single" || type === "multi";

/** Id estable a partir de la etiqueta, con sufijo si ya existe. */
function makeId(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "pregunta";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/**
 * Editor de las preguntas personalizadas del RSVP.
 *
 * El `id` se deriva de la etiqueta solo al crear la pregunta y nunca se
 * recalcula: es la clave con la que quedan guardadas las respuestas ya
 * recibidas, así que renombrar la etiqueta no debe huerfanar nada.
 */
export const RsvpQuestionsEditor: React.FC<Props> = ({ questions, onChange }) => {
  const update = (index: number, patch: Partial<RsvpQuestion>) =>
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const remove = (index: number) => onChange(questions.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    const [item] = next.splice(index, 1);
    if (item) next.splice(target, 0, item);
    onChange(next);
  };

  const add = (type: RsvpQuestionType) => {
    const label = type === "text" ? "Nueva pregunta abierta" : "Nueva pregunta";
    onChange([
      ...questions,
      {
        id: makeId(label + " " + (questions.length + 1), questions.map(q => q.id)),
        type,
        label,
        options: isChoice(type) ? ["Opción 1", "Opción 2"] : [],
        required: false,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Preguntas que verá el invitado al confirmar asistencia. Solo se piden cuando confirma:
        si declina, no se le muestran.
      </p>

      {questions.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Todavía no hay preguntas. Añade una para pedir menú, alergias o una canción.
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex shrink-0 flex-col items-center">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-25"
                  aria-label="Subir pregunta"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <GripVertical className="h-3 w-3 text-muted-foreground/40" />
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === questions.length - 1}
                  className="flex h-9 w-9 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-25"
                  aria-label="Bajar pregunta"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <div>
                    <Label className="text-xs">Pregunta</Label>
                    <Input
                      value={q.label}
                      onChange={e => update(i, { label: e.target.value })}
                      placeholder="¿Qué menú prefieres?"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <select
                      value={q.type}
                      onChange={e => {
                        const type = e.target.value as RsvpQuestionType;
                        update(i, {
                          type,
                          options: isChoice(type)
                            ? (q.options.length ? q.options : ["Opción 1", "Opción 2"])
                            : [],
                        });
                      }}
                      className="h-11 w-full touch-manipulation rounded-md border border-input bg-background px-3 text-base sm:h-10 sm:w-44 sm:text-sm"
                    >
                      {RSVP_QUESTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isChoice(q.type) && (
                  <div className="space-y-2">
                    <Label className="text-xs">Opciones</Label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={e =>
                            update(i, {
                              options: q.options.map((o, k) => (k === oi ? e.target.value : o)),
                            })
                          }
                          placeholder={`Opción ${oi + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => update(i, { options: q.options.filter((_, k) => k !== oi) })}
                          aria-label="Eliminar opción"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => update(i, { options: [...q.options, ""] })}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Añadir opción
                    </Button>
                    {q.options.filter(o => o.trim()).length === 0 && (
                      <p className="text-xs text-amber-600">
                        Sin opciones con texto, esta pregunta no se guardará.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <label className="-ml-2 flex min-h-11 cursor-pointer touch-manipulation items-center gap-2 rounded-md px-2 text-sm">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={e => update(i, { required: e.target.checked })}
                      className="h-5 w-5 accent-primary"
                    />
                    Obligatoria
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(i)}
                    className="text-destructive ml-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar pregunta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        {RSVP_QUESTION_TYPES.map(t => (
          <Button
            key={t.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add(t.value)}
            className="!justify-start sm:!justify-center"
            title={t.hint}
          >
            <Plus className="h-3 w-3 mr-1" /> {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
