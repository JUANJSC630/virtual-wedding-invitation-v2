import { describe, expect, it } from "vitest";

import { getOccasionDefaults } from "./occasions";

describe("getOccasionDefaults", () => {
  it("boda mantiene el wording original", () => {
    expect(getOccasionDefaults("wedding").announcementText).toBe("¡NOS CASAMOS!");
    expect(getOccasionDefaults("wedding").shareTitle).toBe(" — Te invitamos a nuestra boda");
  });

  it("cada ocasión tiene su propio anuncio", () => {
    expect(getOccasionDefaults("quinceanera").announcementText).toBe("¡MIS XV AÑOS!");
    expect(getOccasionDefaults("baptism").announcementText).toBe("¡ME BAUTIZO!");
    expect(getOccasionDefaults("birthday").announcementText).toBe("¡ESTOY DE CUMPLEAÑOS!");
  });

  it("cae a 'other' ante un tipo desconocido", () => {
    // @ts-expect-error probando entrada fuera del union a propósito
    expect(getOccasionDefaults("inexistente").announcementText).toBe("TE INVITAMOS");
  });

  it("boda conserva el versículo y los roles familiares originales", () => {
    const w = getOccasionDefaults("wedding");
    expect(w.verse.reference).toBe("Proverbios 18:22");
    expect(w.family.parentsPrimary).toBe("Padres de la novia");
    expect(w.family.attendants2).toBe("Caballeros de honor");
  });

  it("cumpleaños y corporativo no traen versículo (se oculta)", () => {
    expect(getOccasionDefaults("birthday").verse.text).toBe("");
    expect(getOccasionDefaults("corporate").verse.text).toBe("");
  });

  it("XV usa roles propios (chambelanes) y sin 2ª columna de padres", () => {
    const q = getOccasionDefaults("quinceanera");
    expect(q.family.attendants2).toBe("Chambelanes");
    expect(q.family.parentsSecondary).toBe("");
  });

  it("ningún mensaje de confirmación no-boda menciona 'boda'", () => {
    (["quinceanera", "baptism", "birthday", "corporate"] as const).forEach(t => {
      expect(getOccasionDefaults(t).confirmedMessage.toLowerCase()).not.toContain("boda");
    });
  });
});
