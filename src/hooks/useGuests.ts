import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Guest, UpdateGuestInput } from "@/types";

import { useGuestScope } from "@/context/GuestScopeContext";

import {
  confirmRSVP,
  createCompanion,
  createGuest,
  deleteCompanion,
  deleteGuest,
  getAllGuests,
  getAnalytics,
  getGuestStats,
  updateCompanion,
  updateGuest,
  validateGuestCode,
} from "@/services/guest-service";

// Hook para validar código de invitado
export const useValidateGuestCode = (eventSlug: string) => {
  return useMutation({
    mutationFn: (code: string) => validateGuestCode({ code, eventSlug }),
  });
};

// Hook para confirmar RSVP
export const useConfirmRSVP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmRSVP,
    onSuccess: updatedGuest => {
      queryClient.setQueryData(["guest", "code", updatedGuest.code], updatedGuest);
      queryClient.setQueryData(["guest", "byCode", updatedGuest.code], updatedGuest);
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode", updatedGuest.code] });
    },
  });
};

// === HOOKS DE ADMINISTRACIÓN (scoped por GuestScopeContext) ===

// Hook para obtener todos los invitados
export const useAllGuests = (refetchInterval?: number) => {
  const base = useGuestScope();
  return useQuery({
    queryKey: ["guests", "all", base],
    queryFn: () => getAllGuests(base),
    refetchInterval: refetchInterval ?? false,
  });
};

// Hook para crear invitado
export const useCreateGuest = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof createGuest>[1]) => createGuest(base, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

/**
 * Actualizar invitado, con respuesta optimista.
 *
 * Confirmar a alguien desde el móvil con mala cobertura tardaba en verse; ahora
 * la lista se actualiza al instante y revierte sola si el servidor falla.
 * Se usa el patrón de React Query (`onMutate` + rollback) y no `useOptimistic`
 * de React 19: mezclar los dos sobre el mismo estado de servidor daría saltos.
 */
export const useUpdateGuest = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();
  const listKey = ["guests", "all", base];

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateGuestInput }) =>
      updateGuest(base, id, updates),

    onMutate: async ({ id, updates }) => {
      // Cancelar refetches en vuelo: si no, uno viejo pisaría lo optimista.
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Guest[]>(listKey);

      queryClient.setQueryData<Guest[]>(listKey, old =>
        old?.map(g => {
          if (g.id !== id) return g;
          const next: Guest = { ...g, ...updates };
          // Espeja lo que hace el backend para que la fecha no parpadee. Con
          // exactOptionalPropertyTypes hay que quitar la clave, no anularla.
          if (updates.confirmed === true) next.confirmedAt = new Date();
          if (updates.confirmed === false) delete next.confirmedAt;
          return next;
        })
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },

    onSuccess: updatedGuest => {
      queryClient.setQueryData(["guest", "code", updatedGuest.code], updatedGuest);
    },

    // Siempre reconciliar con el servidor, haya ido bien o mal.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// Hook para eliminar invitado
export const useDeleteGuest = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGuest(base, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// Hook para crear acompañante
export const useCreateCompanion = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof createCompanion>[1]) => createCompanion(base, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode"] });
    },
  });
};

/** Confirmar/desconfirmar acompañante, también optimista. */
export const useUpdateCompanion = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();
  const listKey = ["guests", "all", base];

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { confirmed: boolean } }) =>
      updateCompanion(base, id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Guest[]>(listKey);

      queryClient.setQueryData<Guest[]>(listKey, old =>
        old?.map(g => ({
          ...g,
          companions: g.companions.map(c => {
            if (c.id !== id) return c;
            const next = { ...c, confirmed: updates.confirmed };
            if (updates.confirmed) next.confirmedAt = new Date();
            else delete next.confirmedAt;
            return next;
          }),
        }))
      );
      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode"] });
    },
  });
};

// Hook para eliminar acompañante
export const useDeleteCompanion = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCompanion(base, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode"] });
    },
  });
};

// Hook para obtener estadísticas
export const useGuestStats = (refetchInterval?: number) => {
  const base = useGuestScope();
  return useQuery({
    queryKey: ["admin", "stats", base],
    queryFn: () => getGuestStats(base),
    refetchInterval: refetchInterval ?? false,
  });
};

// Hook para obtener analytics de accesos
export const useAnalytics = () => {
  const base = useGuestScope();
  return useQuery({
    queryKey: ["admin", "analytics", base],
    queryFn: () => getAnalytics(base),
  });
};
