import { describe, expect, it } from "vitest";

import type { Event } from "@/types";

import {
  getEventType,
  getHonorees,
  getHonoreesInitials,
  getHonoreesNames,
  isCoupleEvent,
} from "./honorees";

// Helper: construye un Event parcial suficiente para los tests.
const ev = (partial: Partial<Event>): Event => ({
  id: "e", slug: "s", groomName: "", brideName: "", eventDate: "2025-11-22",
  config: {} as Event["config"], assets: {}, theme: {}, isActive: true,
  createdAt: "", updatedAt: "", ...partial,
});

describe("getEventType", () => {
  it("default a 'wedding' cuando falta (legacy)", () => {
    expect(getEventType(ev({}))).toBe("wedding");
    expect(getEventType(null)).toBe("wedding");
  });
  it("respeta el tipo cuando está presente", () => {
    expect(getEventType(ev({ eventType: "quinceanera" }))).toBe("quinceanera");
  });
});

describe("getHonorees — fallback legacy", () => {
  it("deriva novia y novio de los campos legacy, en orden novia → novio", () => {
    const res = getHonorees(ev({ brideName: "Jimena", groomName: "Juan" }));
    expect(res).toEqual([
      { role: "bride", label: "Novia", name: "Jimena" },
      { role: "groom", label: "Novio", name: "Juan" },
    ]);
  });
  it("omite campos legacy vacíos", () => {
    expect(getHonorees(ev({ brideName: "Laura", groomName: "" }))).toHaveLength(1);
  });
});

describe("getHonorees — honorees explícito", () => {
  it("usa event.honorees cuando viene poblado (ignora legacy)", () => {
    const res = getHonorees(
      ev({
        brideName: "X", groomName: "Y",
        honorees: [{ role: "celebrant", label: "Quinceañera", name: "Laura Sofía" }],
      })
    );
    expect(res).toEqual([{ role: "celebrant", label: "Quinceañera", name: "Laura Sofía" }]);
  });
  it("filtra honorees con nombre vacío", () => {
    const res = getHonorees(
      ev({ honorees: [{ role: "baby", label: "Bautizado/a", name: "  " }] })
    );
    expect(res).toHaveLength(0);
  });
});

describe("getHonoreesNames", () => {
  it("une con '&' por defecto (boda)", () => {
    expect(getHonoreesNames(ev({ brideName: "Jimena", groomName: "Juan" }))).toBe("Jimena & Juan");
  });
  it("un solo protagonista devuelve solo su nombre (XV)", () => {
    expect(
      getHonoreesNames(ev({ honorees: [{ role: "celebrant", label: "Quinceañera", name: "Laura" }] }))
    ).toBe("Laura");
  });
  it("acepta separador custom", () => {
    expect(getHonoreesNames(ev({ brideName: "A", groomName: "B" }), " y ")).toBe("A y B");
  });
});

describe("getHonoreesInitials", () => {
  it("devuelve la inicial de cada protagonista en mayúscula", () => {
    expect(getHonoreesInitials(ev({ brideName: "jimena", groomName: "juan" }))).toEqual(["J", "J"]);
  });
});

describe("isCoupleEvent", () => {
  it("true para boda (2), false para XV (1)", () => {
    expect(isCoupleEvent(ev({ brideName: "A", groomName: "B" }))).toBe(true);
    expect(isCoupleEvent(ev({ honorees: [{ role: "celebrant", label: "Q", name: "L" }] }))).toBe(false);
  });
});
