import { useEffect, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";

import { Guest } from "@/types";

import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";
import GuestCodeEntry from "@/components/GuestCodeEntry";
import GuestInfo from "@/components/GuestInfo";
import InvitationSection1 from "@/components/InvitationSection1";
import InvitationSection2 from "@/components/InvitationSection2";
import InvitationSection3 from "@/components/InvitationSection3";
import InvitationSection4 from "@/components/InvitationSection4";
import InvitationSection5 from "@/components/InvitationSection5";
import InvitationSection6 from "@/components/InvitationSection6";
import InvitationSection7 from "@/components/InvitationSection7";
import InvitationSection8 from "@/components/InvitationSection8";
import InvitationSection9 from "@/components/InvitationSection9";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

// ─── Panel de admin con manejo de sesión ─────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

const AdminPanel: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Verificar si ya hay una sesión activa al cargar
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLogin={setUser} />;
  }

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
};

// ─── Invitación pública ───────────────────────────────────────────────────────

const WeddingInvitation: React.FC = () => {
  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white h-screen w-full">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/fondo.png')` }}
        />
        <div className="relative z-10 text-center p-4">
          <p className="text-xl font-serif text-gray-800">Cargando invitación...</p>
          <div className="flex justify-center gap-2 mt-2">
            {[0, 300, 600].map(delay => (
              <div
                key={delay}
                className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleValidGuest = (code: string, guestData: Guest) => {
    setValidatedCode(code);
    setGuest(guestData);
  };

  if (!validatedCode || !guest) {
    return <GuestCodeEntry onValidGuest={handleValidGuest} />;
  }

  if (!showInvitation) {
    return <GuestInfo guest={guest} onContinue={() => setShowInvitation(true)} />;
  }

  return (
    <main className="w-full flex flex-col justify-center items-center bg-white" role="main">
      <div className="max-w-2xl mx-auto">
        <InvitationSection1 />
        <InvitationSection2 />
        <InvitationSection3 />
        <InvitationSection4 />
        <InvitationSection5 />
        <InvitationSection6 />
        <InvitationSection9 />
        <InvitationSection7 />
        <InvitationSection8 />
      </div>
    </main>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const isAdminRoute = window.location.pathname === "/admin";

function App(): React.JSX.Element {
  if (isAdminRoute) {
    return (
      <>
        <AdminPanel />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WeddingInvitation />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff", borderRadius: "8px" },
          success: { style: { background: "#10b981" } },
          error: { style: { background: "#ef4444" } },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
