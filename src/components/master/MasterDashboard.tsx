import React, { useCallback, useEffect, useState } from "react";

import toast from "react-hot-toast";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  FileUp,
  LogOut,
  MonitorSmartphone,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  Users,
  Users2,
} from "lucide-react";

import { AdminUser, EventWithStats } from "@/types";

import { getHonoreesNames } from "@/lib/honorees";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import CSVImportModal from "@/components/admin/CSVImportModal";
import { EventDetail } from "@/components/master/EventDetail";

import { ClientAdminModal } from "./ClientAdminModal";
import { EventFormModal } from "./EventFormModal";

// ─── MasterDashboard ──────────────────────────────────────────────────────────

interface MasterDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

const MasterDashboard: React.FC<MasterDashboardProps> = ({ user, onLogout }) => {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithStats | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedEventForAdmin, setSelectedEventForAdmin] = useState<EventWithStats | null>(null);
  // Ventana por evento (rediseño): al seleccionar, se muestra su panel dedicado.
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importEventId, setImportEventId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const loadData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const evRes = await fetch(`/api/master/events${showArchived ? "?archived=1" : ""}`, {
        credentials: "include",
      });
      if (evRes.ok) setEvents(await evRes.json());
    } catch {
      toast.error("Error cargando eventos");
    } finally {
      setLoadingEvents(false);
    }
  }, [showArchived]);

  useEffect(() => { loadData(); }, [loadData]);

  // Eventos mostrados según la búsqueda (por nombre de protagonistas o slug).
  const shownEvents = searchTerm.trim()
    ? events.filter(ev => {
        const q = searchTerm.trim().toLowerCase();
        return getHonoreesNames(ev).toLowerCase().includes(q) || ev.slug.toLowerCase().includes(q);
      })
    : events;

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

  const handleArchiveEvent = async (ev: EventWithStats) => {
    if (!confirm(`¿Archivar "${ev.slug}"? El evento dejará de ser accesible públicamente.`)) return;
    try {
      const res = await fetch(`/api/master/events/${ev.id}/archive`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Evento archivado");
      loadData();
    } catch {
      toast.error("Error al archivar evento");
    }
  };

  const handleUnarchiveEvent = async (ev: EventWithStats) => {
    try {
      const res = await fetch(`/api/master/events/${ev.id}/unarchive`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      toast.success("Evento restaurado");
      loadData();
    } catch {
      toast.error("Error al restaurar evento");
    }
  };

  const handleDuplicateEvent = async (ev: EventWithStats) => {
    try {
      const res = await fetch(`/api/master/events/${ev.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al duplicar");
      toast.success(`Evento duplicado como "${ev.slug}-copia"`);
      loadData();
    } catch {
      toast.error("Error al duplicar evento");
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
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            onBack={() => setSelectedEvent(null)}
            onEdit={() => handleEditEvent(selectedEvent)}
            onManageAdmins={() => handleManageAdmins(selectedEvent)}
          />
        ) : (
        <>
        {/* Hub de eventos — la lista ES el dashboard. El detalle vive en cada panel. */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Eventos</h2>
              <p className="text-sm text-muted-foreground">
                {events.length} {events.length === 1 ? "evento" : "eventos"}
                {!showArchived && events.length > 0 && (
                  <>
                    {" · "}
                    {events.reduce((n, e) => n + e.stats.totalGuests, 0)} invitados
                    {" · "}
                    {events.reduce((n, e) => n + e.stats.confirmedGuests, 0)} confirmados
                  </>
                )}
              </p>
            </div>
            <Button onClick={handleCreateEvent} size="sm" className="gap-1.5 self-start sm:self-auto">
              <Plus className="h-4 w-4" /> Nuevo evento
            </Button>
          </div>

          {/* Toolbar: búsqueda + filtro */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o enlace…"
                className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:h-9 sm:text-sm"
              />
            </div>
            <div className="flex w-full self-stretch overflow-hidden rounded-md border text-sm sm:w-auto sm:self-start">
              <button
                onClick={() => setShowArchived(false)}
                className={`min-h-11 flex-1 touch-manipulation px-3 py-1.5 transition-colors sm:min-h-0 sm:flex-none ${!showArchived ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Activos
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`min-h-11 flex-1 touch-manipulation px-3 py-1.5 transition-colors sm:min-h-0 sm:flex-none ${showArchived ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                Archivados
              </button>
            </div>
          </div>

          {loadingEvents ? (
            <p className="text-sm text-muted-foreground">Cargando eventos...</p>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {showArchived ? "No hay eventos archivados." : "No hay eventos creados. Crea el primero con “Nuevo evento”."}
              </CardContent>
            </Card>
          ) : shownEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Sin resultados para «{searchTerm}».
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shownEvents.map(ev => (
                <Card key={ev.id} className={!ev.isActive ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-base">{getHonoreesNames(ev)}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{ev.slug}</p>
                      </div>
                      {ev.archivedAt
                        ? <Badge variant="outline" className="text-amber-600 border-amber-300">Archivado</Badge>
                        : <Badge variant={ev.isActive ? "default" : "secondary"}>{ev.isActive ? "Activo" : "Inactivo"}</Badge>
                      }
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

                    {/* Progreso de confirmación (at-a-glance por evento) */}
                    {ev.stats.totalGuests > 0 && (() => {
                      const rate = Math.round((ev.stats.confirmedGuests / ev.stats.totalGuests) * 100);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Confirmación</span>
                            <span className="font-semibold text-foreground">{rate}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${rate}%` }} />
                          </div>
                        </div>
                      );
                    })()}

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
                    {/* Acciones: primarias visibles + resto en menú "Más" */}
                    <div className="flex items-center gap-2 pt-3">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setSelectedEvent(ev)}
                        className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Abrir panel
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${ev.slug}?preview=1`, "_blank")}
                        className="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
                        title="Abrir vista previa de la invitación"
                      >
                        <MonitorSmartphone className="h-3.5 w-3.5" />
                        Vista previa
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="px-2" aria-label="Más acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEditEvent(ev)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Editar invitación
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageAdmins(ev)}>
                            <Settings className="mr-2 h-4 w-4" /> Admins del evento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(ev)}>
                            {ev.isActive
                              ? <><EyeOff className="mr-2 h-4 w-4" /> Desactivar</>
                              : <><Eye className="mr-2 h-4 w-4" /> Activar</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateEvent(ev)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setImportEventId(ev.id); setShowImportModal(true); }}>
                            <FileUp className="mr-2 h-4 w-4" /> Importar CSV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {showArchived ? (
                            <DropdownMenuItem onClick={() => handleUnarchiveEvent(ev)}>
                              <Eye className="mr-2 h-4 w-4" /> Restaurar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchiveEvent(ev)} className="text-amber-600 focus:text-amber-700">
                              <EyeOff className="mr-2 h-4 w-4" /> Archivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteEvent(ev)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        </>
        )}
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
      <CSVImportModal
        open={showImportModal}
        onOpenChange={open => { setShowImportModal(open); if (!open) setImportEventId(null); }}
        {...(importEventId ? { eventId: importEventId } : {})}
        onImported={loadData}
      />
    </div>
  );
};

export default MasterDashboard;
