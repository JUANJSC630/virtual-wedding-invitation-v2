import { useState } from "react";

import toast from "react-hot-toast";
import { LayoutGrid, List, Plus, Sparkles } from "lucide-react";

import { Guest } from "@/types";

import { SeatingPerson, SeatingPlan as SeatingProposal, autoAssign, capacitySummary } from "@/lib/seating";
import { TableWithPeople } from "@/services/seating-service";

import {
  useApplySeating,
  useCreateTable,
  useDeleteTable,
  useTables,
  useUpdateTable,
} from "@/hooks/useSeating";

import { Button } from "@/components/ui/button";

import { SeatingList } from "./SeatingList";
import { SeatingPlan } from "./SeatingPlan";

interface Props {
  guests: Guest[];
}

/** Aplana los invitados en personas, que es lo que se sienta. */
function toPeople(guests: Guest[]): SeatingPerson[] {
  return guests.flatMap(guest =>
    (guest.attendees ?? []).map(a => ({
      id: a.id,
      name: a.name,
      groupId: guest.id,
      groupName: guest.name,
      confirmed: a.confirmed,
      tableId: a.tableId ?? null,
    }))
  );
}

/**
 * Mapa de mesas: resumen, recomendación y los dos modos de trabajo.
 *
 * El modo lista arranca por defecto porque es el que sirve desde el móvil, que
 * es donde la mayoría de organizadores usa el panel. Ver ARQUITECTURA_MESAS.md §4.
 */
export const SeatingManager: React.FC<Props> = ({ guests }) => {
  const { data: tables = [], isLoading } = useTables();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const applySeating = useApplySeating();

  const [mode, setMode] = useState<"lista" | "plano">("lista");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [proposal, setProposal] = useState<SeatingProposal | null>(null);

  const people = toPeople(guests);
  const resumen = capacitySummary(tables, people);
  const busy =
    applySeating.isPending || createTable.isPending || deleteTable.isPending;

  const guardar = (assignments: Record<string, string | null>, mensaje: string) =>
    applySeating.mutate(assignments, {
      onSuccess: () => toast.success(mensaje),
      onError: (e: Error) => toast.error(e.message),
    });

  const handleAssign = (attendeeId: string, tableId: string | null) =>
    guardar({ [attendeeId]: tableId }, tableId ? "Sentado" : "Levantado de la mesa");

  const handleAssignGroup = (groupId: string, tableId: string) => {
    const delGrupo = people.filter(p => p.groupId === groupId && p.confirmed && !p.tableId);
    guardar(
      Object.fromEntries(delGrupo.map(p => [p.id, tableId])),
      `${delGrupo.length} ${delGrupo.length === 1 ? "persona sentada" : "personas sentadas"}`
    );
  };

  const handleCreateTable = () =>
    createTable.mutate(
      {
        name: `Mesa ${tables.length + 1}`,
        capacity: 8,
        shape: "round",
        // Se reparten en rejilla para que no nazcan una encima de otra.
        x: 160 + (tables.length % 4) * 220,
        y: 150 + Math.floor(tables.length / 4) * 200,
      },
      {
        onSuccess: () => toast.success("Mesa creada"),
        onError: (e: Error) => toast.error(e.message),
      }
    );

  const handleDeleteTable = (table: TableWithPeople) => {
    const aviso =
      table.attendees.length > 0
        ? `¿Eliminar ${table.name}? Sus ${table.attendees.length} invitados quedarán sin mesa (no se borran).`
        : `¿Eliminar ${table.name}?`;
    if (!confirm(aviso)) return;
    deleteTable.mutate(table.id, {
      onSuccess: () => toast.success("Mesa eliminada"),
      onError: (e: Error) => toast.error(e.message),
    });
  };

  /** Calcula la propuesta en el navegador: es lógica pura, no hace falta ir al servidor. */
  const handleSuggest = () => {
    const plan = autoAssign(tables, people);
    setProposal(plan);
    if (plan.seated === 0 && plan.warnings.length === 0) {
      toast("No hay nadie nuevo que sentar.");
      setProposal(null);
    }
  };

  const aplicarPropuesta = () => {
    if (!proposal) return;
    guardar(proposal.assignments, `${proposal.seated} personas sentadas`);
    setProposal(null);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando mesas…</p>;

  return (
    <div className="space-y-4">
      {/* ── Resumen ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Confirmados", value: resumen.confirmed },
          { label: "Con mesa", value: resumen.assigned },
          { label: "Por sentar", value: resumen.pending },
          {
            label: "Capacidad",
            value: resumen.capacity,
            hint: resumen.spare < 0 ? `faltan ${Math.abs(resumen.spare)}` : `sobran ${resumen.spare}`,
          },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-xl font-semibold">{kpi.value}</p>
            {kpi.hint && (
              <p className={`text-xs ${resumen.spare < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {kpi.hint}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Acciones ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={handleSuggest} disabled={busy || tables.length === 0} className="gap-1.5">
          <Sparkles className="h-4 w-4" /> Sugerir distribución
        </Button>
        <Button variant="outline" onClick={handleCreateTable} disabled={busy} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nueva mesa
        </Button>
        <div className="flex overflow-hidden rounded-md border text-sm sm:ml-auto">
          {([
            ["lista", "Lista", List],
            ["plano", "Plano", LayoutGrid],
          ] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex min-h-11 flex-1 touch-manipulation items-center justify-center gap-1.5 px-3 sm:min-h-0 sm:flex-none ${
                mode === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Propuesta: se muestra, no se aplica sola ─────────────────── */}
      {proposal && (
        <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
          <div>
            <p className="font-medium">Distribución sugerida</p>
            <p className="text-sm text-muted-foreground">
              {proposal.seated} {proposal.seated === 1 ? "persona sentada" : "personas sentadas"}
              {proposal.unseated > 0 && ` · ${proposal.unseated} sin sitio`}. Las familias se
              mantienen juntas.
            </p>
          </div>

          {proposal.warnings.length > 0 && (
            <ul className="space-y-1 text-sm">
              {proposal.warnings.map((w, i) => (
                <li key={i} className={w.kind === "grupo-partido" ? "text-amber-700" : "text-destructive"}>
                  • {w.message}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={aplicarPropuesta} disabled={busy || proposal.seated === 0}>
              Aplicar
            </Button>
            <Button variant="outline" onClick={() => setProposal(null)}>
              Descartar
            </Button>
          </div>
        </div>
      )}

      {mode === "lista" ? (
        <SeatingList
          tables={tables}
          people={people}
          onAssign={handleAssign}
          onAssignGroup={handleAssignGroup}
          onUpdateTable={(id, updates) => updateTable.mutate({ id, updates })}
          onDeleteTable={handleDeleteTable}
          busy={busy}
        />
      ) : (
        <SeatingPlan
          tables={tables}
          selectedId={selectedTable}
          onSelect={setSelectedTable}
          onMove={(id, x, y) => updateTable.mutate({ id, updates: { x, y } })}
        />
      )}
    </div>
  );
};
