import React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BarChart3, Heart, Users2 } from "lucide-react";

import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import GuestManager from "@/components/admin/GuestManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Query client para el dashboard
const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AdminDashboard: React.FC = () => {
  // Verificar si es super admin basado en los parámetros de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const isSuperAdmin = urlParams.get('super_admin') === 'true';

  return (
    <QueryClientProvider client={adminQueryClient}>
      <div className="min-h-screen bg-background">
        {/* Header minimalista */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex flex-col sm:flex-row h-auto sm:h-16 items-start sm:items-center justify-between py-2 sm:py-0 gap-2 sm:gap-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Heart className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-semibold leading-tight">
                    Panel de Administración
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    Sistema de Gestión de Boda
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="container py-6">
          {isSuperAdmin ? (
            <Tabs defaultValue="guests" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="guests" className="flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  Gestión de Invitados
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics de Accesos
                </TabsTrigger>
              </TabsList>
              <TabsContent value="guests" className="mt-6">
                <GuestManager />
              </TabsContent>
              <TabsContent value="analytics" className="mt-6">
                <AnalyticsDashboard />
              </TabsContent>
            </Tabs>
          ) : (
            <GuestManager />
          )}
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default AdminDashboard;
