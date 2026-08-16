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
// `base` permite reusar el mismo data-layer desde el panel cliente
// (`/api/admin`) y desde el panel master por-evento (`/api/master/events/:id`),
// que exponen las mismas sub-rutas (/guests, /companions, /stats, /analytics).

export const ADMIN_BASE = "/api/admin";

export const getAllGuests = async (base: string = ADMIN_BASE): Promise<Guest[]> => {
  const response = await fetch(`${base}/guests`, { credentials: "include" });
  if (!response.ok) throw new Error("Error al obtener invitados");
  return await response.json();
};

export const createGuest = async (base: string, guest: CreateGuestInput): Promise<Guest> => {
  const response = await fetch(`${base}/guests`, {
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

export const updateGuest = async (base: string, id: string, updates: UpdateGuestInput): Promise<Guest> => {
  const response = await fetch(`${base}/guests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error("Error al actualizar invitado");
  return await response.json();
};

export const deleteGuest = async (base: string, id: string): Promise<void> => {
  const response = await fetch(`${base}/guests/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Error al eliminar invitado");
};

export const createCompanion = async (base: string, companion: CreateCompanionInput) => {
  const response = await fetch(`${base}/companions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(companion),
  });

  if (!response.ok) throw new Error("Error al crear acompañante");
  return await response.json();
};

export const updateCompanion = async (base: string, id: string, updates: { confirmed: boolean }) => {
  const response = await fetch(`${base}/companions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error("Error al actualizar acompañante");
  return await response.json();
};

export const deleteCompanion = async (base: string, id: string): Promise<void> => {
  const response = await fetch(`${base}/companions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error("Error al eliminar acompañante");
};

export const getGuestStats = async (base: string = ADMIN_BASE) => {
  const response = await fetch(`${base}/stats`, { credentials: "include" });
  if (!response.ok) throw new Error("Error al obtener estadísticas");
  return await response.json();
};

export const getAnalytics = async (base: string = ADMIN_BASE) => {
  const response = await fetch(`${base}/analytics`, { credentials: "include" });
  if (!response.ok) throw new Error("Error al obtener analytics");
  return await response.json();
};
