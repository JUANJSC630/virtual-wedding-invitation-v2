import React from "react";

import { BarChart3, Calendar, Clock, Eye, RefreshCw, Users } from "lucide-react";

import { useAnalytics } from "@/hooks/useGuests";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  recentAccesses: Array<{
    id: string;
    guestCode: string;
    accessedAt: string;
  }>;
  accessedButNotConfirmed: Array<{
    id: string;
    name: string;
    code: string;
    companions: Array<{ id: string; name: string; confirmed: boolean }>;
  }>;
  neverAccessed: Array<{
    code: string;
    name: string;
    createdAt: string;
  }>;
  accessStats: Array<{
    guestCode: string;
    _count: { guestCode: number };
  }>;
  accessesByDay: Record<string, number>;
  summary: {
    totalAccesses: number;
    uniqueAccessedCodes: number;
    neverAccessedCount: number;
    accessedButNotConfirmedCount: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, isFetching, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error al cargar analytics: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = analytics as AnalyticsData;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        label: date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
        accesses: data.accessesByDay[dateStr] || 0,
      });
    }
    return days;
  };

  const weeklyData = getLastSevenDays();
  const maxAccesses = Math.max(...weeklyData.map(d => d.accesses), 1);

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accesos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalAccesses}</div>
            <p className="text-xs text-muted-foreground">Accesos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Códigos Usados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.uniqueAccessedCodes}</div>
            <p className="text-xs text-muted-foreground">Códigos únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Acceso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.neverAccessedCount}</div>
            <p className="text-xs text-muted-foreground">Nunca accedieron</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Confirmar</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.accessedButNotConfirmedCount}</div>
            <p className="text-xs text-muted-foreground">Accedieron sin confirmar</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de accesos por día */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Accesos por Día (Últimos 7 días)
            {isFetching && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyData.map(day => (
              <div key={day.date} className="flex items-center space-x-3">
                <div className="w-16 text-sm font-medium">{day.label}</div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(day.accesses / maxAccesses) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-sm font-bold text-blue-600">{day.accesses}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accesos recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Últimos Accesos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentAccesses.length > 0 ? (
                data.recentAccesses.map(access => (
                  <div
                    key={access.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="font-medium text-sm">{access.guestCode}</div>
                    <div className="text-xs text-gray-500">{formatDate(access.accessedAt)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No hay accesos registrados
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Códigos más accedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Códigos Más Accedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.accessStats.length > 0 ? (
                data.accessStats.map((stat, index) => (
                  <div
                    key={stat.guestCode}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="font-medium text-sm">{stat.guestCode}</div>
                    </div>
                    <div className="text-sm font-bold text-blue-600">
                      {stat._count.guestCode} accesos
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No hay estadísticas disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de invitados que accedieron pero no confirmaron */}
      {data.accessedButNotConfirmed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Calendar className="h-5 w-5" />
              Accedieron pero No Confirmaron ({data.accessedButNotConfirmed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.accessedButNotConfirmed.map(guest => (
                <div key={guest.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="font-medium text-amber-800">{guest.name}</div>
                  <div className="text-sm text-amber-600">Código: {guest.code}</div>
                  {guest.companions.length > 0 && (
                    <div className="text-xs text-amber-600 mt-1">
                      {guest.companions.length} acompañante(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de códigos nunca accedidos */}
      {data.neverAccessed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Eye className="h-5 w-5" />
              Códigos Nunca Accedidos ({data.neverAccessed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.neverAccessed.slice(0, 12).map(guest => (
                <div key={guest.code} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-red-800 text-sm">{guest.name}</div>
                  <div className="text-xs text-red-600">Código: {guest.code}</div>
                  <div className="text-xs text-red-500 mt-1">
                    Creado: {formatDate(guest.createdAt)}
                  </div>
                </div>
              ))}
              {data.neverAccessed.length > 12 && (
                <div className="p-3 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-600">
                  +{data.neverAccessed.length - 12} más
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
