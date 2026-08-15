import { describe, expect, it } from "vitest";

import { eventBasicSchema, extractZodErrors, guestFormSchema } from "./schemas";

describe("guestFormSchema", () => {
  const valid = { code: "ABC123", name: "Juan García", maxGuests: 2 };

  it("acepta un invitado mínimo válido", () => {
    expect(guestFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza códigos con minúsculas o espacios", () => {
    expect(guestFormSchema.safeParse({ ...valid, code: "abc 123" }).success).toBe(false);
  });

  it("rechaza código demasiado corto", () => {
    expect(guestFormSchema.safeParse({ ...valid, code: "A" }).success).toBe(false);
  });

  it("acepta email vacío pero rechaza email malformado", () => {
    expect(guestFormSchema.safeParse({ ...valid, email: "" }).success).toBe(true);
    expect(guestFormSchema.safeParse({ ...valid, email: "no-es-email" }).success).toBe(false);
  });

  it("valida el rango de cupos (1-20)", () => {
    expect(guestFormSchema.safeParse({ ...valid, maxGuests: 0 }).success).toBe(false);
    expect(guestFormSchema.safeParse({ ...valid, maxGuests: 21 }).success).toBe(false);
    expect(guestFormSchema.safeParse({ ...valid, maxGuests: 1.5 }).success).toBe(false);
  });

  it("acepta teléfono con formato internacional y rechaza letras", () => {
    expect(guestFormSchema.safeParse({ ...valid, phone: "+57 300 1234567" }).success).toBe(true);
    expect(guestFormSchema.safeParse({ ...valid, phone: "abcdef" }).success).toBe(false);
  });
});

describe("eventBasicSchema", () => {
  const valid = { slug: "jimena-juan", groomName: "Juan", brideName: "Jimena", eventDate: "2025-11-22" };

  it("acepta un evento válido", () => {
    expect(eventBasicSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza slug con mayúsculas, espacios o guión al borde", () => {
    expect(eventBasicSchema.safeParse({ ...valid, slug: "Jimena Juan" }).success).toBe(false);
    expect(eventBasicSchema.safeParse({ ...valid, slug: "-jimena" }).success).toBe(false);
    expect(eventBasicSchema.safeParse({ ...valid, slug: "MAYUS" }).success).toBe(false);
  });

  it("exige fecha del evento no vacía", () => {
    expect(eventBasicSchema.safeParse({ ...valid, eventDate: "" }).success).toBe(false);
  });
});

describe("extractZodErrors", () => {
  it("aplana los errores a un mapa campo → mensaje", () => {
    const res = guestFormSchema.safeParse({ code: "a", name: "x", maxGuests: 99 });
    expect(res.success).toBe(false);
    if (!res.success) {
      const map = extractZodErrors(res.error);
      expect(map.code).toBeTruthy();
      expect(map.name).toBeTruthy();
      expect(map.maxGuests).toBeTruthy();
    }
  });
});
