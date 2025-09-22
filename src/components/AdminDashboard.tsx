import React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Heart, Users2 } from "lucide-react";

import GuestManager from "@/components/admin/GuestManager";

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
          <GuestManager />
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default AdminDashboard;
