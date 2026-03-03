import React, { useEffect, useState } from "react";

import { AlertCircle, User } from "lucide-react";

import { Event, Guest } from "@/types";

import { useValidateGuestCode } from "@/hooks/useGuests";

import { Button } from "@/components/ui/button";

interface GuestCodeEntryProps {
  eventSlug: string;
  event: Event | null;
  onValidGuest: (code: string, guest: Guest) => void;
}

const GuestCodeEntry: React.FC<GuestCodeEntryProps> = ({ eventSlug, event, onValidGuest }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const validateMutation = useValidateGuestCode(eventSlug);
  const storageKey = `guestCode_${eventSlug}`;

  // ── Labels ────────────────────────────────────────────────────────────────
  const labels      = event?.config?.labels;
  const title       = labels?.entryTitle     ?? "¡NOS ENCANTARÍA QUE SEAS PARTE DE ESTE DÍA TAN ESPECIAL!";
  const subtitle    = labels?.entrySubtitle  ?? "Ingresa tu código para continuar:";
  const buttonLabel = labels?.entryButton    ?? "Ver Invitación";
  const savedLabel  = labels?.entrySavedCode ?? "Código guardado anteriormente";

  // ── Theme ─────────────────────────────────────────────────────────────────
  const t = (event?.theme ?? {}) as Record<string, string | number>;
  const primaryColor   = (t.primaryColor as string)   || "#162b4e";
  const accentColor    = (t.accentColor  as string)   || "#bfa15a";
  const actionColor    = (t.actionColor  as string)   || "#466691";
  const textColor      = (t.textColor    as string)   || "#374151";
  const overlayOpacity = (t.overlayOpacity != null ? Number(t.overlayOpacity) : 20) / 100;
  const cardOpacity    = (t.cardOpacity    != null ? Number(t.cardOpacity)    : 30) / 100;
  const cardBgColor    = (t.cardBgColor  as string) || "#ffffff";
  const inputBgColor   = (t.inputBgColor as string) || "#ffffff";
  const inputOpacity   = (t.inputOpacity  != null ? Number(t.inputOpacity)  : 70) / 100;
  // Convert hex to rgb for use with opacity
  const cardRgb  = cardBgColor.match( /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)?.slice(1).map(x => parseInt(x, 16)) ?? [255, 255, 255];
  const inputRgb = inputBgColor.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)?.slice(1).map(x => parseInt(x, 16)) ?? [255, 255, 255];

  // ── Background ────────────────────────────────────────────────────────────
  const bgImage = (event?.assets as Record<string, string>)?.entryBg?.trim()
    || event?.heroPhotoUrl
    || "/fondo.png";

  useEffect(() => {
    const savedCode = localStorage.getItem(storageKey);
    if (savedCode) setCode(savedCode);
  }, [storageKey]);

  useEffect(() => {
    if (code && localStorage.getItem(storageKey) === code && !error) {
      setShowSavedMsg(true);
      const timer = setTimeout(() => setShowSavedMsg(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowSavedMsg(false);
    }
    return undefined;
  }, [code, error, storageKey]);

  setTimeout(() => { if (error) setError(""); }, 5000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) { setError("Por favor ingresa tu código de invitación"); return; }

    try {
      const result = await validateMutation.mutateAsync(code.trim().toUpperCase());
      if (result.valid && result.guest) {
        localStorage.setItem(storageKey, code.trim().toUpperCase());
        try {
          await fetch("/api/guests/access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestCode: code.trim().toUpperCase(), eventSlug }),
          });
        } catch (accessError) {
          console.warn("No se pudo registrar el acceso:", accessError);
        }
        onValidGuest(code.trim().toUpperCase(), result.guest);
      } else {
        setError(result.error || "Código de invitación no válido");
      }
    } catch {
      setError("Error al validar el código. Por favor intenta de nuevo.");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />

      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <div
          className="backdrop-blur rounded-2xl shadow-2xl p-8 text-center"
          style={{ backgroundColor: `rgba(${cardRgb[0]},${cardRgb[1]},${cardRgb[2]},${cardOpacity})` }}
        >
          {/* Título */}
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: primaryColor }}
          >
            {title}
          </h1>
          <p className="mb-6 text-sm" style={{ color: textColor }}>
            {subtitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5" style={{ color: accentColor }} />
              </div>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: AYP001"
                className="block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent text-center text-lg font-mono tracking-wider"
                style={{
                  borderColor: accentColor + "80",
                  color: primaryColor,
                  backgroundColor: `rgba(${inputRgb[0]},${inputRgb[1]},${inputRgb[2]},${inputOpacity})`,
                  "--tw-ring-color": actionColor,
                } as React.CSSProperties}
                maxLength={10}
                autoCapitalize="characters"
                disabled={validateMutation.isPending}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showSavedMsg && (
              <div
                className="text-xs p-2 rounded-lg font-medium"
                style={{ color: primaryColor, backgroundColor: accentColor + "25" }}
              >
                ✓ {savedLabel}
              </div>
            )}

            <Button
              type="submit"
              className="w-full !py-4 !text-white !rounded-full"
              style={{ backgroundColor: actionColor }}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? "Validando..." : buttonLabel}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default GuestCodeEntry;
