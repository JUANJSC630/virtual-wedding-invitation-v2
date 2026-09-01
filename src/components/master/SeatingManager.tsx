import { useRef, useState } from "react";

import toast from "react-hot-toast";
import type Konva from "konva";
import { ChevronDown, ChevronRight, Download, LayoutGrid, List, Plus, Sparkles, Trash2 } from "lucide-react";

import { Guest } from "@/types";

import { SeatingPerson, SeatingPlan as SeatingProposal, autoAssign, capacitySummary } from "@/lib/seating";
import { TableWithPeople } from "@/services/seating-service";

import {
  useApplySeating,
  useCreateSeatingRule,
  useCreateTable,
  useDeleteSeatingRule,
  useDeleteTable,
  useSeatingRules,
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
/** Declarar qué invitaciones NO pueden compartir mesa. */
const ReglasDeSeparacion: React.FC<{
  guests: Guest[];
  rules: { id: string; groupAId: string; groupBId: string; kind: string }[];
  onCreate: (a: string, b: string) => void;
  onDelete: (id: string) => void;
}> = ({ guests, rules, onCreate, onDelete }) => {
  const [abierto, setAbierto] = useState(false);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const nombre = (id: string) => guests.find(g => g.id === id)?.name ?? "(eliminado)";

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setAbierto(o => !o)}
        className="flex min-h-12 w-full touch-manipulation items-center gap-2 px-4 py-3 text-left"
      >
        {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="min-w-0 flex-1">
          <span className="block font-medium">Quién no puede sentarse junto</span>
          <span className="block text-sm text-muted-foreground">
            {rules.length === 0
              ? "Sin reglas. Útil para padres divorciados o invitados enfrentados."
              : `${rules.length} ${rules.length === 1 ? "regla" : "reglas"}`}
          </span>
        </span>
      </button>

      {abierto && (
        <div className="space-y-3 border-t p-4">
          {rules.length > 0 && (
            <ul className="space-y-2">
              {rules.map(r => (
                <li key={r.id} className="flex min-h-11 items-center gap-2 rounded-md bg-muted/50 px-3">
                  <span className="min-w-0 flex-1 text-sm">
                    {nombre(r.groupAId)} <span className="text-muted-foreground">y</span>{" "}
                    {nombre(r.groupBId)}{" "}
                    <span className="text-muted-foreground">no comparten mesa</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="flex h-11 w-11 shrink-0 touch-manipulation sm:h-9 sm:w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                    aria-label="Eliminar regla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            {[[a, setA, "Primera invitación"], [b, setB, "Segunda invitación"]].map(
              ([valor, set, etiqueta], i) => (
                <select
                  key={i}
                  value={valor as string}
                  onChange={e => (set as (v: string) => void)(e.target.value)}
                  className="h-11 w-full touch-manipulation rounded-md border border-input bg-background px-3 text-base sm:h-9 sm:text-sm"
                  aria-label={etiqueta as string}
                >
                  <option value="">{etiqueta as string}…</option>
                  {guests.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )
            )}
            <Button
              variant="outline"
              disabled={!a || !b || a === b}
              onClick={() => { onCreate(a, b); setA(""); setB(""); }}
            >
              Separar
            </Button>
          </div>
          {a && b && a === b && (
            <p className="text-xs text-destructive">Elige dos invitaciones distintas.</p>
          )}
        </div>
      )}
    </div>
  );
};

export const SeatingManager: React.FC<Props> = ({ guests }) => {
  const { data: tables = [], isLoading } = useTables();
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const applySeating = useApplySeating();
  const { data: rules = [] } = useSeatingRules();
  const createRule = useCreateSeatingRule();
  const deleteRule = useDeleteSeatingRule();

  const [mode, setMode] = useState<"lista" | "plano">("lista");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [proposal, setProposal] = useState<SeatingProposal | null>(null);
  /** Ajustes de la próxima mesa: no todas las mesas de un salón son iguales. */
  const [nuevaMesa, setNuevaMesa] = useState<{ capacity: number; shape: "round" | "rect" }>({
    capacity: 8,
    shape: "round",
  });
  const stageRef = useRef<Konva.Stage | null>(null);

  /** Exporta el plano al doble de resolución, para imprimirlo sin pixelar. */
  const exportarPlano = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const link = document.createElement("a");
    link.download = `plano-mesas-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = stage.toDataURL({ pixelRatio: 2 });
    link.click();
  };

  /**
   * Una mesa sin posición (creada por API o importada) se colocaría en la
   * esquina, encima de las demás. Se le asigna un hueco en rejilla.
   */
  const tablesConPosicion = tables.map((t, i) =>
    t.x === 0 && t.y === 0
      ? { ...t, x: 200 + (i % 4) * 300, y: 180 + Math.floor(i / 4) * 260 }
      : t
  );

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

  /**
   * El nombre y la posición los pone el servidor. Derivarlos aquí de
   * `tables.length` provocaba dos "Mesa 2" superpuestas al crear dos seguidas
   * antes de que la lista se refrescara.
   */
  const handleCreateTable = () =>
    createTable.mutate(
      { capacity: nuevaMesa.capacity, shape: nuevaMesa.shape },
      {
        onSuccess: t => toast.success(`${t.name} creada`),
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
    const plan = autoAssign(tables, people, { rules });
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
        {/* Capacidad y forma se eligen ANTES de crear: un salón mezcla mesas de
            8 con una presidencial de 4 o una larga de 12. */}
        <div className="flex items-stretch gap-2">
          <label className="flex items-center gap-1.5 rounded-md border px-2 text-sm">
            <span className="text-muted-foreground">Sitios</span>
            <input
              type="number"
              min={1}
              max={50}
              value={nuevaMesa.capacity}
              onChange={e =>
                setNuevaMesa(v => ({ ...v, capacity: Math.min(50, Math.max(1, Number(e.target.value) || 1)) }))
              }
              className="h-9 w-14 rounded border-0 bg-transparent text-base focus:outline-none sm:text-sm"
              aria-label="Sitios de la mesa nueva"
            />
          </label>
          <div className="flex overflow-hidden rounded-md border text-sm">
            {([["round", "Redonda"], ["rect", "Larga"]] as const).map(([forma, etiqueta]) => (
              <button
                key={forma}
                type="button"
                onClick={() => setNuevaMesa(v => ({ ...v, shape: forma }))}
                className={`min-h-11 touch-manipulation px-3 sm:min-h-0 ${
                  nuevaMesa.shape === forma ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={handleCreateTable} disabled={busy} className="gap-1.5">
            <Plus className="h-4 w-4" /> Añadir
          </Button>
        </div>
        {mode === "plano" && tables.length > 0 && (
          <Button variant="outline" onClick={exportarPlano} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar plano
          </Button>
        )}
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

      {/* ── Reglas de separación ────────────────────────────────────
          La etiqueta impone cosas que los datos no adivinan: unos padres
          divorciados no comparten mesa. Ver ARQUITECTURA_MESAS.md §7. */}
      <ReglasDeSeparacion
        guests={guests}
        rules={rules}
        onCreate={(groupAId, groupBId) =>
          createRule.mutate(
            { kind: "apart", groupAId, groupBId },
            { onSuccess: () => toast.success("Regla añadida"), onError: (e: Error) => toast.error(e.message) }
          )
        }
        onDelete={id => deleteRule.mutate(id)}
      />

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
          tables={tablesConPosicion}
          selectedId={selectedTable}
          onSelect={setSelectedTable}
          stageRef={stageRef}
          onMove={(id, x, y) => updateTable.mutate({ id, updates: { x, y } })}
        />
      )}
    </div>
  );
};
