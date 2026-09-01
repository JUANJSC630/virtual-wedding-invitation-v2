import React, { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Download, MessageCircle, Plus, Radio, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { Guest } from "@/types";

import { downloadCsv } from "@/lib/csv";
import { RsvpQuestion } from "@/lib/rsvpQuestions";

import { useAllGuests, useDeleteGuest, useUpdateGuest } from "@/hooks/useGuests";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

import CompanionsModal from "./CompanionsModal";
import CSVImportModal from "./CSVImportModal";
import WALinksModal from "./WALinksModal";
import GuestFilterBar from "./GuestFilterBar";
import GuestFormModal from "./GuestFormModal";
import GuestList from "./GuestList";
import GuestQRModal from "./GuestQRModal";
import GuestStatsPanel from "./GuestStatsPanel";
import { RsvpAnswersPanel } from "./RsvpAnswersPanel";

type StatusFilter = "all" | "confirmed" | "pending" | "companions-pending" | "no-access" | "accessed-not-confirmed" | "groups";
type SortOrder = "default" | "name" | "code" | "confirmed-date";

interface GuestManagerProps {
  eventSlug: string;
  /** Presente en modo master por-evento: habilita el import CSV por evento. */
  eventId?: string;
  /** Preguntas del RSVP del evento; sin ellas no se muestra el panel de respuestas. */
  rsvpQuestions?: RsvpQuestion[];
  /** Mesas del evento; habilita el desglose de catering por mesa. */
  tables?: { id: string; name: string }[];
}

const GuestManager: React.FC<GuestManagerProps> = ({ eventSlug, eventId, rsvpQuestions = [], tables = [] }) => {
  const confirmar = useConfirm();
  const queryClient = useQueryClient();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showCompanions, setShowCompanions] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showWAModal, setShowWAModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [liveMode, setLiveMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: guests = [], isLoading, isFetching } = useAllGuests(liveMode ? 10000 : undefined);

  // Track last successful refresh
  useEffect(() => {
    if (!isFetching) setLastUpdated(new Date());
  }, [isFetching]);
  const deleteMutation = useDeleteGuest();
  const updateMutation = useUpdateGuest();

  const filteredGuests = React.useMemo(() => {
    const filtered = guests.filter(guest => {
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        const matches =
          guest.name.toLowerCase().includes(lower) ||
          guest.code.toLowerCase().includes(lower) ||
          guest.email?.toLowerCase().includes(lower) ||
          guest.phone?.includes(searchTerm);
        if (!matches) return false;
      }
      switch (statusFilter) {
        case "confirmed":             return guest.confirmed;
        case "pending":               return !guest.confirmed;
        case "companions-pending":    return guest.confirmed && guest.companions.some(c => !c.confirmed);
        case "no-access":             return (guest.accessCount ?? 0) === 0;
        case "accessed-not-confirmed": return (guest.accessCount ?? 0) > 0 && !guest.confirmed;
        case "groups":                return guest.maxGuests >= 3;
        default:                      return true;
      }
    });

    switch (sortOrder) {
      case "name":
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "es"));
      case "code":
        return [...filtered].sort((a, b) => a.code.localeCompare(b.code));
      case "confirmed-date":
        return [...filtered].sort((a, b) => {
          if (!a.confirmedAt && !b.confirmedAt) return 0;
          if (!a.confirmedAt) return 1;
          if (!b.confirmedAt) return -1;
          return new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime();
        });
      default:
        return filtered;
    }
  }, [guests, searchTerm, statusFilter, sortOrder]);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (sortOrder !== "default" ? 1 : 0);

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setShowGuestModal(true);
  };

  const handleDelete = async (guest: Guest) => {
    const ok = await confirmar({
      title: `¿Eliminar a ${guest.name}?`,
      description: "Se borrarán también sus acompañantes. No se puede deshacer.",
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(guest.id);
      toast.success(`${guest.name} eliminado exitosamente`);
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar invitado");
    }
  };

  const handleConfirm = async (guest: Guest) => {
    const ok = await confirmar({
      title: `¿Confirmar la asistencia de ${guest.name}?`,
      confirmText: "Confirmar",
    });
    if (!ok) return;
    try {
      await updateMutation.mutateAsync({ id: guest.id, updates: { confirmed: true } });
      toast.success(`${guest.name} confirmado exitosamente`);
    } catch (error) {
      console.error("Error al confirmar:", error);
      toast.error("Error al confirmar invitado");
    }
  };

  const handleCancel = async (guest: Guest) => {
    const ok = await confirmar({
      title: `¿Cancelar la confirmación de ${guest.name}?`,
      description: "Sus acompañantes también quedarán sin confirmar.",
      confirmText: "Cancelar confirmación",
      cancelText: "Dejarlo así",
    });
    if (!ok) return;
    try {
      await updateMutation.mutateAsync({ id: guest.id, updates: { confirmed: false } });
      toast.success(`Confirmación cancelada para ${guest.name}`);
    } catch (error) {
      console.error("Error al cancelar confirmación:", error);
      toast.error("Error al cancelar confirmación");
    }
  };

  const handleManageCompanions = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowCompanions(true);
  };

  const handleShowQR = (guest: Guest) => {
    setQrGuest(guest);
    setShowQRModal(true);
  };

  const handleSendWhatsApp = (guest: Guest) => {
    if (!guest.phone) {
      toast.error("Este invitado no tiene número de teléfono registrado");
      return;
    }
    let phone = guest.phone.replace(/\D/g, "");
    if (!phone.startsWith("57")) phone = "57" + phone;
    const url = `${window.location.origin}/${eventSlug}?code=${guest.code}`;
    const message = `¡Hola ${guest.name}!\n\nTe invitamos cordialmente a nuestra boda.\n\nAccede a tu invitación digital aquí: ${url}\n\n¡Esperamos celebrar contigo este día tan especial!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success(`Enviando invitación por WhatsApp a ${guest.name}`);
  };

  const handleCopyCode = (guest: Guest) => {
    navigator.clipboard
      .writeText(guest.code)
      .then(() => toast.success(`Código ${guest.code} copiado al portapapeles`))
      .catch(() => toast.error("Error al copiar el código"));
  };

  const handleExportCSV = () => {
    // Las respuestas del RSVP se añaden como una columna por pregunta: es lo que
    // el organizador le pasa al catering sin tener que cruzar dos archivos.
    const rows = [
      [
        "Código", "Persona", "Rol", "Email", "Teléfono",
        "Confirmado", "Fecha confirmación", "Notas",
        ...rsvpQuestions.map(q => q.label),
      ],
      // Una fila por PERSONA: el catering necesita un plato por comensal, no por
      // invitación. Sin asistentes (eventos antiguos) se cae al invitado.
      ...guests.flatMap(g => {
        const personas = g.attendees?.length
          ? g.attendees.map(a => ({
              nombre: a.name,
              esTitular: a.isPrimary,
              confirmed: a.confirmed,
              confirmedAt: a.confirmedAt,
              answers: a.rsvpAnswers,
            }))
          : [{
              nombre: g.name,
              esTitular: true,
              confirmed: g.confirmed,
              confirmedAt: g.confirmedAt,
              answers: g.rsvpAnswers,
            }];

        return personas.map(p => [
          g.code,
          p.nombre,
          p.esTitular ? "Titular" : "Acompañante",
          p.esTitular ? (g.email ?? "") : "",
          p.esTitular ? (g.phone ?? "") : "",
          p.confirmed ? "Sí" : "No",
          p.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString("es-CO") : "",
          p.esTitular ? (g.notes ?? "") : "",
          ...rsvpQuestions.map(q => {
            const a = p.answers?.[q.id];
            return Array.isArray(a) ? a.join("; ") : (a ?? "");
          }),
        ]);
      }),
    ];
    downloadCsv(`invitados-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`${guests.length} invitados exportados a CSV`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Cargando invitados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Invitados</h1>
          <p className="text-muted-foreground">
            Administra y da seguimiento a todos los invitados de tu boda
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setLiveMode(v => !v)}
            variant={liveMode ? "default" : "outline"}
            className={liveMode ? "bg-green-600 hover:bg-green-700" : ""}
            title="Refresca datos cada 10 segundos"
          >
            <Radio className="mr-2 h-4 w-4" />
            {liveMode ? "En vivo" : "Modo en vivo"}
          </Button>
          <Button onClick={() => setShowWAModal(true)} variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" />
            Links WA
          </Button>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setShowImportModal(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button
            onClick={() => {
              setEditingGuest(null);
              setShowGuestModal(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Invitado
          </Button>
        </div>
      </div>

      {/* Live mode status bar */}
      {liveMode && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Modo en vivo activo — actualizando cada 10 segundos
          </span>
          {lastUpdated && (
            <span className="text-xs text-green-600">
              Última actualización: {lastUpdated.toLocaleTimeString("es-CO")}
            </span>
          )}
        </div>
      )}

      {/* 80% confirmation banner */}
      {(() => {
        const confirmed = guests.filter(g => g.confirmed).length;
        const rate = guests.length > 0 ? confirmed / guests.length : 0;
        if (rate >= 0.8 && guests.length > 0) {
          return (
            <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 font-medium flex items-center gap-2">
              🎉 ¡{Math.round(rate * 100)}% de confirmación! {confirmed} de {guests.length} invitados han confirmado.
            </div>
          );
        }
        return null;
      })()}

      <GuestStatsPanel liveMode={liveMode} />

      <RsvpAnswersPanel guests={guests} questions={rsvpQuestions} tables={tables} />

      <GuestFilterBar
        guests={guests}
        filteredCount={filteredGuests.length}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        sortOrder={sortOrder}
        activeFiltersCount={activeFiltersCount}
        onSearch={setSearchTerm}
        onStatusFilter={setStatusFilter}
        onSort={setSortOrder}
        onClear={() => {
          setSearchTerm("");
          setStatusFilter("all");
          setSortOrder("default");
        }}
      />

      <GuestList
        guests={filteredGuests}
        totalGuests={guests.length}
        isFetching={isFetching}
        eventSlug={eventSlug}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onManageCompanions={handleManageCompanions}
        onShowQR={handleShowQR}
        onSendWhatsApp={handleSendWhatsApp}
        onCopyCode={handleCopyCode}
      />

      <GuestFormModal
        open={showGuestModal}
        onOpenChange={open => {
          setShowGuestModal(open);
          if (!open) setEditingGuest(null);
        }}
        editingGuest={editingGuest}
      />

      <CompanionsModal
        open={showCompanions}
        onOpenChange={setShowCompanions}
        selectedGuest={selectedGuest}
        guests={guests}
      />

      <GuestQRModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        guest={qrGuest}
        eventSlug={eventSlug}
      />

      <CSVImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        {...(eventId ? { eventId } : {})}
        onImported={() => queryClient.invalidateQueries({ queryKey: ["guests", "all"] })}
      />
      <WALinksModal
        open={showWAModal}
        onOpenChange={setShowWAModal}
        guests={guests}
        eventSlug={eventSlug}
      />
    </div>
  );
};

export default GuestManager;
