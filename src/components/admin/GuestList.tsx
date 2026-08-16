import {
  CheckCircle,
  Copy,
  Edit,
  MessageSquare,
  QrCode,
  RefreshCw,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { Guest } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GuestListProps {
  guests: Guest[];
  totalGuests: number;
  isFetching: boolean;
  eventSlug: string;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
  onConfirm: (guest: Guest) => void;
  onCancel: (guest: Guest) => void;
  onManageCompanions: (guest: Guest) => void;
  onShowQR: (guest: Guest) => void;
  onSendWhatsApp: (guest: Guest) => void;
  onCopyCode: (guest: Guest) => void;
}

const GuestList: React.FC<GuestListProps> = ({
  guests,
  totalGuests,
  isFetching,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
  onManageCompanions,
  onShowQR,
  onSendWhatsApp,
  onCopyCode,
}) => {
  if (guests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Lista de Invitados
            {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          </CardTitle>
          <CardDescription>Administra y edita la información de todos los invitados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">
              {totalGuests === 0 ? "No hay invitados registrados" : "No se encontraron invitados"}
            </h3>
            <p className="text-muted-foreground">
              {totalGuests === 0
                ? "¡Crea el primer invitado usando el botón de arriba!"
                : "Intenta cambiar los filtros de búsqueda"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
        {/* Desktop table */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Contacto</TableHead>
                <TableHead className="hidden sm:table-cell">Cupos</TableHead>
                <TableHead className="hidden lg:table-cell">Acompañantes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Confirmación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map(guest => {
                const confirmedCount =
                  guest.companions.filter(c => c.confirmed).length + (guest.confirmed ? 1 : 0);

                return (
                  <TableRow key={guest.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {guest.code}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onCopyCode(guest)}
                            title="Copiar código"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {guest.accessCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            👁 {guest.accessCount} {guest.accessCount === 1 ? "acceso" : "accesos"}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className={`font-medium ${!guest.confirmed ? "text-yellow-400" : ""}`}>
                      <div>
                        {guest.name}
                        {/* En móvil, cupos van bajo el nombre (columna oculta) */}
                        <span className="sm:hidden ml-2 text-xs text-muted-foreground whitespace-nowrap">
                          · {confirmedCount}/{guest.maxGuests} cupos
                        </span>
                        {guest.notes && (
                          <p
                            className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]"
                            title={guest.notes}
                          >
                            📝 {guest.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-1 text-sm">
                        {guest.email && <div>📧 {guest.email}</div>}
                        {guest.phone && <div>📱 {guest.phone}</div>}
                        {!guest.email && !guest.phone && (
                          <span className="text-muted-foreground italic">Sin contacto</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{confirmedCount}/{guest.maxGuests}</span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell">
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

                    <TableCell className="hidden lg:table-cell">
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
                            onClick={() => onConfirm(guest)}
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
                            onClick={() => onManageCompanions(guest)}
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
                          onClick={() => onShowQR(guest)}
                          title="Ver QR de invitación"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        {guest.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSendWhatsApp(guest)}
                            className="text-green-600 hover:text-green-700"
                            title="Enviar invitación por WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => onEdit(guest)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(guest)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {guest.confirmed && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Cancelar confirmación"
                            onClick={() => onCancel(guest)}
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

        {/* Mobile cards */}
        <div className="lg:hidden space-y-4">
          {guests.map(guest => {
            const confirmedCount =
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
                            onClick={() => onCopyCode(guest)}
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
                      <span>{confirmedCount}/{guest.maxGuests} cupos utilizados</span>
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
                    {guest.accessCount !== undefined && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm">👁 {guest.accessCount} {guest.accessCount === 1 ? "acceso" : "accesos"}</span>
                      </div>
                    )}
                    {guest.notes && (
                      <div className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                        📝 {guest.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!guest.confirmed && (
                      <Button
                        onClick={() => onConfirm(guest)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Asistencia
                      </Button>
                    )}
                    {guest.maxGuests > 1 && (
                      <Button
                        onClick={() => onManageCompanions(guest)}
                        variant="outline"
                        className="w-full"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Gestionar Acompañantes
                      </Button>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      {guest.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSendWhatsApp(guest)}
                          className="flex-1 text-green-600 hover:text-green-700"
                          title="Enviar invitación por WhatsApp"
                        >
                          <MessageSquare className="mr-1 h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(guest)}
                        className="flex-1"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(guest)}
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                      </Button>
                      {guest.confirmed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(guest)}
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
      </CardContent>
    </Card>
  );
};

export default GuestList;
