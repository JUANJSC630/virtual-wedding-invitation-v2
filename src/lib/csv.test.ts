import { describe, expect, it } from "vitest";

import { toCsv } from "./csv";

describe("toCsv", () => {
  it("entrecomilla todas las celdas", () => {
    expect(toCsv([["a", "b"]])).toBe('"a","b"');
  });

  it("dobla las comillas internas", () => {
    expect(toCsv([['dijo "hola"']])).toBe('"dijo ""hola"""');
  });

  it("no rompe la fila cuando la celda lleva una coma", () => {
    const csv = toCsv([["Pérez, Ana", "2"]]);
    expect(csv).toBe('"Pérez, Ana","2"');
    expect(csv.split("\n")).toHaveLength(1);
  });

  it("conserva los saltos de línea dentro de una celda entrecomillada", () => {
    expect(toCsv([["línea1\nlínea2"]])).toBe('"línea1\nlínea2"');
  });

  it("convierte null y undefined en celda vacía", () => {
    expect(toCsv([[null, undefined, 0]])).toBe('"","","0"');
  });

  it("separa las filas con salto de línea", () => {
    expect(toCsv([["a"], ["b"]]).split("\n")).toHaveLength(2);
  });

  it("devuelve cadena vacía sin filas", () => {
    expect(toCsv([])).toBe("");
  });
});
