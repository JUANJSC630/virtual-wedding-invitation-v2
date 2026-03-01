import { useEffect, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { AdminUser, Event, Guest } from "@/types";

import { EventContext } from "@/context/EventContext";

import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";
import GuestCodeEntry from "@/components/GuestCodeEntry";
import GuestInfo from "@/components/GuestInfo";
import LandingPage from "@/components/LandingPage";
import InvitationSection1 from "@/components/InvitationSection1";
import InvitationSection2 from "@/components/InvitationSection2";
import InvitationSection3 from "@/components/InvitationSection3";
import InvitationSection4 from "@/components/InvitationSection4";
import InvitationSection5 from "@/components/InvitationSection5";
import InvitationSection6 from "@/components/InvitationSection6";
import InvitationSection7 from "@/components/InvitationSection7";
import InvitationSection8 from "@/components/InvitationSection8";
import InvitationSection9 from "@/components/InvitationSection9";
import MasterDashboard from "@/components/master/MasterDashboard";

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

// ─── Panel de admin (client) ──────────────────────────────────────────────────

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.user) setUser(data.user); })
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
    return <AdminLogin onLogin={(loggedUser) => {
      if (loggedUser.role === "master") {
        navigate("/master");
      } else {
        setUser(loggedUser);
      }
    }} />;
  }

  if (user.role === "master") {
    navigate("/master");
    return null;
  }

  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
};

// ─── Panel de master ──────────────────────────────────────────────────────────

const MasterPanel: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.user) setUser(data.user); })
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
    return <AdminLogin onLogin={(loggedUser) => {
      if (loggedUser.role !== "master") {
        navigate("/admin");
      } else {
        setUser(loggedUser);
      }
    }} />;
  }

  if (user.role !== "master") {
    navigate("/admin");
    return null;
  }

  return <MasterDashboard user={user} onLogout={() => setUser(null)} />;
};

// ─── Invitación pública (por slug) ───────────────────────────────────────────

const WeddingInvitation: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const eventSlug = slug!;

  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const urlCode = new URLSearchParams(window.location.search).get("code");

    fetch(`/api/events/${eventSlug}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data) setEvent(data); })
      .catch(() => {})
      .finally(() => setEventLoading(false));

    if (urlCode) {
      fetch("/api/guests/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: urlCode, eventSlug }),
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.guest) {
            setValidatedCode(urlCode.toUpperCase());
            setGuest(data.guest);
          }
        })
        .catch(() => {});
    }
  }, [eventSlug]);

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
    return <GuestCodeEntry eventSlug={eventSlug} onValidGuest={handleValidGuest} />;
  }

  if (!showInvitation) {
    return (
      <GuestInfo
        eventSlug={eventSlug}
        guest={guest}
        onContinue={() => setShowInvitation(true)}
      />
    );
  }

  return (
    <EventContext.Provider value={{ event, loading: eventLoading }}>
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
    </EventContext.Provider>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/master" element={<MasterPanel />} />
          <Route path="/:slug" element={<WeddingInvitation />} />
        </Routes>
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
    </BrowserRouter>
  );
}

export default App;
