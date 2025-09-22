import {
  CreateCompanionInput,
  CreateGuestInput,
  Guest,
  GuestValidationResult,
  RSVPData,
  UpdateGuestInput,
} from "@/types";

const API_BASE = "/api";

// Validar código de invitado
export const validateGuestCode = async (code: string): Promise<GuestValidationResult> => {
  try {
    const response = await fetch(`${API_BASE}/guests/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) {
      throw new Error("Error al validar el código");
    }
    return await response.json();
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
};

// Nota: getGuestByCode y registerGuestAccess fueron eliminadas
// validateGuestCode ya retorna toda la información del guest necesaria

// Confirmar asistencia (RSVP)
export const confirmRSVP = async (rsvpData: RSVPData): Promise<Guest> => {
  const response = await fetch(`${API_BASE}/guests/rsvp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rsvpData),
  });

  if (!response.ok) {
    throw new Error("Error al confirmar asistencia");
  }

  return await response.json();
};

// === FUNCIONES DE ADMINISTRACIÓN ===

// Obtener todos los invitados
export const getAllGuests = async (): Promise<Guest[]> => {
  const response = await fetch(`${API_BASE}/admin/guests`);
  if (!response.ok) {
    throw new Error("Error al obtener invitados");
  }
  return await response.json();
};

// Crear nuevo invitado
export const createGuest = async (guest: CreateGuestInput): Promise<Guest> => {
  const response = await fetch(`${API_BASE}/admin/guests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(guest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear invitado");
  }

  return await response.json();
};

// Actualizar invitado
export const updateGuest = async (id: string, updates: UpdateGuestInput): Promise<Guest> => {
  const response = await fetch(`${API_BASE}/admin/guests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar invitado");
  }

  return await response.json();
};

// Eliminar invitado
export const deleteGuest = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/admin/guests/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Error al eliminar invitado");
  }
};

// Crear acompañante
export const createCompanion = async (companion: CreateCompanionInput) => {
  const response = await fetch(`${API_BASE}/admin/companions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(companion),
  });

  if (!response.ok) {
    throw new Error("Error al crear acompañante");
  }

  return await response.json();
};

// Actualizar acompañante
export const updateCompanion = async (id: string, updates: { confirmed: boolean }) => {
  const response = await fetch(`${API_BASE}/admin/companions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar acompañante");
  }

  return await response.json();
};

// Eliminar acompañante
export const deleteCompanion = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/admin/companions/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Error al eliminar acompañante");
  }
};

// Obtener estadísticas
export const getGuestStats = async () => {
  const response = await fetch(`${API_BASE}/admin/stats`);
  if (!response.ok) {
    throw new Error("Error al obtener estadísticas");
  }
  return await response.json();
};
