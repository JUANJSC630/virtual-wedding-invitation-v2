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
});
