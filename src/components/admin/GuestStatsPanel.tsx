import { CheckCircle, RefreshCw, UserCheck, Users, XCircle } from "lucide-react";

import { useGuestStats } from "@/hooks/useGuests";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GuestStats {
  totalGuests: number;
  confirmedGuests: number;
  pendingGuests: number;
  totalConfirmedAttendees: number;
  totalSlots: number;
  availableSlots: number;
  confirmedCompanions: number;
  totalCompanions: number;
  pendingCompanions: number;
}

const GuestStatsPanel: React.FC = () => {
  const { data: stats, isFetching } = useGuestStats();

  if (!stats) return null;

  const s = stats as GuestStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Total Invitados
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{s.totalGuests}</div>
          <p className="text-xs text-muted-foreground">Invitados registrados en el sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invitados Confirmados</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{s.confirmedGuests}</div>
          <p className="text-xs text-muted-foreground">Invitados principales confirmados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invitados Pendientes</CardTitle>
          <XCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{s.pendingGuests}</div>
          <p className="text-xs text-muted-foreground">Aún no han confirmado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Asistentes Confirmados</CardTitle>
          <UserCheck className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{s.totalConfirmedAttendees}</div>
          <p className="text-xs text-muted-foreground">Invitados + acompañantes confirmados</p>
          <div className="mt-2 text-xs text-muted-foreground">
            <div>Capacidad total: {s.totalSlots}</div>
            <div>Disponible: {s.availableSlots} cupos</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Acompañantes</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{s.confirmedCompanions}</div>
          <p className="text-xs text-muted-foreground">De {s.totalCompanions} registrados</p>
          <div className="mt-2 text-xs text-muted-foreground">
            <div>Pendientes: {s.pendingCompanions}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestStatsPanel;
