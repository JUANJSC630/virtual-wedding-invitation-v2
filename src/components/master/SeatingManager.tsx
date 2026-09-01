import { useRef, useState } from "react";

import toast from "react-hot-toast";
import type Konva from "konva";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Guest } from "@/types";

import {
  SeatingPerson,
  SeatingPlan as SeatingProposal,
  autoAssign,
  capacitySummary,
  findViolations,
} from "@/lib/seating";
import { TableWithPeople } from "@/services/seating-service";

import {
  useApplySeating,
  useCreateSeatingRule,
  useCreateTable,
  useDeleteSeatingRule,
  useDeleteTable,
  useCreateVenueElement,
  useDeleteVenueElement,
  useSeatingRules,
  useTables,
  useUpdateTable,
  useUpdateVenueElement,
  useVenue,
} from "@/hooks/useSeating";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";

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
      isPrimary: a.isPrimary,
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
  rules: { id: string; groupAId: string; groupBId: string; kind: "apart" | "together" }[];
  onCreate: (a: string, b: string, kind: "apart" | "together") => void;
  onDelete: (id: string) => void;
}> = ({ guests, rules, onCreate, onDelete }) => {
  const [abierto, setAbierto] = useState(false);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [kind, setKind] = useState<"apart" | "together">("apart");
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
          <span className="block font-medium">Quién va junto y quién no</span>
          <span className="block text-sm text-muted-foreground">
            {rules.length === 0
              ? "Sin reglas. Para padres divorciados, o para juntar a quienes se conocen."
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
                    <span className={r.kind === "together" ? "text-primary" : "text-muted-foreground"}>
                      {r.kind === "together" ? "van en la misma mesa" : "no comparten mesa"}
                    </span>
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
            {([[a, setA, "Primera invitación"], [b, setB, "Segunda invitación"]] as const).map(
              ([valor, set, etiqueta]) => (
                <Combobox
                  key={etiqueta}
                  value={valor}
                  onChange={set}
                  placeholder={`${etiqueta}…`}
                  emptyText="Ningún invitado coincide"
                  aria-label={etiqueta}
                  options={guests.map(g => ({
                    value: g.id,
                    label: g.name,
                    hint: `${g.code} · ${g.attendees?.length ?? 1} ${
                      (g.attendees?.length ?? 1) === 1 ? "persona" : "personas"
                    }`,
                  }))}
                />
              )
            )}
            <div className="flex gap-2">
              <div className="flex flex-1 overflow-hidden rounded-md border text-sm">
                {([["apart", "Separar"], ["together", "Juntar"]] as const).map(([k, etiqueta]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`min-h-11 flex-1 touch-manipulation px-3 sm:min-h-9 ${
                      kind === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                disabled={!a || !b || a === b}
                onClick={() => { onCreate(a, b, kind); setA(""); setB(""); }}
              >
                Añadir
              </Button>
            </div>
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
  const { data: venue = [] } = useVenue();
  const createVenue = useCreateVenueElement();
  const updateVenue = useUpdateVenueElement();
  const deleteVenue = useDeleteVenueElement();

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
  /**
   * Reglas que el reparto ACTUAL incumple. Es distinto de los avisos de la
   * propuesta: una regla creada después de sentar a la gente no mueve a nadie
   * por sí sola, así que hay que decirlo o el organizador no entiende por qué
   * "no pasa nada" al crearla.
   */
  const incumplidas = findViolations(tables, people, rules);
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

  /**
   * Rehace el reparto ignorando lo ya asignado (salvo las mesas fijadas). Es la
   * única forma de que una regla creada a posteriori surta efecto.
   */
  const handleRehacer = () => {
    if (!confirm("Se recalculará el reparto de todos los confirmados, respetando las mesas fijadas y las reglas. ¿Continuar?")) return;
    const plan = autoAssign(tables, people, { rules, respectExisting: false });
    // Se levanta a todo el mundo primero: si no, quien no entre en el plan
    // nuevo se quedaría donde estaba y la regla seguiría incumplida.
    const limpieza: Record<string, string | null> = Object.fromEntries(
      people
        .filter(p => p.tableId && !tables.some(t => t.id === p.tableId && t.locked))
        .map(p => [p.id, null])
    );
    setProposal(plan);
    guardar({ ...limpieza, ...plan.assignments }, `Reparto rehecho: ${plan.seated} personas sentadas`);
    setProposal(null);
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

      {/* ── Reglas incumplidas por el reparto actual ─────────────────── */}
      {incumplidas.length > 0 && (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="font-medium text-destructive">
                {incumplidas.length === 1
                  ? "Una regla no se está cumpliendo"
                  : `${incumplidas.length} reglas no se están cumpliendo`}
              </p>
              <ul className="mt-1 space-y-1 text-sm">
                {incumplidas.map((v, i) => (
                  <li key={i}>• {v.message}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Las reglas se aplican al sugerir un reparto; no mueven a quien ya está sentado.
                Puedes cambiarlo a mano o rehacer el reparto.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleRehacer} disabled={busy} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Rehacer reparto respetando las reglas
          </Button>
        </div>
      )}

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
        onCreate={(groupAId, groupBId, kind) =>
          createRule.mutate(
            { kind, groupAId, groupBId },
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
        <>
          {/* Elementos del salón: se añaden desde aquí y se arrastran en el plano */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Añadir al salón:</span>
            {([
              ["pista", "Pista de baile", 360, 260],
              ["escenario", "Escenario / DJ", 300, 140],
              ["barra", "Barra", 260, 100],
              ["entrada", "Entrada", 160, 90],
              ["buffet", "Buffet", 300, 110],
            ] as const).map(([kind, etiqueta, width, height]) => (
              <Button
                key={kind}
                variant="outline"
                size="sm"
                disabled={createVenue.isPending}
                onClick={() =>
                  createVenue.mutate(
                    { kind, width, height },
                    { onSuccess: () => toast.success(`${etiqueta} añadida`) }
                  )
                }
              >
                <Plus className="h-3 w-3 mr-1" /> {etiqueta}
              </Button>
            ))}
          </div>

          {venue.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {venue.map(el => (
                <li key={el.id} className="flex min-h-11 items-center gap-1 rounded-md border px-2 text-sm sm:min-h-9">
                  <span>{el.label || el.kind}</span>
                  <button
                    type="button"
                    onClick={() => deleteVenue.mutate(el.id)}
                    className="flex h-9 w-9 touch-manipulation items-center justify-center rounded text-muted-foreground hover:bg-accent"
                    aria-label={`Quitar ${el.label || el.kind}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <SeatingPlan
            tables={tablesConPosicion}
            venue={venue}
            selectedId={selectedTable}
            onSelect={setSelectedTable}
            stageRef={stageRef}
            onMove={(id, x, y) => updateTable.mutate({ id, updates: { x, y } })}
            onMoveVenue={(id, x, y) => updateVenue.mutate({ id, updates: { x, y } })}
          />
        </>
      )}
    </div>
  );
};
