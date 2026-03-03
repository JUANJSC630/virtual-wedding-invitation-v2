import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UpdateGuestInput } from "@/types";

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

// Hook eliminado: useGuestByCode - ya no es necesario
// Hook eliminado: useRegisterGuestAccess - endpoint no existe

// Hook para confirmar RSVP
export const useConfirmRSVP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmRSVP,
    onSuccess: updatedGuest => {
      // Actualizar cache del invitado
      queryClient.setQueryData(["guest", "code", updatedGuest.code], updatedGuest);
      queryClient.setQueryData(["guest", "byCode", updatedGuest.code], updatedGuest);
      // Invalidar lista de invitados (si existe en cache)
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode", updatedGuest.code] });
    },
  });
};

// === HOOKS DE ADMINISTRACIÓN ===

// Hook para obtener todos los invitados
export const useAllGuests = () => {
  return useQuery({
    queryKey: ["guests", "all"],
    queryFn: getAllGuests,
  });
};

// Hook para crear invitado
export const useCreateGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// Hook para actualizar invitado
export const useUpdateGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateGuestInput }) =>
      updateGuest(id, updates),
    onSuccess: updatedGuest => {
      queryClient.setQueryData(["guest", "code", updatedGuest.code], updatedGuest);
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// Hook para eliminar invitado
export const useDeleteGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// Hook para crear acompañante
export const useCreateCompanion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompanion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode"] });
    },
  });
};

// Hook para actualizar acompañante
export const useUpdateCompanion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { confirmed: boolean } }) =>
      updateCompanion(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode"] });
    },
  });
};

// Hook para eliminar acompañante
export const useDeleteCompanion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompanion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["guest", "byCode"] });
    },
  });
};

// Hook para obtener estadísticas
export const useGuestStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getGuestStats,
  });
};

// Hook para obtener analytics de accesos
export const useAnalytics = () => {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: getAnalytics,
  });
};
