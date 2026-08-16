import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit2,
  FileUp,
  MonitorSmartphone,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";

import { getHonoreesNames } from "@/lib/honorees";
import { EventWithStats, Guest } from "@/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  event: EventWithStats;
  onBack: () => void;
  onEdit: () => void;
  onManageAdmins: () => void;
  onImport: () => void;
}

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Ventana dedicada de un evento: KPIs propios, lista de invitados con estado y
 * confirmaciones recientes. Da la "claridad por evento" que las stats globales
 * no ofrecen. Lee de GET /api/master/events/:id/guests.
 */
export function EventDetail({ event, onBack, onEdit, onManageAdmins, onImport }: Props) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/master/events/${event.id}/guests`, { credentials: "include" })
      .then(r => (r.ok ? r.json() : []))
      .then((data: Guest[]) => setGuests(Array.isArray(data) ? data : []))
      .catch(() => setGuests([]))
      .finally(() => setLoading(false));
  }, [event.id]);

  const kpis = useMemo(() => {
    const confirmed = guests.filter(g => g.confirmed).length;
    const companionsConfirmed = guests.reduce(
      (n, g) => n + (g.companions?.filter(c => c.confirmed).length ?? 0),
      0
    );
    return {
      total: guests.length,
      confirmed,
      pending: guests.length - confirmed,
      attendees: confirmed + companionsConfirmed,
      accesses: event.stats?.totalAccesses ?? 0,
    };
  }, [guests, event.stats]);

  const recent = useMemo(
    () =>
      guests
        .filter(g => g.confirmed && g.confirmedAt)
        .sort((a, b) => new Date(b.confirmedAt!).getTime() - new Date(a.confirmedAt!).getTime())
        .slice(0, 6),
    [guests]
  );

  const title = getHonoreesNames(event) || event.slug;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a eventos
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold sm:text-2xl">{title}</h2>
              <Badge variant={event.isActive ? "default" : "secondary"}>
                {event.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">/{event.slug}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onEdit} className="gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/${event.slug}?preview=1`, "_blank")}
              className="gap-1.5"
            >
              <MonitorSmartphone className="h-3.5 w-3.5" /> Vista previa
            </Button>
            <Button size="sm" variant="outline" onClick={onManageAdmins} className="gap-1.5">
              <Settings className="h-3.5 w-3.5" /> Admins
            </Button>
            <Button size="sm" variant="outline" onClick={onImport} className="gap-1.5">
              <FileUp className="h-3.5 w-3.5" /> Importar
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs de ESTE evento */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Invitados" value={kpis.total} />
        <Kpi label="Confirmados" value={kpis.confirmed} accent="text-green-600" />
        <Kpi label="Pendientes" value={kpis.pending} accent="text-amber-600" />
        <Kpi label="Asistentes" value={kpis.attendees} accent="text-blue-600" />
        <Kpi label="Accesos" value={kpis.accesses} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de invitados */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Invitados
              {!loading && <span className="text-sm font-normal text-muted-foreground">({kpis.total})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando invitados…</p>
            ) : guests.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Aún no hay invitados.</p>
                <Button size="sm" variant="outline" onClick={onImport} className="mt-3 gap-1.5">
                  <FileUp className="h-3.5 w-3.5" /> Importar invitados (CSV)
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Cupos</TableHead>
                    <TableHead className="hidden md:table-cell">Acompañantes</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Accesos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map(g => {
                    const compConfirmed = g.companions?.filter(c => c.confirmed).length ?? 0;
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono text-xs">{g.code}</TableCell>
                        <TableCell className="font-medium">
                          {g.name}
                          <span className="ml-2 text-xs text-muted-foreground sm:hidden">
                            · {compConfirmed + (g.confirmed ? 1 : 0)}/{g.maxGuests}
                          </span>
                        </TableCell>
                        <TableCell>
                          {g.confirmed ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" /> Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {compConfirmed + (g.confirmed ? 1 : 0)}/{g.maxGuests}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                            {compConfirmed}/{g.companions?.length ?? 0}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                          {g.accessCount ?? 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Confirmaciones recientes de ESTE evento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" /> Confirmaciones recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : recent.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Sin confirmaciones aún.</p>
            ) : (
              recent.map(g => (
                <div key={g.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium">{g.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(g.confirmedAt!).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
