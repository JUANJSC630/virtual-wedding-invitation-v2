import React, { useCallback, useEffect, useState } from "react";

import toast from "react-hot-toast";
import { KeyRound, Trash2, UserPlus } from "lucide-react";

import { EventWithStats } from "@/types";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ClientAdminRow } from "./eventFormModel";

// ─── ClientAdminModal ─────────────────────────────────────────────────────────

interface ClientAdminModalProps {
  open: boolean;
  event: EventWithStats | null;
  onClose: () => void;
}

export const ClientAdminModal: React.FC<ClientAdminModalProps> = ({ open, event, onClose }) => {
  const confirmar = useConfirm();
  const [admins, setAdmins] = useState<ClientAdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  // Password reset
  const [changingPwdFor, setChangingPwdFor] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const loadAdmins = useCallback(async () => {
    if (!event) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/master/events`, { credentials: "include" });
      const data: EventWithStats[] = await res.json();
      const found = data.find(e => e.id === event.id);
      setAdmins(found?.clientAdmins || []);
    } catch {
      toast.error("Error cargando admins");
    } finally {
      setLoading(false);
    }
  }, [event]);

  useEffect(() => {
    if (open && event) loadAdmins();
    else {
      setAdmins([]); setEmail(""); setName(""); setPassword("");
      setChangingPwdFor(null); setNewPwd("");
    }
  }, [open, event, loadAdmins]);

  const handleChangePassword = async (adminId: string) => {
    if (newPwd.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch(`/api/master/client-admins/${adminId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: newPwd }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cambiar contraseña");
      }
      toast.success("Contraseña actualizada");
      setChangingPwdFor(null);
      setNewPwd("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingPwd(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/master/events/${event.id}/client-admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear admin");
      }
      toast.success("Admin creado");
      setEmail(""); setName(""); setPassword("");
      loadAdmins();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (adminId: string) => {
    const ok = await confirmar({
      title: "¿Eliminar este administrador?",
      description: "Perderá el acceso al panel de este evento.",
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/master/client-admins/${adminId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Admin eliminado");
      setAdmins(prev => prev.filter(a => a.id !== adminId));
    } catch {
      toast.error("Error al eliminar admin");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Admins – {event?.slug}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* List of existing admins */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Admins actuales</h3>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin admins asignados.</p>
            ) : (
              <div className="space-y-2">
                {admins.map(admin => (
                  <div key={admin.id} className="rounded border text-sm">
                    <div className="flex items-center justify-between p-2">
                      <div>
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-muted-foreground text-xs">{admin.email}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setChangingPwdFor(changingPwdFor === admin.id ? null : admin.id);
                            setNewPwd("");
                          }}
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(admin.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {changingPwdFor === admin.id && (
                      <div className="px-2 pb-2 flex gap-2 items-center border-t pt-2">
                        <Input
                          type="password"
                          value={newPwd}
                          onChange={e => setNewPwd(e.target.value)}
                          placeholder="Nueva contraseña (mín. 8 caracteres)"
                          className="flex-1 h-8 text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleChangePassword(admin.id)}
                          disabled={savingPwd || newPwd.length < 8}
                        >
                          {savingPwd ? "..." : "Guardar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => { setChangingPwdFor(null); setNewPwd(""); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create new admin */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Agregar admin</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" required />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" required />
              </div>
              <div className="space-y-1">
                <Label>Contraseña</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required />
              </div>
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={saving}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  {saving ? "Creando..." : "Crear admin"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
