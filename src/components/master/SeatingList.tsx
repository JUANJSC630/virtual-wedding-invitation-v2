import { ChevronDown, ChevronUp, Trash2, UserMinus } from "lucide-react";

import { SeatingPerson } from "@/lib/seating";
import { TableWithPeople } from "@/services/seating-service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  tables: TableWithPeople[];
  people: SeatingPerson[];
  onAssign: (attendeeId: string, tableId: string | null) => void;
  onAssignGroup: (groupId: string, tableId: string) => void;
  onUpdateTable: (id: string, updates: { name?: string; capacity?: number }) => void;
  onDeleteTable: (table: TableWithPeople) => void;
  busy?: boolean;
}

/** Agrupa por invitación conservando el orden de aparición. */
function byHousehold(people: SeatingPerson[]) {
  const groups = new Map<string, { groupId: string; groupName: string; people: SeatingPerson[] }>();
  for (const person of people) {
    const g = groups.get(person.groupId);
    if (g) g.people.push(person);
    else groups.set(person.groupId, { groupId: person.groupId, groupName: person.groupName, people: [person] });
  }
  return [...groups.values()];
}

/**
 * Modo lista: asignar personas a mesas.
 *
 * Es el modo por defecto en móvil. Usa `<select>` nativos a propósito — en el
 * teléfono abren el selector del sistema, que se maneja mucho mejor que
 * cualquier menú propio, y no hay nada que arrastrar. Ver ARQUITECTURA_MESAS.md §4.
 */
export const SeatingList: React.FC<Props> = ({
  tables,
  people,
  onAssign,
  onAssignGroup,
  onUpdateTable,
  onDeleteTable,
  busy,
}) => {
  const confirmados = people.filter(p => p.confirmed);
  const sinMesa = confirmados.filter(p => !p.tableId);
  const pendientes = people.filter(p => !p.confirmed);
  const hogaresSinMesa = byHousehold(sinMesa);

  const huecosDe = (t: TableWithPeople) => t.capacity - t.attendees.length;

  return (
    <div className="space-y-6">
      {/* ── Por sentar ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          Por sentar{" "}
          <span className="font-normal text-muted-foreground">
            {sinMesa.length} {sinMesa.length === 1 ? "persona" : "personas"}
          </span>
        </h3>

        {sinMesa.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Todos los confirmados tienen mesa.
          </p>
        ) : (
          <div className="space-y-3">
            {hogaresSinMesa.map(hogar => (
              <div key={hogar.groupId} className="rounded-lg border bg-card p-3">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{hogar.groupName}</span>
                  <span className="text-sm text-muted-foreground">
                    {hogar.people.length} {hogar.people.length === 1 ? "persona" : "personas"}
                  </span>
                </div>

                {/* Sentar a toda la familia de una vez: es el caso habitual */}
                {hogar.people.length > 1 && tables.length > 0 && (
                  <label className="mt-2 block">
                    <span className="text-xs text-muted-foreground">Sentar al grupo completo en</span>
                    <select
                      value=""
                      disabled={busy}
                      onChange={e => e.target.value && onAssignGroup(hogar.groupId, e.target.value)}
                      className="mt-1 h-11 w-full touch-manipulation rounded-md border border-input bg-background px-3 text-base sm:h-9 sm:text-sm"
                    >
                      <option value="">Elegir mesa…</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id} disabled={huecosDe(t) < hogar.people.length}>
                          {t.name} — {huecosDe(t)} libres
                          {huecosDe(t) < hogar.people.length ? " (no caben)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <ul className="mt-2 space-y-2">
                  {hogar.people.map(persona => (
                    <li key={persona.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm">{persona.name}</span>
                      <select
                        value=""
                        disabled={busy || tables.length === 0}
                        onChange={e => e.target.value && onAssign(persona.id, e.target.value)}
                        className="h-11 w-full touch-manipulation rounded-md border border-input bg-background px-3 text-base sm:h-9 sm:w-52 sm:text-sm"
                      >
                        <option value="">
                          {tables.length === 0 ? "Crea una mesa primero" : "Sentar en…"}
                        </option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id} disabled={huecosDe(t) <= 0}>
                            {t.name} — {huecosDe(t)} libres{huecosDe(t) <= 0 ? " (llena)" : ""}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {pendientes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {pendientes.length} {pendientes.length === 1 ? "persona aún no ha confirmado" : "personas aún no han confirmado"};
            no ocupan sitio hasta que lo hagan.
          </p>
        )}
      </section>

      {/* ── Mesas ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">
          Mesas <span className="font-normal text-muted-foreground">{tables.length}</span>
        </h3>

        {tables.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Todavía no hay mesas. Crea la primera para empezar a repartir.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {tables.map(table => {
              const huecos = huecosDe(table);
              const llena = huecos <= 0;
              const excedida = huecos < 0;
              return (
                <div key={table.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <Input
                      value={table.name}
                      onChange={e => onUpdateTable(table.id, { name: e.target.value })}
                      className="!h-11 flex-1 font-medium sm:!h-9"
                      aria-label="Nombre de la mesa"
                    />
                    <label className="flex items-center gap-1">
                      <span className="sr-only">Capacidad</span>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={table.capacity}
                        onChange={e =>
                          onUpdateTable(table.id, { capacity: Number(e.target.value) || 1 })
                        }
                        className="!h-11 w-20 sm:!h-9"
                      />
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteTable(table)}
                      aria-label={`Eliminar ${table.name}`}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p
                    className={`mt-2 text-sm ${
                      excedida ? "text-destructive" : llena ? "text-amber-600" : "text-muted-foreground"
                    }`}
                  >
                    {table.attendees.length} de {table.capacity}
                    {excedida
                      ? ` · sobran ${Math.abs(huecos)}`
                      : llena
                        ? " · completa"
                        : ` · ${huecos} ${huecos === 1 ? "libre" : "libres"}`}
                  </p>

                  {table.attendees.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {table.attendees.map(persona => (
                        <li
                          key={persona.id}
                          className="flex min-h-11 items-center gap-2 rounded-md bg-muted/50 px-2 sm:min-h-9"
                        >
                          <span className="min-w-0 flex-1 truncate text-sm">{persona.name}</span>
                          <button
                            type="button"
                            onClick={() => onAssign(persona.id, null)}
                            disabled={busy}
                            className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                            aria-label={`Levantar a ${persona.name} de la mesa`}
                            title="Levantar de la mesa"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

/** Iconos reexportados para que el contenedor no tenga que importarlos aparte. */
export { ChevronDown, ChevronUp };
