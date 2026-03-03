import React, { useState } from "react";

import { Download, MessageCircle, Plus, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { Guest } from "@/types";

import { useAllGuests, useDeleteGuest, useUpdateGuest } from "@/hooks/useGuests";

import { Button } from "@/components/ui/button";

import CompanionsModal from "./CompanionsModal";
import CSVImportModal from "./CSVImportModal";
import WALinksModal from "./WALinksModal";
import GuestFilterBar from "./GuestFilterBar";
import GuestFormModal from "./GuestFormModal";
import GuestList from "./GuestList";
import GuestQRModal from "./GuestQRModal";
import GuestStatsPanel from "./GuestStatsPanel";

type StatusFilter = "all" | "confirmed" | "pending" | "companions-pending";

interface GuestManagerProps {
  eventSlug: string;
}

const GuestManager: React.FC<GuestManagerProps> = ({ eventSlug }) => {
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

  const { data: guests = [], isLoading, isFetching } = useAllGuests();
  const deleteMutation = useDeleteGuest();
  const updateMutation = useUpdateGuest();

  const filteredGuests = React.useMemo(() => {
    return guests.filter(guest => {
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
        case "confirmed":
          return guest.confirmed;
        case "pending":
          return !guest.confirmed;
        case "companions-pending":
          return guest.confirmed && guest.companions.some(c => !c.confirmed);
        default:
          return true;
      }
    });
  }, [guests, searchTerm, statusFilter]);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setShowGuestModal(true);
  };

  const handleDelete = async (guest: Guest) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${guest.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(guest.id);
      toast.success(`${guest.name} eliminado exitosamente`);
    } catch (error) {
      console.error("Error al eliminar:", error);
      toast.error("Error al eliminar invitado");
    }
  };

  const handleConfirm = async (guest: Guest) => {
    if (!window.confirm(`¿Confirmar asistencia de ${guest.name}?`)) return;
    try {
      await updateMutation.mutateAsync({ id: guest.id, updates: { confirmed: true } });
      toast.success(`${guest.name} confirmado exitosamente`);
    } catch (error) {
      console.error("Error al confirmar:", error);
      toast.error("Error al confirmar invitado");
    }
  };

  const handleCancel = async (guest: Guest) => {
    if (!window.confirm(`¿Cancelar confirmación de ${guest.name}?`)) return;
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
    const rows = [
      ["Código", "Nombre", "Email", "Teléfono", "Cupos", "Confirmado", "Fecha confirmación", "Acompañantes confirmados", "Acompañantes total", "Notas"],
      ...guests.map(g => [
        g.code,
        g.name,
        g.email ?? "",
        g.phone ?? "",
        String(g.maxGuests),
        g.confirmed ? "Sí" : "No",
        g.confirmedAt ? new Date(g.confirmedAt).toLocaleDateString("es-CO") : "",
        String(g.companions.filter(c => c.confirmed).length),
        String(g.companions.length),
        g.notes ?? "",
      ]),
    ];
    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invitados-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

      <GuestStatsPanel />

      <GuestFilterBar
        guests={guests}
        filteredCount={filteredGuests.length}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        activeFiltersCount={activeFiltersCount}
        onSearch={setSearchTerm}
        onStatusFilter={setStatusFilter}
        onClear={() => {
          setSearchTerm("");
          setStatusFilter("all");
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
