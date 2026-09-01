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

/**
 * Tamaños reales de alquiler, con la capacidad que admiten cómodamente.
 *
 * Los números vienen de las guías de montaje: una redonda de 60″ sienta 8, una
 * de 72″ sienta 10, y una rectangular de 8 pies sienta 8 por los lados o 10
 * añadiendo las cabeceras. Teclear la capacidad a ojo lleva a planos que en el
 * salón no encajan. Ver INVESTIGACION_SISTEMA_COMPLETO_2026.md §3.
 */
export interface TablePreset {
  id: string;
  label: string;
  hint: string;
  shape: TableShape;
  capacity: number;
}

export const TABLE_PRESETS: TablePreset[] = [
  { id: "r48", label: "Redonda 48″", hint: "6 personas · 1,20 m", shape: "round", capacity: 6 },
  { id: "r60", label: "Redonda 60″", hint: "8 personas · 1,50 m — la más común", shape: "round", capacity: 8 },
  { id: "r72", label: "Redonda 72″", hint: "10 personas · 1,80 m", shape: "round", capacity: 10 },
  { id: "l8", label: "Larga 8 pies", hint: "8 personas · 10 con cabeceras", shape: "rect", capacity: 8 },
  { id: "l8c", label: "Larga con cabeceras", hint: "10 personas · 2,40 m", shape: "rect", capacity: 10 },
  { id: "presi", label: "Presidencial", hint: "2 personas · solo los novios", shape: "round", capacity: 2 },
];

export interface SeatingTable {
  id: string;
  name: string;
  shape: TableShape;
  capacity: number;
  x: number;
  y: number;
  rotation: number;
  /** Fijada: la recomendación no sienta a nadie aquí ni mueve a quien ya está. */
  locked?: boolean;
  notes?: string | null;
}

/**
 * Restricción entre dos invitaciones. La etiqueta impone cosas que los datos no
 * pueden adivinar: unos padres divorciados **no** comparten mesa, y a veces se
 * quiere lo contrario, juntar a dos familias amigas.
 */
export interface SeatingRule {
  kind: "apart" | "together";
  groupAId: string;
  groupBId: string;
}

/** Una persona a sentar. `groupId` es su invitación (el hogar). */
export interface SeatingPerson {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  confirmed: boolean;
  /** Titular de la invitación; el resto son sus acompañantes. */
  isPrimary?: boolean;
  tableId?: string | null;
}

export type SeatingWarningKind =
  | "grupo-partido"
  | "sin-sitio"
  | "sin-mesas"
  | "regla-incumplida";

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
  /** Invitaciones que componen el bloque; más de una si hay preferencia de juntar. */
  groupIds?: string[];
}

/**
 * Une invitaciones que deben compartir mesa ("together") en un solo bloque.
 *
 * Se resuelve con conjuntos disjuntos porque las preferencias encadenan: si A va
 * con B y B con C, los tres acaban en la misma mesa aunque nadie declarara A-C.
 */
function agruparPorPreferencia(rules: SeatingRule[]): Map<string, string> {
  const padre = new Map<string, string>();
  const raiz = (x: string): string => {
    const p = padre.get(x);
    if (!p || p === x) return x;
    const r = raiz(p);
    padre.set(x, r);
    return r;
  };
  for (const rule of rules) {
    if (rule.kind !== "together") continue;
    for (const g of [rule.groupAId, rule.groupBId]) if (!padre.has(g)) padre.set(g, g);
    const ra = raiz(rule.groupAId);
    const rb = raiz(rule.groupBId);
    if (ra !== rb) padre.set(rb, ra);
  }
  const resultado = new Map<string, string>();
  for (const g of padre.keys()) resultado.set(g, raiz(g));
  return resultado;
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
  {
    respectExisting = true,
    rules = [],
  }: { respectExisting?: boolean; rules?: SeatingRule[] } = {}
): SeatingPlan {
  const warnings: SeatingWarning[] = [];

  if (tables.filter(t => !t.locked).length === 0) {
    return {
      assignments: {},
      warnings: [{
        kind: "sin-mesas",
        message: tables.length === 0
          ? "No hay mesas todavía. Crea al menos una."
          : "Todas las mesas están fijadas. Desfija alguna para poder repartir.",
      }],
      seated: 0,
      unseated: buildHouseholds(people).reduce((n, h) => n + h.people.length, 0),
    };
  }

  // Una mesa fijada queda fuera del reparto: ni se le añade gente ni se mueve a
  // quien ya está sentado en ella, aunque se pida rehacer el plano entero.
  const disponibles = tables.filter(t => !t.locked);
  const enMesaFijada = new Set(
    people.filter(p => p.tableId && tables.some(t => t.id === p.tableId && t.locked)).map(p => p.id)
  );

  // Punto de partida: lo ya asignado ocupa sitio si se respeta.
  const fixed = people.filter(
    p =>
      p.confirmed &&
      p.tableId &&
      tables.some(t => t.id === p.tableId) &&
      (respectExisting || enMesaFijada.has(p.id))
  );
  const occupancy = occupancyByTable(fixed);
  for (const table of tables) occupancy[table.id] ??= 0;

  /** Hogares que no pueden compartir mesa, por la regla "apart". */
  const separados = new Map<string, Set<string>>();
  for (const rule of rules) {
    if (rule.kind !== "apart") continue;
    const pares: [string, string][] = [
      [rule.groupAId, rule.groupBId],
      [rule.groupBId, rule.groupAId],
    ];
    for (const [a, b] of pares) {
      if (!separados.has(a)) separados.set(a, new Set());
      separados.get(a)?.add(b);
    }
  }

  /** Qué hogares hay ya en cada mesa, para poder respetar las reglas. */
  const hogaresEnMesa = new Map<string, Set<string>>();
  const anotar = (tableId: string, groupId: string) => {
    if (!hogaresEnMesa.has(tableId)) hogaresEnMesa.set(tableId, new Set());
    hogaresEnMesa.get(tableId)?.add(groupId);
  };
  for (const p of fixed) if (p.tableId) anotar(p.tableId, p.groupId);

  /**
   * ¿Choca este bloque con alguien ya sentado en esa mesa? Se comprueban TODAS
   * las invitaciones que lo componen: si A va junto con B, y B está separada de
   * C, el bloque AB tampoco puede compartir mesa con C.
   */
  const chocaEn = (tableId: string, groupIds: string[]) => {
    const presentes = hogaresEnMesa.get(tableId);
    if (!presentes) return false;
    for (const propio of groupIds) {
      const enemigos = separados.get(propio);
      if (!enemigos) continue;
      for (const otro of presentes) if (enemigos.has(otro)) return true;
    }
    return false;
  };

  const yaSentados = new Set(fixed.map(p => p.id));
  // Las preferencias de juntar fusionan invitaciones en un solo bloque, que
  // luego se reparte como si fuera una familia grande.
  const raizDe = agruparPorPreferencia(rules);
  const bloques = new Map<string, Household>();
  for (const h of buildHouseholds(people)) {
    const clave = raizDe.get(h.groupId) ?? h.groupId;
    const existente = bloques.get(clave);
    if (existente) {
      existente.people.push(...h.people);
      existente.groupIds?.push(h.groupId);
      existente.groupName = `${existente.groupName} + ${h.groupName}`;
    } else {
      bloques.set(clave, { ...h, groupId: clave, groupIds: [h.groupId] });
    }
  }

  const households = [...bloques.values()]
    .map(h => ({ ...h, people: h.people.filter(p => !yaSentados.has(p.id) && !enMesaFijada.has(p.id)) }))
    .filter(h => h.people.length > 0)
    // Best-fit *decreasing*: los grupos grandes primero, que son los difíciles.
    .sort((a, b) => b.people.length - a.people.length || a.groupName.localeCompare(b.groupName));

  const assignments: Record<string, string> = {};
  let seated = 0;
  let unseated = 0;

  for (const household of households) {
    const size = household.people.length;

    // Best fit: la mesa donde quede el hueco más ajustado tras sentarlos,
    // descartando las que incumplirían una regla de separación.
    const cabe = disponibles
      .filter(t => freeSeats(t, occupancy) >= size && !chocaEn(t.id, household.groupIds ?? [household.groupId]))
      .sort((a, b) => freeSeats(a, occupancy) - freeSeats(b, occupancy));

    if (cabe[0]) {
      const table = cabe[0];
      for (const person of household.people) assignments[person.id] = table.id;
      occupancy[table.id] = (occupancy[table.id] ?? 0) + size;
      for (const g of household.groupIds ?? [household.groupId]) anotar(table.id, g);
      seated += size;
      continue;
    }

    // Si no cupo por una regla pero sí había sitio, se dice explícitamente.
    const habriaCabido = disponibles.some(t => freeSeats(t, occupancy) >= size);
    if (habriaCabido) {
      warnings.push({
        kind: "regla-incumplida",
        message: `${household.groupName} (${size}) no cabe sin romper una regla de separación. Añade otra mesa o revisa las reglas.`,
      });
    }

    // No cabe entero: se reparte por las mesas con más hueco y se avisa.
    const restantes = [...household.people];
    const usadas: string[] = [];
    while (restantes.length > 0) {
      const conHueco = disponibles
        .filter(t => freeSeats(t, occupancy) > 0 && !chocaEn(t.id, household.groupIds ?? [household.groupId]))
        .sort((a, b) => freeSeats(b, occupancy) - freeSeats(a, occupancy));
      const table = conHueco[0];
      if (!table) break;

      const hueco = freeSeats(table, occupancy);
      for (const person of restantes.splice(0, hueco)) {
        assignments[person.id] = table.id;
        occupancy[table.id] = (occupancy[table.id] ?? 0) + 1;
        seated++;
      }
      anotar(table.id, household.groupId);
      for (const g of household.groupIds ?? [household.groupId]) anotar(table.id, g);
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


/** Una regla que el reparto ACTUAL no cumple. */
export interface RuleViolation {
  kind: "apart" | "together";
  groupAName: string;
  groupBName: string;
  tableName: string | null;
  message: string;
}

/**
 * Reglas que el reparto actual incumple.
 *
 * Existe porque `autoAssign` solo *previene*: nunca mueve a quien ya está
 * sentado, así que una regla creada después de repartir no cambia nada por sí
 * sola. Sin esta comprobación el organizador crea la regla, no ve ningún efecto
 * y no entiende por qué. Aquí se le dice, y puede rehacer el reparto.
 */
export function findViolations(
  tables: SeatingTable[],
  people: SeatingPerson[],
  rules: SeatingRule[]
): RuleViolation[] {
  const nombreMesa = new Map(tables.map(t => [t.id, t.name]));
  const nombreGrupo = new Map<string, string>();
  /** Mesas ocupadas por cada invitación. */
  const mesasDe = new Map<string, Set<string>>();

  for (const p of people) {
    nombreGrupo.set(p.groupId, p.groupName);
    if (!p.confirmed || !p.tableId) continue;
    if (!mesasDe.has(p.groupId)) mesasDe.set(p.groupId, new Set());
    mesasDe.get(p.groupId)?.add(p.tableId);
  }

  const violaciones: RuleViolation[] = [];

  for (const rule of rules) {
    const a = mesasDe.get(rule.groupAId);
    const b = mesasDe.get(rule.groupBId);
    // Si alguno aún no está sentado, no hay nada que incumplir todavía.
    if (!a || !b || a.size === 0 || b.size === 0) continue;

    const nombreA = nombreGrupo.get(rule.groupAId) ?? "una invitación";
    const nombreB = nombreGrupo.get(rule.groupBId) ?? "otra invitación";
    const compartidas = [...a].filter(m => b.has(m));

    if (rule.kind === "apart" && compartidas.length > 0) {
      const mesa = nombreMesa.get(compartidas[0] ?? "") ?? null;
      violaciones.push({
        kind: "apart",
        groupAName: nombreA,
        groupBName: nombreB,
        tableName: mesa,
        message: `${nombreA} y ${nombreB} comparten ${mesa ?? "mesa"}, pero están marcadas como separadas.`,
      });
    }

    if (rule.kind === "together" && compartidas.length === 0) {
      violaciones.push({
        kind: "together",
        groupAName: nombreA,
        groupBName: nombreB,
        tableName: null,
        message: `${nombreA} y ${nombreB} deberían compartir mesa y están separadas.`,
      });
    }
  }

  return violaciones;
}
