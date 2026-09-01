import { describe, expect, it } from "vitest";

/**
 * La normalización que usa el Combobox para buscar. Se prueba aparte porque es
 * la parte con lógica: en una lista de invitados en español, escribir "jose"
 * tiene que encontrar a "José".
 */
const normalizar = (texto: string) =>
  texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Mismo orden que aplica el componente: primero lo que empieza por la búsqueda. */
function filtrar(options: { label: string; hint?: string }[], busqueda: string) {
  const q = normalizar(busqueda.trim());
  if (!q) return options;
  const empieza: typeof options = [];
  const contiene: typeof options = [];
  for (const o of options) {
    const texto = normalizar(`${o.label} ${o.hint ?? ""}`);
    if (normalizar(o.label).startsWith(q)) empieza.push(o);
    else if (texto.includes(q)) contiene.push(o);
  }
  return [...empieza, ...contiene];
}

const invitados = [
  { label: "José Muñoz" },
  { label: "Ana Pérez" },
  { label: "Juan Andrés" },
  { label: "María Ángeles" },
  { label: "Mesa 3", hint: "4 libres" },
];

describe("búsqueda del combobox", () => {
  it("encuentra con acentos escribiendo sin ellos", () => {
    expect(filtrar(invitados, "jose")[0]?.label).toBe("José Muñoz");
    expect(filtrar(invitados, "maria")[0]?.label).toBe("María Ángeles");
  });

  it("encuentra la ñ escrita como n", () => {
    expect(filtrar(invitados, "munoz").map(o => o.label)).toContain("José Muñoz");
  });

  it("no distingue mayúsculas", () => {
    expect(filtrar(invitados, "ANA")[0]?.label).toBe("Ana Pérez");
  });

  it("prioriza lo que EMPIEZA por la búsqueda", () => {
    // "an" está en "Ana" (al principio) y en "Juan Andrés" (en medio).
    const r = filtrar(invitados, "an");
    expect(r[0]?.label).toBe("Ana Pérez");
    expect(r.map(o => o.label)).toContain("Juan Andrés");
  });

  it("busca también en la línea secundaria", () => {
    expect(filtrar(invitados, "libres").map(o => o.label)).toContain("Mesa 3");
  });

  it("sin búsqueda devuelve todo, en su orden", () => {
    expect(filtrar(invitados, "   ")).toHaveLength(invitados.length);
  });

  it("sin coincidencias devuelve vacío", () => {
    expect(filtrar(invitados, "zzzz")).toEqual([]);
  });
});
