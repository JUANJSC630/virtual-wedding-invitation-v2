import { useEffect, useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { CreateCompanionInput, Guest } from "@/types";

import {
  useCreateCompanion,
  useDeleteCompanion,
  useUpdateCompanion,
} from "@/hooks/useGuests";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedGuest: Guest | null;
  guests: Guest[];
}

const CompanionsModal: React.FC<CompanionsModalProps> = ({
  open,
  onOpenChange,
  selectedGuest,
  guests,
}) => {
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [newCompanionName, setNewCompanionName] = useState("");

  const createCompanionMutation = useCreateCompanion();
  const updateCompanionMutation = useUpdateCompanion();
  const deleteCompanionMutation = useDeleteCompanion();

  // Reset internal state when modal closes
  useEffect(() => {
    if (!open) {
      setShowAddCompanion(false);
      setNewCompanionName("");
    }
  }, [open]);

  if (!selectedGuest) return null;

  // Get fresh guest data from the query cache (updated after mutations)
  const currentGuest = guests.find(g => g.id === selectedGuest.id) ?? selectedGuest;

  const confirmedCount =
    currentGuest.companions.filter(c => c.confirmed).length + (currentGuest.confirmed ? 1 : 0);
  const availableSlots =
    currentGuest.maxGuests -
    currentGuest.companions.filter(c => c.confirmed).length -
    (currentGuest.confirmed ? 1 : 0);

  const handleToggleCompanion = async (companionId: string, confirmed: boolean) => {
    try {
      await updateCompanionMutation.mutateAsync({ id: companionId, updates: { confirmed } });
      toast.success(confirmed ? "Acompañante confirmado" : "Confirmación de acompañante cancelada");
    } catch (error) {
      console.error("Error al actualizar acompañante:", error);
      toast.error("Error al actualizar acompañante");
    }
  };

  const handleAddCompanion = async () => {
    if (!newCompanionName.trim()) return;

    if (currentGuest.companions.length >= currentGuest.maxGuests - 1) {
      toast.error("Has alcanzado el límite máximo de acompañantes para este invitado");
      return;
    }

    const companionName = newCompanionName.trim();
    try {
      await createCompanionMutation.mutateAsync({
        guestId: selectedGuest.id,
        name: companionName,
      } as CreateCompanionInput);
      setNewCompanionName("");
      setShowAddCompanion(false);
      toast.success(`Acompañante "${companionName}" agregado exitosamente`);
    } catch (error) {
      console.error("Error al agregar acompañante:", error);
      toast.error("Error al agregar acompañante");
    }
  };

  const handleDeleteCompanion = async (companionId: string, companionName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${companionName}?`)) return;
    try {
      await deleteCompanionMutation.mutateAsync(companionId);
      toast.success(`${companionName} eliminado exitosamente`);
    } catch (error) {
      console.error("Error al eliminar acompañante:", error);
      toast.error("Error al eliminar acompañante");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl px-2 sm:px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Gestionar Acompañantes</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Administra los acompañantes de {currentGuest.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invitado principal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="mb-2 sm:mb-0">
              <h4 className="font-semibold text-base sm:text-lg">Invitado Principal</h4>
              <p className="text-sm text-muted-foreground">{currentGuest.name}</p>
            </div>
            <Badge variant={currentGuest.confirmed ? "default" : "secondary"}>
              {currentGuest.confirmed ? "Confirmado" : "Pendiente"}
            </Badge>
          </div>

          {/* Acompañantes */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h4 className="font-semibold text-base sm:text-lg">
                Acompañantes ({currentGuest.companions.length}/{currentGuest.maxGuests - 1} máximo)
              </h4>
              {currentGuest.companions.length < currentGuest.maxGuests - 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddCompanion(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar
                </Button>
              )}
            </div>

            {showAddCompanion && (
              <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                <Label htmlFor="companionName" className="text-sm font-medium">
                  Nombre del acompañante
                </Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    id="companionName"
                    value={newCompanionName}
                    onChange={e => setNewCompanionName(e.target.value)}
                    placeholder="Nombre completo"
                    className="flex-1"
                    onKeyDown={e => e.key === "Enter" && handleAddCompanion()}
                  />
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <Button
                      size="sm"
                      onClick={handleAddCompanion}
                      disabled={!newCompanionName.trim() || createCompanionMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {createCompanionMutation.isPending ? "Agregando..." : "Agregar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddCompanion(false);
                        setNewCompanionName("");
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentGuest.companions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay acompañantes registrados
              </p>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {currentGuest.companions.map((companion, index) => (
                  <div
                    key={companion.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
                  >
                    <div>
                      <p className="font-medium text-base">{companion.name}</p>
                      <p className="text-sm text-muted-foreground">Acompañante {index + 1}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant={companion.confirmed ? "default" : "secondary"}>
                        {companion.confirmed ? "Confirmado" : "Pendiente"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={companion.confirmed ? "outline" : "default"}
                        onClick={() => handleToggleCompanion(companion.id, !companion.confirmed)}
                        disabled={updateCompanionMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        {companion.confirmed ? "Cancelar" : "Confirmar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCompanion(companion.id, companion.name)}
                        className="text-destructive hover:text-destructive w-full sm:w-auto"
                        disabled={deleteCompanionMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total confirmados:</span> {confirmedCount}
              </div>
              <div>
                <span className="font-medium">Cupos disponibles:</span> {availableSlots}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompanionsModal;
