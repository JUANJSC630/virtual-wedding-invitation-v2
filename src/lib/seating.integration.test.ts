import { describe, expect, it } from "vitest";

import { SeatingPerson, SeatingTable, autoAssign, capacitySummary } from "./seating";

/**
 * Caso realista tomado del escenario que se montó contra la base:
 * 4 hogares (4+3+2+1 = 10 personas) y 3 mesas (4+4+2 = 10 sitios exactos).
 * Es el caso apretado: solo hay una forma de que nadie se parta.
 */
const tables: SeatingTable[] = [
  { id: "m1", name: "Mesa 1", shape: "round", capacity: 4, x: 0, y: 0, rotation: 0 },
  { id: "m2", name: "Mesa 2", shape: "round", capacity: 4, x: 0, y: 0, rotation: 0 },
  { id: "m3", name: "Mesa 3", shape: "round", capacity: 2, x: 0, y: 0, rotation: 0 },
];

const familias: [string, number][] = [["Torres", 4], ["Ruiz", 3], ["Gomez", 2], ["Solo", 1]];
const people: SeatingPerson[] = familias.flatMap(([apellido, n]) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${apellido}-${i}`, name: `${apellido} ${i}`,
    groupId: apellido, groupName: `Familia ${apellido}`, confirmed: true,
  }))
);

describe("caso real: capacidad justa", () => {
  const plan = autoAssign(tables, people);
  const porMesa = (id: string) => Object.values(plan.assignments).filter(t => t === id).length;

  it("sienta a las 10 personas sin dejar a nadie fuera", () => {
    expect(plan.seated).toBe(10);
    expect(plan.unseated).toBe(0);
  });

  it("no parte ninguna familia", () => {
    expect(plan.warnings.filter(w => w.kind === "grupo-partido")).toEqual([]);
    for (const [apellido, n] of familias) {
      const mesas = new Set(
        Array.from({ length: n }, (_, i) => plan.assignments[`${apellido}-${i}`])
      );
      expect(mesas.size).toBe(1);
    }
  });

  it("llena las tres mesas exactamente hasta su capacidad", () => {
    expect(porMesa("m1")).toBe(4);
    expect(porMesa("m2")).toBe(4);
    expect(porMesa("m3")).toBe(2);
  });

  it("Torres (4) va a una mesa de 4 y Gomez (2) a la de 2", () => {
    expect(["m1", "m2"]).toContain(plan.assignments["Torres-0"]);
    expect(plan.assignments["Gomez-0"]).toBe("m3");
  });

  it("el resumen refleja la capacidad justa", () => {
    expect(capacitySummary(tables, people)).toEqual({
      capacity: 10, confirmed: 10, assigned: 0, pending: 10, spare: 0,
    });
  });
});

describe("caso real: alguien cancela y su sitio se libera", () => {
  it("una baja deja hueco sin tocar al resto", () => {
    const conBaja = people.map(p => (p.id === "Torres-3" ? { ...p, confirmed: false } : p));
    const plan = autoAssign(tables, conBaja);
    expect(plan.seated).toBe(9);
    expect(plan.unseated).toBe(0);
    expect(plan.warnings).toEqual([]);
  });
});
