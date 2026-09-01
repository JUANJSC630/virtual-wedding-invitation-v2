import { SeatingTable } from "@/lib/seating";

/**
 * Mesas y asignación. Igual que `guest-service`, recibe el `base` de la API para
 * poder servir al panel master (`/api/master/events/:id`) sin duplicar código.
 */

/** Una mesa tal y como la devuelve la API, con su gente sentada. */
export interface TableWithPeople extends SeatingTable {
  attendees: { id: string; name: string; isPrimary: boolean; guestId: string }[];
}

export type TableInput = Partial<Omit<SeatingTable, "id">>;

/** Regla de reparto entre dos invitaciones. */
export interface SeatingRuleRow {
  id: string;
  kind: "apart" | "together";
  groupAId: string;
  groupBId: string;
}

export const getTables = async (base: string): Promise<TableWithPeople[]> => {
  const res = await fetch(`${base}/tables`, { credentials: "include" });
  if (!res.ok) throw new Error("Error al obtener las mesas");
  return await res.json();
};

export const createTable = async (base: string, table: TableInput): Promise<TableWithPeople> => {
  const res = await fetch(`${base}/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(table),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear la mesa");
  return await res.json();
};

export const updateTable = async (
  base: string,
  id: string,
  updates: TableInput
): Promise<TableWithPeople> => {
  const res = await fetch(`${base}/tables/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error al actualizar la mesa");
  return await res.json();
};

export const deleteTable = async (base: string, id: string): Promise<void> => {
  const res = await fetch(`${base}/tables/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Error al eliminar la mesa");
};

/** Aplica un reparto completo: personaId → mesaId, o null para levantarla. */
export const applySeating = async (
  base: string,
  assignments: Record<string, string | null>
): Promise<{ applied: number; ignored: number }> => {
  const res = await fetch(`${base}/seating`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assignments }),
  });
  if (!res.ok) throw new Error("Error al guardar la distribución");
  return await res.json();
};

export const getSeatingRules = async (base: string): Promise<SeatingRuleRow[]> => {
  const res = await fetch(`${base}/seating-rules`, { credentials: "include" });
  if (!res.ok) throw new Error("Error al obtener las reglas");
  return await res.json();
};

export const createSeatingRule = async (
  base: string,
  rule: { kind: "apart" | "together"; groupAId: string; groupBId: string }
): Promise<SeatingRuleRow> => {
  const res = await fetch(`${base}/seating-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear la regla");
  return await res.json();
};

export const deleteSeatingRule = async (base: string, id: string): Promise<void> => {
  const res = await fetch(`${base}/seating-rules/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Error al eliminar la regla");
};
