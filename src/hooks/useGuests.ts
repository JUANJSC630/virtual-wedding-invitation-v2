import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UpdateGuestInput } from "@/types";

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

// Hook para actualizar invitado
export const useUpdateGuest = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateGuestInput }) =>
      updateGuest(base, id, updates),
    onSuccess: updatedGuest => {
      queryClient.setQueryData(["guest", "code", updatedGuest.code], updatedGuest);
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

// Hook para actualizar acompañante
export const useUpdateCompanion = () => {
  const base = useGuestScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { confirmed: boolean } }) =>
      updateCompanion(base, id, updates),
    onSuccess: () => {
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
