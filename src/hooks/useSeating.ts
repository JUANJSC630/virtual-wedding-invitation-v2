import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  TableInput,
  applySeating,
  createSeatingRule,
  deleteSeatingRule,
  getSeatingRules,
  createTable,
  deleteTable,
  getTables,
  updateTable,
} from "@/services/seating-service";

import { useGuestScope } from "@/context/GuestScopeContext";

/**
 * Toda mutación de mesas invalida también la lista de invitados: la asignación
 * cuelga de la persona, así que ambas vistas se mueven a la vez.
 */
function useSeatingMutation<TVars, TData>(fn: (base: string, vars: TVars) => Promise<TData>) {
  const base = useGuestScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: TVars) => fn(base, vars),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["seating-rules"] });
      queryClient.invalidateQueries({ queryKey: ["guests", "all"] });
    },
  });
}

export const useTables = () => {
  const base = useGuestScope();
  return useQuery({
    queryKey: ["tables", base],
    queryFn: () => getTables(base),
  });
};

export const useCreateTable = () =>
  useSeatingMutation((base, table: TableInput) => createTable(base, table));

export const useUpdateTable = () =>
  useSeatingMutation((base, { id, updates }: { id: string; updates: TableInput }) =>
    updateTable(base, id, updates)
  );

export const useDeleteTable = () => useSeatingMutation((base, id: string) => deleteTable(base, id));

export const useApplySeating = () =>
  useSeatingMutation((base, assignments: Record<string, string | null>) =>
    applySeating(base, assignments)
  );

export const useSeatingRules = () => {
  const base = useGuestScope();
  return useQuery({
    queryKey: ["seating-rules", base],
    queryFn: () => getSeatingRules(base),
  });
};

export const useCreateSeatingRule = () =>
  useSeatingMutation((base, rule: Parameters<typeof createSeatingRule>[1]) =>
    createSeatingRule(base, rule)
  );

export const useDeleteSeatingRule = () =>
  useSeatingMutation((base, id: string) => deleteSeatingRule(base, id));
