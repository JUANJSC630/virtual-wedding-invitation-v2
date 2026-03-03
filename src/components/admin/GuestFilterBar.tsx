import { ArrowUpDown, Search, X } from "lucide-react";

import { Guest } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StatusFilter = "all" | "confirmed" | "pending" | "companions-pending" | "no-access" | "accessed-not-confirmed" | "groups";
type SortOrder = "default" | "name" | "code" | "confirmed-date";

interface GuestFilterBarProps {
  guests: Guest[];
  filteredCount: number;
  searchTerm: string;
  statusFilter: StatusFilter;
  sortOrder: SortOrder;
  activeFiltersCount: number;
  onSearch: (term: string) => void;
  onStatusFilter: (status: StatusFilter) => void;
  onSort: (sort: SortOrder) => void;
  onClear: () => void;
}

const FILTER_BUTTONS: { key: StatusFilter; label: (guests: Guest[]) => string }[] = [
  { key: "all",                   label: g => `Todos (${g.length})` },
  { key: "confirmed",             label: g => `Confirmados (${g.filter(x => x.confirmed).length})` },
  { key: "pending",               label: g => `Pendientes (${g.filter(x => !x.confirmed).length})` },
  { key: "companions-pending",    label: g => `Acomp. pendientes (${g.filter(x => x.confirmed && x.companions.some(c => !c.confirmed)).length})` },
  { key: "no-access",             label: g => `Nunca accedió (${g.filter(x => (x.accessCount ?? 0) === 0).length})` },
  { key: "accessed-not-confirmed", label: g => `Accedió sin confirmar (${g.filter(x => (x.accessCount ?? 0) > 0 && !x.confirmed).length})` },
  { key: "groups",                label: g => `Grupos 3+ (${g.filter(x => x.maxGuests >= 3).length})` },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "default",        label: "Más reciente" },
  { value: "name",           label: "Nombre A-Z" },
  { value: "code",           label: "Código A-Z" },
  { value: "confirmed-date", label: "Fecha confirmación" },
];

const GuestFilterBar: React.FC<GuestFilterBarProps> = ({
  guests,
  filteredCount,
  searchTerm,
  statusFilter,
  sortOrder,
  activeFiltersCount,
  onSearch,
  onStatusFilter,
  onSort,
  onClear,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search + clear */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código, email o teléfono..."
                value={searchTerm}
                onChange={e => onSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="outline" onClick={onClear} className="flex items-center gap-2 shrink-0">
                <X className="h-4 w-4" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {FILTER_BUTTONS.map(({ key, label }) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => onStatusFilter(key)}
                className={
                  key === "confirmed" ? "text-green-700" :
                  key === "pending" ? "text-orange-700" :
                  key === "companions-pending" ? "text-yellow-700" :
                  key === "no-access" ? "text-slate-600" :
                  key === "accessed-not-confirmed" ? "text-purple-700" :
                  key === "groups" ? "text-blue-700" :
                  ""
                }
              >
                {label(guests)}
              </Button>
            ))}
          </div>

          {/* Sort + count row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredCount} de {guests.length} invitados
            </p>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={e => onSort(e.target.value as SortOrder)}
                className="text-sm border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuestFilterBar;
