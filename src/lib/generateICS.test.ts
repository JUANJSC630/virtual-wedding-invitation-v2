import { describe, expect, it } from "vitest";

import { parseTime } from "./generateICS";

describe("parseTime", () => {
  it("parsea formato 12h AM/PM", () => {
    expect(parseTime("6:00 PM")).toEqual({ hours: 18, minutes: 0 });
    expect(parseTime("8:30 PM")).toEqual({ hours: 20, minutes: 30 });
    expect(parseTime("9:15 AM")).toEqual({ hours: 9, minutes: 15 });
  });

  it("maneja los bordes de medianoche y mediodía", () => {
    expect(parseTime("12:00 AM")).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime("12:00 PM")).toEqual({ hours: 12, minutes: 0 });
  });

  it("parsea formato 24h", () => {
    expect(parseTime("18:00")).toEqual({ hours: 18, minutes: 0 });
    expect(parseTime("07:05")).toEqual({ hours: 7, minutes: 5 });
  });

  it("cae al fallback (18:00) ante entradas vacías o inválidas", () => {
    expect(parseTime("")).toEqual({ hours: 18, minutes: 0 });
    expect(parseTime("no es hora")).toEqual({ hours: 18, minutes: 0 });
  });

  it("tolera espacios alrededor del AM/PM", () => {
    expect(parseTime("  7:45 pm ")).toEqual({ hours: 19, minutes: 45 });
  });
});
