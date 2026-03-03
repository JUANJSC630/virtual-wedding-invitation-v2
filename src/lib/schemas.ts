import { z } from "zod";

// ─── Guest form (create + edit) ───────────────────────────────────────────────

export const guestFormSchema = z.object({
  code: z
    .string()
    .min(2, "El código debe tener al menos 2 caracteres")
    .max(20, "El código no puede tener más de 20 caracteres")
    .regex(/^[A-Z0-9_-]+$/, "Solo letras mayúsculas, números, guión y guión bajo"),
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede tener más de 100 caracteres"),
  email: z
    .string()
    .email("Email inválido")
    .or(z.literal(""))
    .optional(),
  phone: z
    .string()
    .regex(/^[+\d\s()-]{7,20}$/, "Teléfono inválido (7-20 dígitos)")
    .or(z.literal(""))
    .optional(),
  maxGuests: z
    .number({ invalid_type_error: "Debe ser un número" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 cupo")
    .max(20, "Máximo 20 cupos"),
  notes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type GuestFormSchema = z.infer<typeof guestFormSchema>;

// ─── Event basic fields (slug + required) ─────────────────────────────────────

export const eventBasicSchema = z.object({
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(60, "El slug no puede tener más de 60 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (sin espacios ni guión al inicio/fin)"),
  groomName: z.string().min(2, "Nombre del novio requerido"),
  brideName: z.string().min(2, "Nombre de la novia requerido"),
  eventDate: z.string().min(1, "La fecha del evento es requerida"),
});

export type EventBasicSchema = z.infer<typeof eventBasicSchema>;

// ─── Shared helper — extract Zod field errors into a flat map ────────────────

export function extractZodErrors(err: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (!map[key]) map[key] = issue.message;
  }
  return map;
}
