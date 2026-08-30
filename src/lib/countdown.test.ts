import { describe, expect, it } from "vitest";

import { getTimeLeft } from "./countdown";

const at = (iso: string) => new Date(iso);

describe("getTimeLeft", () => {
  it("descompone el tiempo restante en días, horas, minutos y segundos", () => {
    const now = at("2026-01-01T00:00:00Z");
    const event = at("2026-01-03T04:05:06Z");
    expect(getTimeLeft(event, now)).toEqual({ days: 2, hours: 4, minutes: 5, seconds: 6 });
  });

  it("devuelve todo en cero cuando la fecha ya pasó", () => {
    const now = at("2026-06-01T12:00:00Z");
    const event = at("2026-05-31T12:00:00Z");
    expect(getTimeLeft(event, now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("devuelve todo en cero justo en el instante del evento", () => {
    const moment = at("2026-06-01T12:00:00Z");
    expect(getTimeLeft(moment, moment)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });

  it("no produce valores negativos un segundo después del evento", () => {
    const event = at("2026-06-01T12:00:00Z");
    const now = at("2026-06-01T12:00:01Z");
    const left = getTimeLeft(event, now);
    for (const unit of Object.values(left)) expect(unit).toBeGreaterThanOrEqual(0);
  });

  it("mantiene las horas por debajo de 24 y minutos/segundos por debajo de 60", () => {
    const now = at("2026-01-01T00:00:00Z");
    const event = at("2026-03-15T23:59:59Z");
    const { hours, minutes, seconds } = getTimeLeft(event, now);
    expect(hours).toBeLessThan(24);
    expect(minutes).toBeLessThan(60);
    expect(seconds).toBeLessThan(60);
  });

  it("cuenta un día completo como 1 día y 0 horas", () => {
    const now = at("2026-01-01T00:00:00Z");
    const event = at("2026-01-02T00:00:00Z");
    expect(getTimeLeft(event, now)).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0 });
  });

  it("usa la hora actual cuando no se pasa `now`", () => {
    // 25 h en el futuro: el resultado es 1 día sin importar el milisegundo
    // exacto en que se evalúe (a diferencia de un offset justo en el límite).
    const event = new Date(Date.now() + 25 * 60 * 60 * 1000);
    expect(getTimeLeft(event).days).toBe(1);
  });

  it("una fecha pasada sin `now` explícito también da cero", () => {
    const event = new Date(Date.now() - 1000);
    expect(getTimeLeft(event)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});
