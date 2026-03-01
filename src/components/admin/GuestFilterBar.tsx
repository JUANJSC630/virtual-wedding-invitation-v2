import { Search, X } from "lucide-react";

import { Guest } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StatusFilter = "all" | "confirmed" | "pending" | "companions-pending";

interface GuestFilterBarProps {
  guests: Guest[];
  filteredCount: number;
  searchTerm: string;
  statusFilter: StatusFilter;
  activeFiltersCount: number;
  onSearch: (term: string) => void;
  onStatusFilter: (status: StatusFilter) => void;
  onClear: () => void;
}

const GuestFilterBar: React.FC<GuestFilterBarProps> = ({
  guests,
  filteredCount,
  searchTerm,
  statusFilter,
  activeFiltersCount,
  onSearch,
  onStatusFilter,
  onClear,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
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
              <Button variant="outline" onClick={onClear} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Limpiar ({activeFiltersCount})
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilter("all")}
            >
              Todos ({guests.length})
            </Button>
            <Button
              variant={statusFilter === "confirmed" ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilter("confirmed")}
              className="text-green-700"
            >
              Confirmados ({guests.filter(g => g.confirmed).length})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilter("pending")}
              className="text-orange-700"
            >
              Pendientes ({guests.filter(g => !g.confirmed).length})
            </Button>
            <Button
              variant={statusFilter === "companions-pending" ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilter("companions-pending")}
              className="text-yellow-700"
            >
              Con acompañantes pendientes (
              {guests.filter(g => g.confirmed && g.companions.some(c => !c.confirmed)).length})
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filteredCount} de {guests.length} invitados
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuestFilterBar;
