import { useEffect, useState } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { AdminUser, Event, Guest, SectionsConfig, ThemeConfig } from "@/types";

import { queryClient } from "@/lib/query-client";

import { AssetContext, DEFAULT_ASSETS } from "@/context/AssetContext";
import { EventContext } from "@/context/EventContext";
import { GuestContext } from "@/context/GuestContext";
import { ThemeProvider } from "@/context/ThemeContext";

import AdminDashboard from "@/components/AdminDashboard";
import { PanelErrorBoundary, SectionErrorBoundary } from "@/components/ErrorBoundary";
import GuestCodeEntry from "@/components/GuestCodeEntry";
import GuestInfo from "@/components/GuestInfo";
import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import InvitationSection1 from "@/components/InvitationSection1";
import InvitationSection2 from "@/components/InvitationSection2";
import InvitationSection3 from "@/components/InvitationSection3";
import InvitationSection4 from "@/components/InvitationSection4";
import InvitationSection5 from "@/components/InvitationSection5";
import InvitationSection6 from "@/components/InvitationSection6";
import InvitationSection7 from "@/components/InvitationSection7";
import InvitationSection8 from "@/components/InvitationSection8";
import InvitationSection9 from "@/components/InvitationSection9";
import InvitationSectionGallery from "@/components/InvitationSectionGallery";
import MasterDashboard from "@/components/master/MasterDashboard";

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

  if (!user) { navigate("/login", { replace: true }); return null; }
  if (user.role === "master") { navigate("/master", { replace: true }); return null; }

  return (
    <PanelErrorBoundary>
      <AdminDashboard user={user} onLogout={() => { setUser(null); navigate("/login"); }} />
    </PanelErrorBoundary>
  );
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

  if (!user) { navigate("/login", { replace: true }); return null; }
  if (user.role !== "master") { navigate("/admin", { replace: true }); return null; }

  return (
    <PanelErrorBoundary>
      <MasterDashboard user={user} onLogout={() => { setUser(null); navigate("/login"); }} />
    </PanelErrorBoundary>
  );
};

// ─── Invitación pública (por slug) ───────────────────────────────────────────

const PREVIEW_GUEST: Guest = {
  id: "preview", eventId: "", code: "PREVIEW", name: "Vista Previa",
  maxGuests: 2, confirmed: true,
  confirmedAt: new Date(),
  createdAt: new Date(), updatedAt: new Date(),
  companions: [{ id: "preview-c1", guestId: "preview", name: "Acompañante", confirmed: true, createdAt: new Date(), updatedAt: new Date() }],
};

const WeddingInvitation: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const eventSlug = slug!;

  const isPreview = new URLSearchParams(window.location.search).get("preview") === "1";

  const [validatedCode, setValidatedCode] = useState<string | null>(isPreview ? "PREVIEW" : null);
  const [guest, setGuest] = useState<Guest | null>(isPreview ? PREVIEW_GUEST : null);
  const [showInvitation, setShowInvitation] = useState(isPreview);
  const [event, setEvent] = useState<Event | null>(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventNotFound, setEventNotFound] = useState(false);

  useEffect(() => {
    const urlCode = new URLSearchParams(window.location.search).get("code");

    fetch(`/api/events/${eventSlug}`)
      .then(res => {
        if (!res.ok) { setEventNotFound(true); return null; }
        return res.json();
      })
      .then(data => { if (data) setEvent(data); })
      .catch(() => setEventNotFound(true))
      .finally(() => setEventLoading(false));

    if (urlCode && !isPreview) {
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
  }, [eventSlug, isPreview]);

  if (eventLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${(event?.assets as Record<string, string>)?.background ?? "/fondo.png"}')` }}
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

  if (eventNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3 p-8">
          <p className="text-6xl">💌</p>
          <h1 className="text-2xl font-serif text-gray-700">Invitación no encontrada</h1>
          <p className="text-gray-500 text-sm">
            El enlace que usaste no corresponde a ninguna invitación activa.
          </p>
        </div>
      </div>
    );
  }

  const handleValidGuest = (code: string, guestData: Guest) => {
    setValidatedCode(code);
    setGuest(guestData);
  };

  if (!validatedCode || !guest) {
    return <GuestCodeEntry eventSlug={eventSlug} event={event} onValidGuest={handleValidGuest} />;
  }

  if (!showInvitation) {
    return (
      <GuestInfo
        eventSlug={eventSlug}
        guest={guest}
        event={event}
        onContinue={() => setShowInvitation(true)}
      />
    );
  }

  // Merge: only override defaults with non-empty strings from event assets
  const mergedAssets = {
    ...DEFAULT_ASSETS,
    ...Object.fromEntries(
      Object.entries((event?.assets as Record<string, string>) ?? {}).filter(([, v]) => typeof v === "string" && v.trim() !== "")
    ),
  };

  const sec = (event?.config?.sections ?? {}) as Partial<SectionsConfig>;
  const show = (key: keyof SectionsConfig) => sec[key] ?? true;

  return (
    <EventContext.Provider value={{ event, loading: eventLoading }}>
    <ThemeProvider theme={(event?.theme as ThemeConfig) ?? {}}>
    <AssetContext.Provider value={mergedAssets}>
    <GuestContext.Provider value={{ guest, setGuest: (g: Guest) => setGuest(g), code: validatedCode, eventSlug }}>
      {isPreview && (
        <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <span>👁 Modo Vista Previa — los datos son ficticios</span>
          <button onClick={() => window.close()} className="rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30">
            Cerrar
          </button>
        </div>
      )}
      <main className="w-full flex flex-col justify-center items-center bg-white" role="main" style={isPreview ? { paddingTop: "2.5rem" } : undefined}>
        <div className="max-w-2xl mx-auto">
          {show("showVerse")    && <SectionErrorBoundary><InvitationSection1 /></SectionErrorBoundary>}
          {show("showPhotos")   && <SectionErrorBoundary><InvitationSection2 /></SectionErrorBoundary>}
          {show("showNames")    && <SectionErrorBoundary><InvitationSection3 /></SectionErrorBoundary>}
          {show("showPhotos")   && <SectionErrorBoundary><InvitationSection4 /></SectionErrorBoundary>}
          {show("showGallery")  && <SectionErrorBoundary><InvitationSectionGallery /></SectionErrorBoundary>}
          {show("showFamily")   && <SectionErrorBoundary><InvitationSection5 /></SectionErrorBoundary>}
          {show("showVenues")   && <SectionErrorBoundary><InvitationSection6 /></SectionErrorBoundary>}
          {show("showPhotos")   && <SectionErrorBoundary><InvitationSection9 /></SectionErrorBoundary>}
          {show("showTimeline") && <SectionErrorBoundary><InvitationSection7 /></SectionErrorBoundary>}
          {show("showGifts")    && <SectionErrorBoundary><InvitationSection8 /></SectionErrorBoundary>}
        </div>
      </main>
    </GuestContext.Provider>
    </AssetContext.Provider>
    </ThemeProvider>
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
          <Route path="/login" element={<LoginPage />} />
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
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
