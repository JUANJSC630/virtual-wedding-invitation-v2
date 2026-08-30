import { describe, expect, it } from "vitest";

import {
  RsvpQuestion,
  missingRequired,
  normalizeAnswer,
  normalizeAnswers,
  sanitizeQuestions,
  tallyAnswers,
} from "./rsvpQuestions";

const menu: RsvpQuestion = {
  id: "menu", type: "single", label: "Menú",
  options: ["Carne", "Pescado", "Vegetariano"], required: true,
};
const dieta: RsvpQuestion = {
  id: "dieta", type: "multi", label: "Restricciones",
  options: ["Sin gluten", "Sin lactosa"], required: false,
};
const cancion: RsvpQuestion = {
  id: "cancion", type: "text", label: "Canción", options: [], required: false,
};

describe("sanitizeQuestions", () => {
  it("acepta una definición válida de los tres tipos", () => {
    expect(sanitizeQuestions([menu, dieta, cancion])).toHaveLength(3);
  });

  it("descarta lo que no es un array", () => {
    expect(sanitizeQuestions(null)).toEqual([]);
    expect(sanitizeQuestions({ id: "x" })).toEqual([]);
    expect(sanitizeQuestions("nope")).toEqual([]);
  });

  it("descarta preguntas sin id o sin etiqueta", () => {
    expect(sanitizeQuestions([{ id: "", label: "Sin id", type: "text" }])).toEqual([]);
    expect(sanitizeQuestions([{ id: "a", label: "  ", type: "text" }])).toEqual([]);
  });

  it("descarta preguntas de elección sin opciones: no tendrían nada que mostrar", () => {
    expect(sanitizeQuestions([{ id: "a", label: "Menú", type: "single", options: [] }])).toEqual([]);
    expect(sanitizeQuestions([{ id: "a", label: "Dieta", type: "multi" }])).toEqual([]);
  });

  it("conserva una pregunta de texto aunque no tenga opciones", () => {
    const [q] = sanitizeQuestions([{ id: "a", label: "Canción", type: "text" }]);
    expect(q?.type).toBe("text");
    expect(q?.options).toEqual([]);
  });

  it("cae a `single` ante un tipo desconocido", () => {
    const [q] = sanitizeQuestions([{ id: "a", label: "X", type: "rango", options: ["1"] }]);
    expect(q?.type).toBe("single");
  });

  it("descarta ids duplicados y se queda con el primero", () => {
    const out = sanitizeQuestions([
      { id: "a", label: "Primera", type: "text" },
      { id: "a", label: "Segunda", type: "text" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.label).toBe("Primera");
  });

  it("limpia espacios y opciones vacías", () => {
    const [q] = sanitizeQuestions([
      { id: " a ", label: "  Menú  ", type: "single", options: [" Carne ", "", "   ", "Pez"] },
    ]);
    expect(q?.id).toBe("a");
    expect(q?.label).toBe("Menú");
    expect(q?.options).toEqual(["Carne", "Pez"]);
  });

  it("required es false salvo que sea exactamente true", () => {
    const [a] = sanitizeQuestions([{ id: "a", label: "X", type: "text", required: "sí" }]);
    const [b] = sanitizeQuestions([{ id: "b", label: "X", type: "text", required: true }]);
    expect(a?.required).toBe(false);
    expect(b?.required).toBe(true);
  });
});

describe("normalizeAnswer", () => {
  it("acepta una opción válida en `single`", () => {
    expect(normalizeAnswer(menu, "Pescado")).toBe("Pescado");
  });

  it("rechaza una opción inventada en `single`", () => {
    expect(normalizeAnswer(menu, "Langosta")).toBeNull();
  });

  it("filtra las opciones inventadas en `multi` y deduplica", () => {
    expect(normalizeAnswer(dieta, ["Sin gluten", "Caviar", "Sin gluten"])).toEqual(["Sin gluten"]);
  });

  it("devuelve null cuando `multi` se queda sin opciones válidas", () => {
    expect(normalizeAnswer(dieta, ["Caviar"])).toBeNull();
    expect(normalizeAnswer(dieta, [])).toBeNull();
  });

  it("recorta el texto libre y descarta el que queda vacío", () => {
    expect(normalizeAnswer(cancion, "  Bohemian Rhapsody  ")).toBe("Bohemian Rhapsody");
    expect(normalizeAnswer(cancion, "   ")).toBeNull();
  });

  it("ignora tipos de dato que no corresponden", () => {
    expect(normalizeAnswer(menu, 42)).toBeNull();
    expect(normalizeAnswer(cancion, { a: 1 })).toBeNull();
    expect(normalizeAnswer(dieta, "Sin gluten")).toBeNull();
  });
});

describe("normalizeAnswers", () => {
  it("se queda solo con las preguntas que existen hoy", () => {
    const out = normalizeAnswers([menu, cancion], {
      menu: "Carne",
      cancion: "Algo",
      borrada: "respuesta de una pregunta ya eliminada",
    });
    expect(out).toEqual({ menu: "Carne", cancion: "Algo" });
  });

  it("tolera respuestas ausentes o malformadas", () => {
    expect(normalizeAnswers([menu], null)).toEqual({});
    expect(normalizeAnswers([menu], [])).toEqual({});
    expect(normalizeAnswers([menu], { menu: "Inventado" })).toEqual({});
  });
});

describe("missingRequired", () => {
  it("señala la obligatoria sin responder", () => {
    expect(missingRequired([menu, cancion], { cancion: "x" })).toEqual(["menu"]);
  });

  it("no señala nada cuando la obligatoria está respondida", () => {
    expect(missingRequired([menu, cancion], { menu: "Carne" })).toEqual([]);
  });

  it("una lista vacía cuenta como sin responder", () => {
    const obligatoria: RsvpQuestion = { ...dieta, required: true };
    expect(missingRequired([obligatoria], { dieta: [] })).toEqual(["dieta"]);
  });

  it("ignora las opcionales", () => {
    expect(missingRequired([cancion, dieta], {})).toEqual([]);
  });
});

describe("tallyAnswers", () => {
  it("cuenta los platos para el catering", () => {
    const all = [{ menu: "Carne" }, { menu: "Carne" }, { menu: "Vegetariano" }];
    expect(tallyAnswers(menu, all)).toEqual({ Carne: 2, Pescado: 0, Vegetariano: 1 });
  });

  it("cuenta cada opción marcada en `multi`", () => {
    const all = [{ dieta: ["Sin gluten", "Sin lactosa"] }, { dieta: ["Sin gluten"] }];
    expect(tallyAnswers(dieta, all)).toEqual({ "Sin gluten": 2, "Sin lactosa": 1 });
  });

  it("devuelve todas las opciones a cero si nadie respondió", () => {
    expect(tallyAnswers(menu, [])).toEqual({ Carne: 0, Pescado: 0, Vegetariano: 0 });
  });

  it("ignora respuestas de opciones que ya no existen", () => {
    expect(tallyAnswers(menu, [{ menu: "Langosta" }])).toEqual({ Carne: 0, Pescado: 0, Vegetariano: 0 });
  });
});
