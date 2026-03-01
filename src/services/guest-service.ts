import {
  CreateCompanionInput,
  CreateGuestInput,
  Guest,
  GuestValidationResult,
  RSVPData,
  UpdateGuestInput,
} from "@/types";

const API_BASE = "/api";

// ─── RUTAS PÚBLICAS (invitados) ───────────────────────────────────────────────

export const validateGuestCode = async (
  { code, eventSlug }: { code: string; eventSlug: string }
): Promise<GuestValidationResult> => {
  try {
    const response = await fetch(`${API_BASE}/guests/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, eventSlug }),
    });
    if (!response.ok) throw new Error("Error al validar el código");
    return await response.json();
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

export const confirmRSVP = async (rsvpData: RSVPData): Promise<Guest> => {
  const response = await fetch(`${API_BASE}/guests/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rsvpData),
  });

  if (!response.ok) throw new Error("Error al confirmar asistencia");
  return await response.json();
};

// ─── RUTAS DE ADMINISTRACIÓN (con cookie de sesión) ──────────────────────────

export const getAllGuests = async (): Promise<Guest[]> => {
  const response = await fetch(`${API_BASE}/admin/guests`, { credentials: "include" });
  if (!response.ok) throw new Error("Error al obtener invitados");
  return await response.json();
};

export const createGuest = async (guest: CreateGuestInput): Promise<Guest> => {
  const response = await fetch(`${API_BASE}/admin/guests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(guest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear invitado");
  }
  return await response.json();
};

export const updateGuest = async (id: string, updates: UpdateGuestInput): Promise<Guest> => {
  const response = await fetch(`${API_BASE}/admin/guests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error("Error al actualizar invitado");
  return await response.json();
};

export const deleteGuest = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/admin/guests/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Error al eliminar invitado");
};

export const createCompanion = async (companion: CreateCompanionInput) => {
  const response = await fetch(`${API_BASE}/admin/companions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(companion),
  });

  if (!response.ok) throw new Error("Error al crear acompañante");
  return await response.json();
};

export const updateCompanion = async (id: string, updates: { confirmed: boolean }) => {
  const response = await fetch(`${API_BASE}/admin/companions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error("Error al actualizar acompañante");
  return await response.json();
};

export const deleteCompanion = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/admin/companions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Error al eliminar acompañante");
};

export const getGuestStats = async () => {
  const response = await fetch(`${API_BASE}/admin/stats`, { credentials: "include" });
  if (!response.ok) throw new Error("Error al obtener estadísticas");
  return await response.json();
};

export const getAnalytics = async () => {
  const response = await fetch(`${API_BASE}/admin/analytics`, { credentials: "include" });
  if (!response.ok) throw new Error("Error al obtener analytics");
  return await response.json();
};
