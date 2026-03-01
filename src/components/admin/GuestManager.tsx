import React, { useState } from "react";

import { QRCodeSVG } from "qrcode.react";

import {
  Calendar,
  CheckCircle,
  Copy,
  Download,
  Edit,
  Loader2,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Shuffle,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { CreateCompanionInput, CreateGuestInput, Guest, UpdateGuestInput } from "@/types";

import {
  useAllGuests,
  useCreateCompanion,
  useCreateGuest,
  useDeleteCompanion,
  useDeleteGuest,
  useGuestStats,
  useUpdateCompanion,
  useUpdateGuest,
} from "@/hooks/useGuests";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GuestFormData {
  code: string;
  name: string;
  email: string;
  phone: string;
  maxGuests: number;
  notes: string;
}

interface GuestManagerProps {
  eventSlug: string;
}

const GuestManager: React.FC<GuestManagerProps> = ({ eventSlug }) => {
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showCompanions, setShowCompanions] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAddCompanion, setShowAddCompanion] = useState(false);
  const [newCompanionName, setNewCompanionName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "companions-pending">("all");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState<GuestFormData>({
    code: "",
    name: "",
    email: "",
    phone: "",
    maxGuests: 1,
    notes: "",
  });

  const { data: guests = [], isLoading, isFetching } = useAllGuests();
  const { data: stats, isFetching: isFetchingStats } = useGuestStats();

  // Lógica de filtrado
  const filteredGuests = React.useMemo(() => {
    return guests.filter(guest => {
      // Filtro de búsqueda por texto
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          guest.name.toLowerCase().includes(searchLower) ||
          guest.code.toLowerCase().includes(searchLower) ||
          guest.email?.toLowerCase().includes(searchLower) ||
          guest.phone?.includes(searchTerm);

        if (!matchesSearch) return false;
      }

      // Filtro por estado
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

  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  // Contar filtros activos
  const activeFiltersCount = (searchTerm ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  const createMutation = useCreateGuest();
  const updateMutation = useUpdateGuest();
  const deleteMutation = useDeleteGuest();
  const updateCompanionMutation = useUpdateCompanion();
  const createCompanionMutation = useCreateCompanion();
  const deleteCompanionMutation = useDeleteCompanion();

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      email: "",
      phone: "",
      maxGuests: 1,
      notes: "",
    });
    setShowGuestModal(false);
    setEditingGuest(null);
  };

  const handleEdit = (guest: Guest) => {
    setFormData({
      code: guest.code,
      name: guest.name,
      email: guest.email || "",
      phone: guest.phone || "",
      maxGuests: guest.maxGuests,
      notes: guest.notes || "",
    });
    setEditingGuest(guest);
    setShowGuestModal(true);
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
        const { code, ...updateData } = data;
        await updateMutation.mutateAsync({
          id: editingGuest.id,
          updates: updateData as UpdateGuestInput,
        });
        toast.success(`${formData.name} actualizado exitosamente`);
      } else {
        await createMutation.mutateAsync(data as CreateGuestInput);
        toast.success(`${formData.name} creado exitosamente`);
      }
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      toast.error(editingGuest ? "Error al actualizar invitado" : "Error al crear invitado");
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: string }).message)
          : String(error);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${guest.name}?`)) {
      try {
        await deleteMutation.mutateAsync(guest.id);
        toast.success(`${guest.name} eliminado exitosamente`);
      } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error("Error al eliminar invitado");
      }
    }
  };

  const handleConfirmGuest = async (guest: Guest) => {
    if (window.confirm(`¿Confirmar asistencia de ${guest.name}?`)) {
      try {
        await updateMutation.mutateAsync({
          id: guest.id,
          updates: { confirmed: true },
        });
        toast.success(`${guest.name} confirmado exitosamente`);
      } catch (error) {
        console.error("Error al confirmar:", error);
        toast.error("Error al confirmar invitado");
      }
    }
  };

  // Cancelar confirmación de invitado principal
  const handleCancelGuest = async (guest: Guest) => {
    if (window.confirm(`¿Cancelar confirmación de ${guest.name}?`)) {
      try {
        await updateMutation.mutateAsync({
          id: guest.id,
          updates: { confirmed: false },
        });
        toast.success(`Confirmación cancelada para ${guest.name}`);
      } catch (error) {
        console.error("Error al cancelar confirmación:", error);
        toast.error("Error al cancelar confirmación");
      }
    }
  };

  const handleManageCompanions = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowCompanions(true);
  };

  const handleToggleCompanion = async (companionId: string, confirmed: boolean) => {
    try {
      await updateCompanionMutation.mutateAsync({
        id: companionId,
        updates: { confirmed },
      });
      toast.success(
        confirmed ? "Acompañante confirmado exitosamente" : "Confirmación de acompañante cancelada"
      );
    } catch (error) {
      console.error("Error al actualizar acompañante:", error);
      toast.error("Error al actualizar acompañante");
    }
  };

  const handleAddCompanion = async () => {
    if (!selectedGuest || !newCompanionName.trim()) return;

    // Buscar los datos actualizados del invitado
    const currentGuest = guests.find(g => g.id === selectedGuest.id) || selectedGuest;

    // Verificar que no exceda el límite
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
    if (window.confirm(`¿Estás seguro de eliminar a ${companionName}?`)) {
      try {
        await deleteCompanionMutation.mutateAsync(companionId);
        toast.success(`${companionName} eliminado exitosamente`);
      } catch (error) {
        console.error("Error al eliminar acompañante:", error);
        toast.error("Error al eliminar acompañante");
      }
    }
  };

  const generateRandomCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleSendWhatsApp = (guest: Guest) => {
    if (!guest.phone) {
      toast.error("Este invitado no tiene número de teléfono registrado");
      return;
    }

    // Formatear el número de teléfono para Colombia (+57)
    let phoneNumber = guest.phone.replace(/\D/g, ""); // Remover caracteres no numéricos
    if (!phoneNumber.startsWith("57")) {
      phoneNumber = "57" + phoneNumber;
    }

    // Mensaje personalizado con enlace directo
    const invitationUrl = `${window.location.origin}/${eventSlug}?code=${guest.code}`;
    const message = `¡Hola ${guest.name}!

Te invitamos cordialmente a nuestra boda.

Accede a tu invitación digital aquí: ${invitationUrl}

¡Esperamos celebrar contigo este día tan especial!`;

    // URL de WhatsApp con el mensaje
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Abrir WhatsApp en nueva ventana
    window.open(whatsappUrl, "_blank");

    toast.success(`Enviando invitación por WhatsApp a ${guest.name}`);
  };


  const handleCopyCode = (guest: Guest) => {
    navigator.clipboard
      .writeText(guest.code)
      .then(() => {
        toast.success(`Código ${guest.code} copiado al portapapeles`);
      })
      .catch(() => {
        toast.error("Error al copiar el código");
      });
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

  const handleShowQR = (guest: Guest) => {
    setQrGuest(guest);
    setShowQRModal(true);
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
      {/* Header con estadísticas */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Invitados</h1>
            <p className="text-muted-foreground">
              Administra y da seguimiento a todos los invitados de tu boda
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={() => setShowGuestModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Invitado
            </Button>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Total Invitados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Total Invitados
                  {isFetchingStats && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGuests}</div>
                <p className="text-xs text-muted-foreground">Invitados registrados en el sistema</p>
              </CardContent>
            </Card>

            {/* Invitados Confirmados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invitados Confirmados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.confirmedGuests}</div>
                <p className="text-xs text-muted-foreground">Invitados principales confirmados</p>
              </CardContent>
            </Card>

            {/* Total Pendientes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invitados Pendientes</CardTitle>
                <XCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats.pendingGuests}</div>
                <p className="text-xs text-muted-foreground">Aún no han confirmado</p>
              </CardContent>
            </Card>

            {/* Total Asistentes Confirmados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Asistentes Confirmados</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalConfirmedAttendees}</div>
                <p className="text-xs text-muted-foreground">Invitados + acompañantes confirmados</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <div>Capacidad total: {stats.totalSlots}</div>
                  <div>Disponible: {stats.availableSlots} cupos</div>
                </div>
              </CardContent>
            </Card>

            {/* Acompañantes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acompañantes</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.confirmedCompanions}</div>
                <p className="text-xs text-muted-foreground">De {stats.totalCompanions} registrados</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <div>Pendientes: {stats.pendingCompanions}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Filtros de búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Barra de búsqueda */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Limpiar ({activeFiltersCount})
                </Button>
              )}
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Todos ({guests.length})
              </Button>
              <Button
                variant={statusFilter === "confirmed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmed")}
                className="text-green-700"
              >
                Confirmados ({guests.filter(g => g.confirmed).length})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className="text-orange-700"
              >
                Pendientes ({guests.filter(g => !g.confirmed).length})
              </Button>
              <Button
                variant={statusFilter === "companions-pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("companions-pending")}
                className="text-yellow-700"
              >
                Con acompañantes pendientes ({guests.filter(g => g.confirmed && g.companions.some(c => !c.confirmed)).length})
              </Button>
            </div>

            {/* Indicador de resultados */}
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredGuests.length} de {guests.length} invitados
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de invitados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Lista de Invitados
            {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          </CardTitle>
          <CardDescription>
            Administra y edita la información de todos los invitados
            {isFetching && <span className="text-blue-500 ml-2">• Actualizando...</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">
                {guests.length === 0 ? "No hay invitados registrados" : "No se encontraron invitados"}
              </h3>
              <p className="text-muted-foreground">
                {guests.length === 0
                  ? "¡Crea el primer invitado usando el botón de arriba!"
                  : "Intenta cambiar los filtros de búsqueda"
                }
              </p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para desktop */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Cupos</TableHead>
                      <TableHead>Acompañantes</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Confirmación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map(guest => {
                      const confirmed =
                        guest.companions.filter(c => c.confirmed).length +
                        (guest.confirmed ? 1 : 0);

                      return (
                        <TableRow key={guest.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                {guest.code}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyCode(guest)}
                                title="Copiar código"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell
                            className={`font-medium ${!guest.confirmed ? "text-yellow-400" : ""}`}
                          >
                            <div>
                              {guest.name}
                              {guest.notes && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]" title={guest.notes}>
                                  📝 {guest.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {guest.email && (
                                <div className="flex items-center gap-1">📧 {guest.email}</div>
                              )}
                              {guest.phone && (
                                <div className="flex items-center gap-1">📱 {guest.phone}</div>
                              )}
                              {!guest.email && !guest.phone && (
                                <span className="text-muted-foreground italic">Sin contacto</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {confirmed}/{guest.maxGuests}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {guest.companions.filter(c => c.confirmed).length}/
                                {guest.companions.length}
                              </span>
                              {guest.companions.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  de {guest.maxGuests - 1} max
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {guest.confirmed ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Confirmado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="mr-1 h-3 w-3" />
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {!guest.confirmed && (
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmGuest(guest)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Confirmar
                                </Button>
                              )}
                              {guest.maxGuests > 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleManageCompanions(guest)}
                                >
                                  <Users className="mr-1 h-3 w-3" />
                                  Acompañantes
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowQR(guest)}
                                title="Ver QR de invitación"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              {guest.phone && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendWhatsApp(guest)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Enviar invitación por WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(guest)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(guest)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {guest.confirmed && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Cancelar confirmación"
                                  onClick={() => handleCancelGuest(guest)}
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Vista de cards para móvil y tablet */}
              <div className="lg:hidden space-y-4">
                {filteredGuests.map(guest => {
                  const confirmed =
                    guest.companions.filter(c => c.confirmed).length + (guest.confirmed ? 1 : 0);

                  return (
                    <Card key={guest.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="font-mono">
                                  {guest.code}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleCopyCode(guest)}
                                  title="Copiar código"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              {guest.confirmed ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Confirmado
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Pendiente
                                </Badge>
                              )}
                            </div>
                            <h3 className={`font-semibold text-lg ${!guest.confirmed ? "text-yellow-400" : ""}`}>
                              {guest.name}
                            </h3>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          {guest.email && (
                            <div className="flex items-center gap-2">
                              <span>📧</span>
                              <span>{guest.email}</span>
                            </div>
                          )}
                          {guest.phone && (
                            <div className="flex items-center gap-2">
                              <span>📱</span>
                              <span>{guest.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {confirmed}/{guest.maxGuests} cupos utilizados
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {guest.companions.filter(c => c.confirmed).length}/
                              {guest.companions.length} acompañantes
                            </span>
                            {guest.companions.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                (máx: {guest.maxGuests - 1})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {!guest.confirmed && (
                            <Button
                              onClick={() => handleConfirmGuest(guest)}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirmar Asistencia
                            </Button>
                          )}
                          <div className="flex gap-2">
                            {guest.maxGuests > 1 && (
                              <Button
                                onClick={() => handleManageCompanions(guest)}
                                variant="outline"
                                className="flex-1"
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Gestionar Acompañantes
                              </Button>
                            )}
                          </div>

                          {/* Acciones adicionales */}
                          <div className="flex gap-2 pt-2 border-t">
                            {guest.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendWhatsApp(guest)}
                                className="flex-1 text-green-600 hover:text-green-700"
                                title="Enviar invitación por WhatsApp"
                              >
                                <MessageSquare className="mr-1 h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(guest)}
                              className="flex-1"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(guest)}
                              className="flex-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                            </Button>
                            {guest.confirmed && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelGuest(guest)}
                                className="flex-1 text-yellow-600 hover:text-yellow-700"
                              >
                                <XCircle className="mr-1 h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para gestionar acompañantes - Responsive */}
      <Dialog open={showCompanions} onOpenChange={setShowCompanions}>
        <DialogContent className="max-w-2xl px-2 sm:px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Gestionar Acompañantes</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedGuest && `Administra los acompañantes de ${selectedGuest.name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedGuest &&
            (() => {
              const currentGuest = guests.find(g => g.id === selectedGuest.id) || selectedGuest;
              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <div className="mb-2 sm:mb-0">
                      <h4 className="font-semibold text-base sm:text-lg">Invitado Principal</h4>
                      <p className="text-sm text-muted-foreground">{currentGuest.name}</p>
                    </div>
                    <Badge variant={currentGuest.confirmed ? "default" : "secondary"}>
                      {currentGuest.confirmed ? "Confirmado" : "Pendiente"}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                      <h4 className="font-semibold text-base sm:text-lg">
                        Acompañantes ({currentGuest.companions.length}/{currentGuest.maxGuests - 1}{" "}
                        máximo)
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
                          />
                          <div className="flex gap-2 mt-2 sm:mt-0">
                            <Button
                              size="sm"
                              onClick={handleAddCompanion}
                              disabled={
                                !newCompanionName.trim() || createCompanionMutation.isPending
                              }
                              className="w-full sm:w-auto"
                            >
                              Agregar
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
                              <p className="text-sm text-muted-foreground">
                                Acompañante {index + 1}
                              </p>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Badge variant={companion.confirmed ? "default" : "secondary"}>
                                {companion.confirmed ? "Confirmado" : "Pendiente"}
                              </Badge>
                              <Button
                                size="sm"
                                variant={companion.confirmed ? "outline" : "default"}
                                onClick={() =>
                                  handleToggleCompanion(companion.id, !companion.confirmed)
                                }
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

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total confirmados:</span>{" "}
                        {currentGuest.companions.filter(c => c.confirmed).length +
                          (currentGuest.confirmed ? 1 : 0)}
                      </div>
                      <div>
                        <span className="font-medium">Cupos disponibles:</span>{" "}
                        {currentGuest.maxGuests -
                          currentGuest.companions.filter(c => c.confirmed).length -
                          (currentGuest.confirmed ? 1 : 0)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompanions(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para crear/editar invitado */}
      <Dialog open={showGuestModal} onOpenChange={setShowGuestModal}>
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
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
                  onChange={e =>
                    setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 1 })
                  }
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
                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas internas visibles solo para el admin..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <div className="flex gap-2 w-full">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingGuest ? "Actualizar" : "Crear"} Invitado
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal QR por invitado */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR de Invitación</DialogTitle>
            <DialogDescription>
              {qrGuest?.name} — Código: <span className="font-mono font-bold">{qrGuest?.code}</span>
            </DialogDescription>
          </DialogHeader>
          {qrGuest && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG
                value={`${window.location.origin}/${eventSlug}?code=${qrGuest.code}`}
                size={220}
                level="M"
              />
              <p className="text-xs text-muted-foreground text-center break-all">
                {window.location.origin}/{eventSlug}?code={qrGuest.code}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${eventSlug}?code=${qrGuest.code}`);
                  toast.success("Enlace copiado al portapapeles");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar enlace
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestManager;
