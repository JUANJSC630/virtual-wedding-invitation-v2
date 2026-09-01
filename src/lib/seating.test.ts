import { describe, expect, it } from "vitest";

import {
  SeatingPerson,
  SeatingTable,
  autoAssign,
  capacitySummary,
  findViolations,
  freeSeats,
  occupancyByTable,
} from "./seating";

const mesa = (id: string, capacity: number, name = id): SeatingTable => ({
  id, name, shape: "round", capacity, x: 0, y: 0, rotation: 0,
});

/** Crea un hogar de `size` personas confirmadas. */
const hogar = (groupId: string, size: number, opts: Partial<SeatingPerson> = {}): SeatingPerson[] =>
  Array.from({ length: size }, (_, i) => ({
    id: `${groupId}-${i}`,
    name: `${groupId} ${i}`,
    groupId,
    groupName: `Familia ${groupId}`,
    confirmed: true,
    ...opts,
  }));

/** Cuántas personas quedaron en cada mesa según la propuesta. */
const reparto = (plan: Record<string, string>) => {
  const out: Record<string, number> = {};
  for (const t of Object.values(plan)) out[t] = (out[t] ?? 0) + 1;
  return out;
};

describe("occupancyByTable / freeSeats", () => {
  it("cuenta solo a quien tiene mesa", () => {
    const gente = [...hogar("A", 2, { tableId: "m1" }), ...hogar("B", 1)];
    expect(occupancyByTable(gente)).toEqual({ m1: 2 });
  });

  it("los sitios libres nunca son negativos aunque haya sobreasignación", () => {
    const gente = hogar("A", 5, { tableId: "m1" });
    expect(freeSeats(mesa("m1", 3), occupancyByTable(gente))).toBe(0);
  });
});

describe("autoAssign — el caso normal", () => {
  it("mantiene junta a cada familia", () => {
    const tables = [mesa("m1", 4), mesa("m2", 4)];
    const gente = [...hogar("A", 3), ...hogar("B", 3)];
    const plan = autoAssign(tables, gente);

    const mesaDeA = plan.assignments["A-0"];
    const mesaDeB = plan.assignments["B-0"];
    expect(hogar("A", 3).every(p => plan.assignments[p.id] === mesaDeA)).toBe(true);
    expect(mesaDeA).not.toBe(mesaDeB);
    expect(plan.warnings).toEqual([]);
  });

  it("no sienta a quien no ha confirmado", () => {
    const gente = [...hogar("A", 2), ...hogar("B", 2, { confirmed: false })];
    const plan = autoAssign([mesa("m1", 10)], gente);
    expect(Object.keys(plan.assignments)).toHaveLength(2);
    expect(plan.seated).toBe(2);
  });

  it("usa el hueco más ajustado (best fit), no el primero que encuentra", () => {
    // Un hogar de 2: debe ir a la mesa de 2, no a la de 8.
    const tables = [mesa("grande", 8), mesa("justa", 2)];
    const plan = autoAssign(tables, hogar("A", 2));
    expect(plan.assignments["A-0"]).toBe("justa");
  });

  it("coloca primero los grupos grandes, que son los difíciles", () => {
    // Con 4+3 en mesas de 4 y 3, solo cabe si el de 4 va primero.
    const tables = [mesa("m3", 3), mesa("m4", 4)];
    const plan = autoAssign(tables, [...hogar("chico", 3), ...hogar("grande", 4)]);
    expect(plan.assignments["grande-0"]).toBe("m4");
    expect(plan.assignments["chico-0"]).toBe("m3");
    expect(plan.unseated).toBe(0);
  });
});

describe("autoAssign — respeta lo ya asignado a mano", () => {
  it("no mueve a quien ya está sentado y descuenta su sitio", () => {
    const tables = [mesa("m1", 4)];
    const gente = [...hogar("A", 2, { tableId: "m1" }), ...hogar("B", 2)];
    const plan = autoAssign(tables, gente);

    expect(plan.assignments["A-0"]).toBeUndefined(); // no se toca
    expect(plan.assignments["B-0"]).toBe("m1");      // ocupa el hueco restante
    expect(plan.unseated).toBe(0);
  });

  it("con respectExisting:false rehace el plano entero", () => {
    const tables = [mesa("m1", 4)];
    const gente = hogar("A", 2, { tableId: "m1" });
    const plan = autoAssign(tables, gente, { respectExisting: false });
    expect(Object.keys(plan.assignments)).toHaveLength(2);
  });

  it("ignora una mesa asignada que ya no existe", () => {
    const plan = autoAssign([mesa("m1", 4)], hogar("A", 2, { tableId: "borrada" }));
    expect(plan.assignments["A-0"]).toBe("m1");
  });
});

describe("autoAssign — cuando no cabe", () => {
  it("parte el grupo que no cabe en ninguna mesa y lo avisa nombrándolo", () => {
    const tables = [mesa("m1", 3, "Mesa 1"), mesa("m2", 3, "Mesa 2")];
    const plan = autoAssign(tables, hogar("A", 5));

    expect(plan.seated).toBe(5);
    const aviso = plan.warnings.find(w => w.kind === "grupo-partido");
    expect(aviso?.message).toContain("Familia A");
    expect(aviso?.message).toContain("Mesa 1");
    expect(aviso?.message).toContain("Mesa 2");
  });

  it("avisa de cuánta gente se queda sin sitio", () => {
    const plan = autoAssign([mesa("m1", 2)], hogar("A", 5));
    expect(plan.unseated).toBe(3);
    const aviso = plan.warnings.find(w => w.kind === "sin-sitio");
    expect(aviso?.message).toContain("Faltan 3 sitios");
  });

  it("usa el singular con una sola persona sin sitio", () => {
    const plan = autoAssign([mesa("m1", 2)], hogar("A", 3));
    expect(plan.warnings.find(w => w.kind === "sin-sitio")?.message).toContain("Faltan 1 sitio");
  });

  it("sin mesas no inventa nada y lo dice", () => {
    const plan = autoAssign([], hogar("A", 3));
    expect(plan.assignments).toEqual({});
    expect(plan.warnings[0]?.kind).toBe("sin-mesas");
    expect(plan.unseated).toBe(3);
  });

  it("no parte un grupo que sí cabe entero", () => {
    const tables = [mesa("m1", 2), mesa("m2", 6)];
    const plan = autoAssign(tables, hogar("A", 4));
    expect(reparto(plan.assignments)).toEqual({ m2: 4 });
    expect(plan.warnings).toEqual([]);
  });
});

describe("autoAssign — no rompe la capacidad", () => {
  it("nunca sienta a más gente de la que cabe", () => {
    const tables = [mesa("m1", 4), mesa("m2", 4)];
    const gente = [...hogar("A", 3), ...hogar("B", 3), ...hogar("C", 3)];
    const plan = autoAssign(tables, gente);

    for (const [mesaId, n] of Object.entries(reparto(plan.assignments))) {
      const t = tables.find(x => x.id === mesaId);
      expect(n).toBeLessThanOrEqual(t?.capacity ?? 0);
    }
    expect(plan.seated + plan.unseated).toBe(9);
  });

  it("es determinista: dos corridas dan el mismo plano", () => {
    const tables = [mesa("m1", 5), mesa("m2", 5)];
    const gente = [...hogar("A", 2), ...hogar("B", 3), ...hogar("C", 2)];
    expect(autoAssign(tables, gente).assignments).toEqual(autoAssign(tables, gente).assignments);
  });
});

describe("capacitySummary", () => {
  it("resume capacidad, confirmados y sobrantes", () => {
    const tables = [mesa("m1", 8), mesa("m2", 8)];
    const gente = [...hogar("A", 3, { tableId: "m1" }), ...hogar("B", 2), ...hogar("C", 1, { confirmed: false })];
    expect(capacitySummary(tables, gente)).toEqual({
      capacity: 16, confirmed: 5, assigned: 3, pending: 2, spare: 11,
    });
  });
});

describe("autoAssign — mesas fijadas", () => {
  const fijada = (id: string, capacity: number, name = id): SeatingTable => ({
    ...mesa(id, capacity, name), locked: true,
  });

  it("no sienta a nadie en una mesa fijada", () => {
    const plan = autoAssign([fijada("presidencial", 8), mesa("m1", 8)], hogar("A", 2));
    expect(plan.assignments["A-0"]).toBe("m1");
  });

  it("no mueve a quien ya está en una mesa fijada, ni rehaciendo el plano", () => {
    const tables = [fijada("presidencial", 8, "Presidencial"), mesa("m1", 8)];
    const novios = hogar("novios", 2, { tableId: "presidencial" });
    const plan = autoAssign(tables, [...novios, ...hogar("B", 3)], { respectExisting: false });

    expect(plan.assignments["novios-0"]).toBeUndefined();
    expect(plan.assignments["B-0"]).toBe("m1");
  });

  it("si todas las mesas están fijadas lo dice, en vez de callar", () => {
    const plan = autoAssign([fijada("m1", 8), fijada("m2", 8)], hogar("A", 2));
    expect(plan.warnings[0]?.kind).toBe("sin-mesas");
    expect(plan.warnings[0]?.message).toContain("fijadas");
    expect(plan.assignments).toEqual({});
  });
});

describe("autoAssign — reglas de separación (padres divorciados)", () => {
  const aparte = (a: string, b: string) =>
    [{ kind: "apart" as const, groupAId: a, groupBId: b }];

  it("no sienta juntas a dos invitaciones marcadas como separadas", () => {
    const tables = [mesa("m1", 10), mesa("m2", 10)];
    const gente = [...hogar("padre", 2), ...hogar("madre", 2)];
    const plan = autoAssign(tables, gente, { rules: aparte("padre", "madre") });

    expect(plan.assignments["padre-0"]).not.toBe(plan.assignments["madre-0"]);
    expect(plan.unseated).toBe(0);
  });

  it("sin la regla sí las juntaría (best fit las pondría en la misma)", () => {
    const tables = [mesa("m1", 10), mesa("m2", 10)];
    const gente = [...hogar("padre", 2), ...hogar("madre", 2)];
    const plan = autoAssign(tables, gente);
    expect(plan.assignments["padre-0"]).toBe(plan.assignments["madre-0"]);
  });

  it("la regla funciona en los dos sentidos, se declare como se declare", () => {
    const tables = [mesa("m1", 10), mesa("m2", 10)];
    const gente = [...hogar("madre", 2), ...hogar("padre", 2)];
    const plan = autoAssign(tables, gente, { rules: aparte("padre", "madre") });
    expect(plan.assignments["madre-0"]).not.toBe(plan.assignments["padre-0"]);
  });

  it("respeta a quien ya está sentado al aplicar la regla", () => {
    const tables = [mesa("m1", 10), mesa("m2", 10)];
    const gente = [...hogar("padre", 2, { tableId: "m1" }), ...hogar("madre", 2)];
    const plan = autoAssign(tables, gente, { rules: aparte("padre", "madre") });
    expect(plan.assignments["madre-0"]).toBe("m2");
  });

  it("avisa cuando la regla deja al grupo sin sitio habiendo hueco", () => {
    // Solo una mesa, y el padre ya está en ella: la madre no puede entrar.
    const tables = [mesa("m1", 10)];
    const gente = [...hogar("padre", 2, { tableId: "m1" }), ...hogar("madre", 2)];
    const plan = autoAssign(tables, gente, { rules: aparte("padre", "madre") });

    expect(plan.assignments["madre-0"]).toBeUndefined();
    const aviso = plan.warnings.find(w => w.kind === "regla-incumplida");
    expect(aviso?.message).toContain("Familia madre");
    expect(aviso?.message).toContain("regla de separación");
  });

  it("una regla que no afecta a nadie no cambia el reparto", () => {
    const tables = [mesa("m1", 10)];
    const gente = hogar("A", 3);
    const conRegla = autoAssign(tables, gente, { rules: aparte("x", "y") });
    expect(conRegla.assignments).toEqual(autoAssign(tables, gente).assignments);
  });
});

describe("preferencias de juntar (together)", () => {
  const juntar = (a: string, b: string) =>
    [{ kind: "together" as const, groupAId: a, groupBId: b }];

  it("sienta en la misma mesa a dos invitaciones marcadas como juntas", () => {
    // Sin la regla, best fit las separaría: cada una cabe justa en su mesa.
    const tables = [mesa("m1", 2), mesa("m2", 4)];
    const gente = [...hogar("A", 2), ...hogar("B", 2)];
    const plan = autoAssign(tables, gente, { rules: juntar("A", "B") });
    expect(plan.assignments["A-0"]).toBe(plan.assignments["B-0"]);
  });

  it("encadena: si A va con B y B con C, los tres acaban juntos", () => {
    const tables = [mesa("m1", 3), mesa("m2", 9)];
    const gente = [...hogar("A", 2), ...hogar("B", 2), ...hogar("C", 2)];
    const plan = autoAssign(tables, gente, {
      rules: [
        { kind: "together", groupAId: "A", groupBId: "B" },
        { kind: "together", groupAId: "B", groupBId: "C" },
      ],
    });
    const mesas = new Set(["A-0", "B-0", "C-0"].map(id => plan.assignments[id]));
    expect(mesas.size).toBe(1);
  });

  it("una separación gana sobre el bloque juntado: AB no puede ir con C", () => {
    const tables = [mesa("m1", 10), mesa("m2", 10)];
    const gente = [...hogar("A", 2), ...hogar("B", 2), ...hogar("C", 2)];
    const plan = autoAssign(tables, gente, {
      rules: [
        { kind: "together", groupAId: "A", groupBId: "B" },
        { kind: "apart", groupAId: "B", groupBId: "C" },
      ],
    });
    expect(plan.assignments["A-0"]).toBe(plan.assignments["B-0"]);
    expect(plan.assignments["C-0"]).not.toBe(plan.assignments["A-0"]);
  });
});

describe("findViolations — lo que el reparto ACTUAL incumple", () => {
  const t = [mesa("m1", 10, "Mesa 1"), mesa("m2", 10, "Mesa 2")];

  it("detecta dos separadas compartiendo mesa y nombra la mesa", () => {
    const gente = [...hogar("A", 2, { tableId: "m1" }), ...hogar("B", 2, { tableId: "m1" })];
    const v = findViolations(t, gente, [{ kind: "apart", groupAId: "A", groupBId: "B" }]);
    expect(v).toHaveLength(1);
    expect(v[0]?.tableName).toBe("Mesa 1");
    expect(v[0]?.message).toContain("Mesa 1");
    expect(v[0]?.message).toContain("separadas");
  });

  it("no señala nada si están en mesas distintas", () => {
    const gente = [...hogar("A", 2, { tableId: "m1" }), ...hogar("B", 2, { tableId: "m2" })];
    expect(findViolations(t, gente, [{ kind: "apart", groupAId: "A", groupBId: "B" }])).toEqual([]);
  });

  it("no señala nada mientras alguno siga sin sentar", () => {
    const gente = [...hogar("A", 2, { tableId: "m1" }), ...hogar("B", 2)];
    expect(findViolations(t, gente, [{ kind: "apart", groupAId: "A", groupBId: "B" }])).toEqual([]);
  });

  it("detecta una preferencia de juntar que no se cumple", () => {
    const gente = [...hogar("A", 2, { tableId: "m1" }), ...hogar("B", 2, { tableId: "m2" })];
    const v = findViolations(t, gente, [{ kind: "together", groupAId: "A", groupBId: "B" }]);
    expect(v[0]?.kind).toBe("together");
    expect(v[0]?.message).toContain("deberían compartir mesa");
  });

  it("ignora a quien no ha confirmado", () => {
    const gente = [
      ...hogar("A", 2, { tableId: "m1", confirmed: false }),
      ...hogar("B", 2, { tableId: "m1" }),
    ];
    expect(findViolations(t, gente, [{ kind: "apart", groupAId: "A", groupBId: "B" }])).toEqual([]);
  });
});
