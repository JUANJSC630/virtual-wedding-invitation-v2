import React, { useCallback, useEffect, useState } from "react";

import toast from "react-hot-toast";
import {
  CalendarDays,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Users2,
} from "lucide-react";

import { AdminUser, EventWithStats } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUpload from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlobalStats {
  totalEvents: number;
  activeEvents: number;
  totalGuests: number;
  confirmedGuests: number;
  totalAccesses: number;
}

interface EventFormData {
  slug: string;
  groomName: string;
  brideName: string;
  eventDate: string;
  rsvpDeadline: string;
  isActive: boolean;
  // Venues
  ceremonyTime: string;
  ceremonyName: string;
  ceremonyAddress: string;
  ceremonyMapsUrl: string;
  receptionTime: string;
  receptionName: string;
  receptionAddress: string;
  receptionMapsUrl: string;
  venueName: string;
  venueAddress: string;
  // Texts
  verseText: string;
  verseReference: string;
  heroMessage: string;
  giftMessage: string;
  dressCode: string;
  dressCodeLabel: string;
  dressCodeLadies: string;
  dressCodeGentlemen: string;
  // Families
  parentsBride: string;
  parentsGroom: string;
  godparents: string;
  bridesmaids: string;
  groomsmen: string;
  // Contact & Assets
  groomPhone: string;
  bridePhone: string;
  groomWAMessage: string;
  brideWAMessage: string;
  heroPhotoUrl: string;
  photo2Url: string;
  audioUrl: string;
}

interface ClientAdminRow {
  id: string;
  email: string;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyForm: EventFormData = {
  slug: "", groomName: "", brideName: "", eventDate: "", rsvpDeadline: "",
  isActive: true, ceremonyTime: "", ceremonyName: "", ceremonyAddress: "",
  ceremonyMapsUrl: "", receptionTime: "", receptionName: "", receptionAddress: "",
  receptionMapsUrl: "", venueName: "", venueAddress: "", verseText: "",
  verseReference: "", heroMessage: "", giftMessage: "", dressCode: "",
  dressCodeLabel: "", dressCodeLadies: "", dressCodeGentlemen: "",
  parentsBride: "", parentsGroom: "", godparents: "", bridesmaids: "",
  groomsmen: "", groomPhone: "", bridePhone: "", groomWAMessage: "",
  brideWAMessage: "", heroPhotoUrl: "", photo2Url: "", audioUrl: "",
};

function eventToForm(ev: EventWithStats): EventFormData {
  return {
    slug: ev.slug,
    groomName: ev.groomName,
    brideName: ev.brideName,
    eventDate: ev.eventDate ? ev.eventDate.slice(0, 10) : "",
    rsvpDeadline: ev.rsvpDeadline ? ev.rsvpDeadline.slice(0, 10) : "",
    isActive: ev.isActive,
    ceremonyTime: ev.ceremonyTime || "",
    ceremonyName: ev.config?.ceremony?.name || "",
    ceremonyAddress: ev.config?.ceremony?.address || "",
    ceremonyMapsUrl: ev.config?.ceremony?.mapsUrl || "",
    receptionTime: ev.receptionTime || "",
    receptionName: ev.config?.reception?.name || "",
    receptionAddress: ev.config?.reception?.address || "",
    receptionMapsUrl: ev.config?.reception?.mapsUrl || "",
    venueName: ev.venueName || "",
    venueAddress: ev.venueAddress || "",
    verseText: ev.config?.verse?.text || "",
    verseReference: ev.config?.verse?.reference || "",
    heroMessage: ev.config?.heroMessage || "",
    giftMessage: ev.config?.giftMessage || "",
    dressCode: ev.dressCode || "",
    dressCodeLabel: ev.config?.dressCode?.label || "",
    dressCodeLadies: ev.config?.dressCode?.ladies || "",
    dressCodeGentlemen: ev.config?.dressCode?.gentlemen || "",
    parentsBride: ev.config?.parents?.bride?.join("\n") || "",
    parentsGroom: ev.config?.parents?.groom?.join("\n") || "",
    godparents: ev.config?.godparents?.join("\n") || "",
    bridesmaids: ev.config?.bridesmaids?.join("\n") || "",
    groomsmen: ev.config?.groomsmen?.join("\n") || "",
    groomPhone: ev.groomPhone || "",
    bridePhone: ev.bridePhone || "",
    groomWAMessage: ev.groomWAMessage || "",
    brideWAMessage: ev.brideWAMessage || "",
    heroPhotoUrl: ev.heroPhotoUrl || "",
    photo2Url: ev.photo2Url || "",
    audioUrl: ev.audioUrl || "",
  };
}

// ─── EventFormModal ───────────────────────────────────────────────────────────

interface EventFormModalProps {
  open: boolean;
  editingEvent: EventWithStats | null;
  onClose: () => void;
  onSaved: () => void;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ open, editingEvent, onClose, onSaved }) => {
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editingEvent ? eventToForm(editingEvent) : emptyForm);
  }, [editingEvent, open]);

  const set = (field: keyof EventFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingEvent
        ? `/api/master/events/${editingEvent.id}`
        : "/api/master/events";
      const method = editingEvent ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast.success(editingEvent ? "Evento actualizado" : "Evento creado");
      onSaved();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? `Editar: ${editingEvent.slug}` : "Crear nuevo evento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="venues">Locales</TabsTrigger>
              <TabsTrigger value="texts">Textos</TabsTrigger>
              <TabsTrigger value="families">Familias</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
            </TabsList>

            {/* ── Tab: Básico ─────────────────────────────── */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={set("slug")} placeholder="jimena-juan" required />
                </div>
                <div className="space-y-1">
                  <Label>Activo</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <label htmlFor="isActive" className="text-sm">Evento activo (público)</label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nombre del novio *</Label>
                  <Input value={form.groomName} onChange={set("groomName")} placeholder="Juan" required />
                </div>
                <div className="space-y-1">
                  <Label>Nombre de la novia *</Label>
                  <Input value={form.brideName} onChange={set("brideName")} placeholder="Jimena" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Fecha del evento *</Label>
                  <Input type="date" value={form.eventDate} onChange={set("eventDate")} required />
                </div>
                <div className="space-y-1">
                  <Label>Límite RSVP</Label>
                  <Input type="date" value={form.rsvpDeadline} onChange={set("rsvpDeadline")} />
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Locales ────────────────────────────── */}
            <TabsContent value="venues" className="space-y-6 pt-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Ceremonia</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Hora</Label>
                      <Input value={form.ceremonyTime} onChange={set("ceremonyTime")} placeholder="6:00 PM" />
                    </div>
                    <div className="space-y-1">
                      <Label>Nombre del lugar</Label>
                      <Input value={form.ceremonyName} onChange={set("ceremonyName")} placeholder="Iglesia de San Pedro" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Dirección</Label>
                    <Input value={form.ceremonyAddress} onChange={set("ceremonyAddress")} placeholder="Calle 123, Ciudad" />
                  </div>
                  <div className="space-y-1">
                    <Label>URL de Google Maps</Label>
                    <Input value={form.ceremonyMapsUrl} onChange={set("ceremonyMapsUrl")} placeholder="https://maps.google.com/..." />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Recepción</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Hora</Label>
                      <Input value={form.receptionTime} onChange={set("receptionTime")} placeholder="8:00 PM" />
                    </div>
                    <div className="space-y-1">
                      <Label>Nombre del lugar</Label>
                      <Input value={form.receptionName} onChange={set("receptionName")} placeholder="Salón de Eventos" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Dirección</Label>
                    <Input value={form.receptionAddress} onChange={set("receptionAddress")} placeholder="Calle 456, Ciudad" />
                  </div>
                  <div className="space-y-1">
                    <Label>URL de Google Maps</Label>
                    <Input value={form.receptionMapsUrl} onChange={set("receptionMapsUrl")} placeholder="https://maps.google.com/..." />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Textos ─────────────────────────────── */}
            <TabsContent value="texts" className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Versículo</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Texto del versículo</Label>
                    <Textarea value={form.verseText} onChange={set("verseText")} rows={3} placeholder="El amor es paciente, es bondadoso..." />
                  </div>
                  <div className="space-y-1">
                    <Label>Referencia</Label>
                    <Input value={form.verseReference} onChange={set("verseReference")} placeholder="1 Corintios 13:4-7" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Mensaje heroico</Label>
                <Textarea value={form.heroMessage} onChange={set("heroMessage")} rows={4} placeholder="Con la bendición de Dios y nuestras familias..." />
              </div>
              <div className="space-y-1">
                <Label>Mensaje de regalos</Label>
                <Textarea value={form.giftMessage} onChange={set("giftMessage")} rows={3} placeholder="Si deseas hacernos un regalo..." />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Código de vestimenta</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Etiqueta</Label>
                    <Input value={form.dressCodeLabel} onChange={set("dressCodeLabel")} placeholder="Formal" />
                  </div>
                  <div className="space-y-1">
                    <Label>Señoras</Label>
                    <Input value={form.dressCodeLadies} onChange={set("dressCodeLadies")} placeholder="Vestido largo" />
                  </div>
                  <div className="space-y-1">
                    <Label>Caballeros</Label>
                    <Input value={form.dressCodeGentlemen} onChange={set("dressCodeGentlemen")} placeholder="Traje oscuro" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Familias ───────────────────────────── */}
            <TabsContent value="families" className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">Escribe un nombre por línea en cada campo.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Padres de la novia</Label>
                  <Textarea value={form.parentsBride} onChange={set("parentsBride")} rows={4} placeholder={"Sr. Padre de la Novia\nSra. Madre de la Novia"} />
                </div>
                <div className="space-y-1">
                  <Label>Padres del novio</Label>
                  <Textarea value={form.parentsGroom} onChange={set("parentsGroom")} rows={4} placeholder={"Sr. Padre del Novio\nSra. Madre del Novio"} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Padrinos</Label>
                <Textarea value={form.godparents} onChange={set("godparents")} rows={4} placeholder={"Padrino 1\nPadrino 2"} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Damas de honor</Label>
                  <Textarea value={form.bridesmaids} onChange={set("bridesmaids")} rows={4} placeholder={"Dama 1\nDama 2"} />
                </div>
                <div className="space-y-1">
                  <Label>Chambelanes</Label>
                  <Textarea value={form.groomsmen} onChange={set("groomsmen")} rows={4} placeholder={"Chambelán 1\nChambelán 2"} />
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Contacto ───────────────────────────── */}
            <TabsContent value="contact" className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Teléfonos & WhatsApp</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Teléfono del novio</Label>
                    <Input value={form.groomPhone} onChange={set("groomPhone")} placeholder="+57 300 0000000" />
                  </div>
                  <div className="space-y-1">
                    <Label>Teléfono de la novia</Label>
                    <Input value={form.bridePhone} onChange={set("bridePhone")} placeholder="+57 300 0000000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-1">
                    <Label>Mensaje WA – Novio</Label>
                    <Textarea value={form.groomWAMessage} onChange={set("groomWAMessage")} rows={3} />
                  </div>
                  <div className="space-y-1">
                    <Label>Mensaje WA – Novia</Label>
                    <Textarea value={form.brideWAMessage} onChange={set("brideWAMessage")} rows={3} />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Assets</h3>
                <div className="space-y-4">
                  <FileUpload
                    label="Foto principal"
                    value={form.heroPhotoUrl}
                    onChange={url => setForm(prev => ({ ...prev, heroPhotoUrl: url }))}
                    accept="image"
                    assetType="hero-photo"
                    eventId={editingEvent?.id}
                  />
                  <FileUpload
                    label="Foto secundaria"
                    value={form.photo2Url}
                    onChange={url => setForm(prev => ({ ...prev, photo2Url: url }))}
                    accept="image"
                    assetType="photo2"
                    eventId={editingEvent?.id}
                  />
                  <FileUpload
                    label="Audio / canción"
                    value={form.audioUrl}
                    onChange={url => setForm(prev => ({ ...prev, audioUrl: url }))}
                    accept="audio"
                    assetType="audio"
                    eventId={editingEvent?.id}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingEvent ? "Guardar cambios" : "Crear evento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── ClientAdminModal ─────────────────────────────────────────────────────────

interface ClientAdminModalProps {
  open: boolean;
  event: EventWithStats | null;
  onClose: () => void;
}

const ClientAdminModal: React.FC<ClientAdminModalProps> = ({ open, event, onClose }) => {
  const [admins, setAdmins] = useState<ClientAdminRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

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
    else { setAdmins([]); setEmail(""); setName(""); setPassword(""); }
  }, [open, event, loadAdmins]);

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
    if (!confirm("¿Eliminar este admin?")) return;
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
                  <div key={admin.id} className="flex items-center justify-between p-2 rounded border text-sm">
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-muted-foreground text-xs">{admin.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(admin.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

// ─── MasterDashboard ──────────────────────────────────────────────────────────

interface MasterDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

const MasterDashboard: React.FC<MasterDashboardProps> = ({ user, onLogout }) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithStats | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedEventForAdmin, setSelectedEventForAdmin] = useState<EventWithStats | null>(null);

  const loadData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const [evRes, stRes] = await Promise.all([
        fetch("/api/master/events", { credentials: "include" }),
        fetch("/api/master/stats", { credentials: "include" }),
      ]);
      if (evRes.ok) setEvents(await evRes.json());
      if (stRes.ok) setStats(await stRes.json());
    } catch {
      toast.error("Error cargando datos");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    onLogout();
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (ev: EventWithStats) => {
    setEditingEvent(ev);
    setShowEventModal(true);
  };

  const handleManageAdmins = (ev: EventWithStats) => {
    setSelectedEventForAdmin(ev);
    setShowAdminModal(true);
  };

  const handleToggleActive = async (ev: EventWithStats) => {
    try {
      const res = await fetch(`/api/master/events/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !ev.isActive }),
      });
      if (!res.ok) throw new Error("Error al actualizar");
      toast.success(`Evento ${ev.isActive ? "desactivado" : "activado"}`);
      loadData();
    } catch {
      toast.error("Error al cambiar estado del evento");
    }
  };

  const handleDeleteEvent = async (ev: EventWithStats) => {
    if (!confirm(`¿Eliminar el evento "${ev.slug}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/master/events/${ev.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      toast.success("Evento eliminado");
      loadData();
    } catch {
      toast.error("Error al eliminar evento");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between py-2 sm:py-0 gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold leading-tight">
                Master Panel
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                {user.name} · master
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container py-6 space-y-6">
        {/* Global KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{stats.activeEvents}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Invitados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalGuests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Confirmados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmedGuests}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accesos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalAccesses}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Events section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Eventos</h2>
            <Button onClick={handleCreateEvent} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo evento
            </Button>
          </div>

          {loadingEvents ? (
            <p className="text-sm text-muted-foreground">Cargando eventos...</p>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay eventos creados. Crea el primero.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map(ev => (
                <Card key={ev.id} className={!ev.isActive ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-base">{ev.brideName} &amp; {ev.groomName}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{ev.slug}</p>
                      </div>
                      <Badge variant={ev.isActive ? "default" : "secondary"}>
                        {ev.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Stats row */}
                    <div className="flex gap-4 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {ev.stats.totalGuests} invitados
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {ev.stats.confirmedGuests} confirmados
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(ev.eventDate).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>

                    {/* Client admins */}
                    {ev.clientAdmins.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users2 className="h-3 w-3" />
                        {ev.clientAdmins.map(a => a.name).join(", ")}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEvent(ev)}
                        className="flex items-center gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Editar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageAdmins(ev)}
                        className="flex items-center gap-1"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Admins
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(ev)}
                        className="flex items-center gap-1"
                      >
                        {ev.isActive
                          ? <EyeOff className="h-3.5 w-3.5" />
                          : <Eye className="h-3.5 w-3.5" />}
                        {ev.isActive ? "Desactivar" : "Activar"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteEvent(ev)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <EventFormModal
        open={showEventModal}
        editingEvent={editingEvent}
        onClose={() => setShowEventModal(false)}
        onSaved={loadData}
      />
      <ClientAdminModal
        open={showAdminModal}
        event={selectedEventForAdmin}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
};

export default MasterDashboard;
