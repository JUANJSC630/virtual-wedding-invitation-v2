import { ArrowLeft, BarChart3, Edit2, MonitorSmartphone, Settings, Users2 } from "lucide-react";

import { getHonoreesNames } from "@/lib/honorees";
import { EventWithStats } from "@/types";

import { sanitizeQuestions } from "@/lib/rsvpQuestions";

import { GuestScopeContext } from "@/context/GuestScopeContext";

import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import GuestManager from "@/components/admin/GuestManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  event: EventWithStats;
  onBack: () => void;
  onEdit: () => void;
  onManageAdmins: () => void;
}

/**
 * Ventana dedicada de un evento — da al master la MISMA experiencia de gestión
 * que el admin cliente, pero para cualquier evento. Reusa GuestManager y
 * AnalyticsDashboard apuntándolos a /api/master/events/:id vía GuestScopeContext.
 */
export function EventDetail({ event, onBack, onEdit, onManageAdmins }: Props) {
  const base = `/api/master/events/${event.id}`;
  const title = getHonoreesNames(event) || event.slug;

  return (
    <GuestScopeContext.Provider value={base}>
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
                <Edit2 className="h-3.5 w-3.5" /> Editar invitación
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
            </div>
          </div>
        </div>

        {/* Tabs: gestión completa del evento */}
        <Tabs defaultValue="guests" className="w-full">
          <TabsList>
            <TabsTrigger value="guests" className="gap-2">
              <Users2 className="h-4 w-4" /> Invitados
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Analítica
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guests" className="pt-4">
            <GuestManager
              eventSlug={event.slug}
              eventId={event.id}
              rsvpQuestions={sanitizeQuestions(event.config?.rsvpQuestions)}
            />
          </TabsContent>
          <TabsContent value="analytics" className="pt-4">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </GuestScopeContext.Provider>
  );
}
