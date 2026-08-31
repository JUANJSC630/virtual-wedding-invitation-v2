/**
 * Asignación de invitados a mesas.
 *
 * La recomendación funciona **sin que el organizador configure nada**, porque la
 * restricción más fuerte de una boda ya está en los datos: un `Guest` es un
 * hogar y sus `Attendee` son sus personas. La familia Torres está declarada como
 * grupo desde que se creó la invitación. Ver ARQUITECTURA_MESAS.md §1.
 *
 * El reparto es un problema de *bin packing* y se resuelve con **best-fit
 * decreasing**: primero los grupos grandes, cada uno a la mesa donde quede el
 * hueco más ajustado. Para 12 mesas y 40 hogares el óptimo global no aporta nada
 * perceptible y cuesta mucho más código; el valor está en no partir familias.
 */

export type TableShape = "round" | "rect";

export interface SeatingTable {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  x: number;
  y: number;
  rotation: number;
}

/** Una persona a sentar. `groupId` es su invitación (el hogar). */
export interface SeatingPerson {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  confirmed: boolean;
  tableId?: string | null;
}

export type SeatingWarningKind = "grupo-partido" | "sin-sitio" | "sin-mesas";

export interface SeatingWarning {
  kind: SeatingWarningKind;
  message: string;
}

export interface SeatingPlan {
  /** personaId → mesaId. Solo incluye a quien la propuesta mueve o coloca. */
  assignments: Record<string, string>;
  warnings: SeatingWarning[];
  seated: number;
  unseated: number;
}

/** Personas ya sentadas en cada mesa, contadas por id de mesa. */
export function occupancyByTable(people: SeatingPerson[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const person of people) {
    if (!person.tableId) continue;
    counts[person.tableId] = (counts[person.tableId] ?? 0) + 1;
  }
  return counts;
}

/** Sitios libres de una mesa, nunca negativos. */
export function freeSeats(table: SeatingTable, occupancy: Record<string, number>): number {
  return Math.max(0, table.capacity - (occupancy[table.id] ?? 0));
}

interface Household {
  groupId: string;
  groupName: string;
  people: SeatingPerson[];
}

/** Agrupa a los confirmados por invitación, conservando el orden de llegada. */
function buildHouseholds(people: SeatingPerson[]): Household[] {
  const byGroup = new Map<string, Household>();
  for (const person of people) {
    if (!person.confirmed) continue;
    const existing = byGroup.get(person.groupId);
    if (existing) existing.people.push(person);
    else byGroup.set(person.groupId, {
      groupId: person.groupId,
      groupName: person.groupName,
      people: [person],
    });
  }
  return [...byGroup.values()];
}

/**
 * Propone un reparto. **No aplica nada**: devuelve la propuesta y los avisos para
 * que el organizador decida. Los avisos son parte del producto — un sistema
 * honesto dice que no cabe todo en vez de inventarse un plano imposible.
 *
 * `respectExisting` conserva a quien ya está sentado a mano y solo coloca al
 * resto; en false rehace el plano entero.
 */
export function autoAssign(
  tables: SeatingTable[],
  people: SeatingPerson[],
  { respectExisting = true }: { respectExisting?: boolean } = {}
): SeatingPlan {
  const warnings: SeatingWarning[] = [];

  if (tables.length === 0) {
    return {
      assignments: {},
      warnings: [{ kind: "sin-mesas", message: "No hay mesas todavía. Crea al menos una." }],
      seated: 0,
      unseated: buildHouseholds(people).reduce((n, h) => n + h.people.length, 0),
    };
  }

  // Punto de partida: lo ya asignado ocupa sitio si se respeta.
  const fixed = respectExisting
    ? people.filter(p => p.confirmed && p.tableId && tables.some(t => t.id === p.tableId))
    : [];
  const occupancy = occupancyByTable(fixed);
  for (const table of tables) occupancy[table.id] ??= 0;

  const yaSentados = new Set(fixed.map(p => p.id));
  const households = buildHouseholds(people)
    .map(h => ({ ...h, people: h.people.filter(p => !yaSentados.has(p.id)) }))
    .filter(h => h.people.length > 0)
    // Best-fit *decreasing*: los grupos grandes primero, que son los difíciles.
    .sort((a, b) => b.people.length - a.people.length || a.groupName.localeCompare(b.groupName));

  const assignments: Record<string, string> = {};
  let seated = 0;
  let unseated = 0;

  for (const household of households) {
    const size = household.people.length;

    // Best fit: la mesa donde quede el hueco más ajustado tras sentarlos.
    const cabe = tables
      .filter(t => freeSeats(t, occupancy) >= size)
      .sort((a, b) => freeSeats(a, occupancy) - freeSeats(b, occupancy));

    if (cabe[0]) {
      const table = cabe[0];
      for (const person of household.people) assignments[person.id] = table.id;
      occupancy[table.id] = (occupancy[table.id] ?? 0) + size;
      seated += size;
      continue;
    }

    // No cabe entero: se reparte por las mesas con más hueco y se avisa.
    const restantes = [...household.people];
    const usadas: string[] = [];
    while (restantes.length > 0) {
      const conHueco = tables
        .filter(t => freeSeats(t, occupancy) > 0)
        .sort((a, b) => freeSeats(b, occupancy) - freeSeats(a, occupancy));
      const table = conHueco[0];
      if (!table) break;

      const hueco = freeSeats(table, occupancy);
      for (const person of restantes.splice(0, hueco)) {
        assignments[person.id] = table.id;
        occupancy[table.id] = (occupancy[table.id] ?? 0) + 1;
        seated++;
      }
      usadas.push(table.name);
    }

    if (usadas.length > 1) {
      warnings.push({
        kind: "grupo-partido",
        message: `${household.groupName} (${size}) no cabe en ninguna mesa; se repartió entre ${usadas.join(" y ")}.`,
      });
    }
    unseated += restantes.length;
  }

  if (unseated > 0) {
    warnings.push({
      kind: "sin-sitio",
      message: `Faltan ${unseated} ${unseated === 1 ? "sitio" : "sitios"} para sentar a todos. Añade otra mesa o amplía las existentes.`,
    });
  }

  return { assignments, warnings, seated, unseated };
}

/** Resumen de capacidad, para avisar antes de intentar el reparto. */
export function capacitySummary(tables: SeatingTable[], people: SeatingPerson[]) {
  const capacity = tables.reduce((n, t) => n + t.capacity, 0);
  const confirmed = people.filter(p => p.confirmed).length;
  const assigned = people.filter(p => p.confirmed && p.tableId).length;
  return { capacity, confirmed, assigned, pending: confirmed - assigned, spare: capacity - confirmed };
}
