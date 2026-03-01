import { useEffect, useState } from "react";

import { Shuffle } from "lucide-react";
import toast from "react-hot-toast";

import { CreateGuestInput, Guest, UpdateGuestInput } from "@/types";

import { useCreateGuest, useUpdateGuest } from "@/hooks/useGuests";

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
import { Textarea } from "@/components/ui/textarea";

interface GuestFormData {
  code: string;
  name: string;
  email: string;
  phone: string;
  maxGuests: number;
  notes: string;
}

const EMPTY_FORM: GuestFormData = {
  code: "",
  name: "",
  email: "",
  phone: "",
  maxGuests: 1,
  notes: "",
};

interface GuestFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGuest: Guest | null;
}

const GuestFormModal: React.FC<GuestFormModalProps> = ({ open, onOpenChange, editingGuest }) => {
  const [formData, setFormData] = useState<GuestFormData>(EMPTY_FORM);

  const createMutation = useCreateGuest();
  const updateMutation = useUpdateGuest();

  // Sync form when dialog opens or editingGuest changes
  useEffect(() => {
    if (!open) return;
    if (editingGuest) {
      setFormData({
        code: editingGuest.code,
        name: editingGuest.name,
        email: editingGuest.email ?? "",
        phone: editingGuest.phone ?? "",
        maxGuests: editingGuest.maxGuests,
        notes: editingGuest.notes ?? "",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [open, editingGuest]);

  const generateRandomCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      notes: formData.notes || undefined,
    };

    try {
      if (editingGuest) {
        const { code: _code, ...updateData } = data;
        await updateMutation.mutateAsync({
          id: editingGuest.id,
          updates: updateData as UpdateGuestInput,
        });
        toast.success(`${formData.name} actualizado exitosamente`);
      } else {
        await createMutation.mutateAsync(data as CreateGuestInput);
        toast.success(`${formData.name} creado exitosamente`);
      }
      handleClose();
    } catch (error) {
      console.error("Error saving guest:", error);
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast.error(editingGuest ? `Error al actualizar invitado: ${message}` : `Error al crear invitado: ${message}`);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingGuest ? "Editar Invitado" : "Nuevo Invitado"}</DialogTitle>
          <DialogDescription>
            {editingGuest
              ? "Modifica la información del invitado"
              : "Agrega un nuevo invitado al sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  required
                  disabled={!!editingGuest}
                  placeholder="AYP001"
                  className="flex-1"
                />
                {!editingGuest && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateRandomCode}
                    title="Generar código aleatorio"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxGuests">Cupos disponibles *</Label>
              <Input
                id="maxGuests"
                type="number"
                value={formData.maxGuests}
                onChange={e => setFormData(prev => ({ ...prev, maxGuests: parseInt(e.target.value) || 1 }))}
                min="1"
                max="20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+57 300 123 4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas internas visibles solo para el admin..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : editingGuest ? "Actualizar" : "Crear"} Invitado
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestFormModal;
