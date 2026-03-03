import React from "react";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Users } from "lucide-react";

import { Companion, Event, Guest } from "@/types";

import { Button } from "@/components/ui/button";

interface GuestInfoProps {
  eventSlug: string;
  guest: Guest;
  event: Event | null;
  onContinue: () => void;
}

const useGuestByCode = (code: string, eventSlug: string) => {
  return useQuery<Guest | null>({
    queryKey: ["guest", "byCode", code, eventSlug],
    queryFn: async () => {
      const response = await fetch(`/api/guests/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, eventSlug }),
      });
      const data = await response.json();
      return data.valid ? data.guest : null;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  });
};

const GuestInfo: React.FC<GuestInfoProps> = ({ eventSlug, guest: initialGuest, event, onContinue }) => {
  const { data: updatedGuest } = useGuestByCode(initialGuest.code, eventSlug);

  const guest = updatedGuest || initialGuest;
  const totalConfirmed = guest.companions.filter((c: Companion) => c.confirmed).length + (guest.confirmed ? 1 : 0);
  const totalGuests = guest.maxGuests;

  // ── Labels ────────────────────────────────────────────────────────────────
  const labels          = event?.config?.labels;
  const confirmedBadge  = labels?.infoConfirmed        ?? "Asistencia Confirmada";
  const confirmedMsg    = labels?.infoConfirmedMessage  ?? "¡Gracias por confirmar tu asistencia!\nTe esperamos en nuestra boda.";
  const pendingMsg      = labels?.infoPendingMessage    ?? "¡Esperamos que puedan compartir esta fiesta junto a nosotros!";
  const guestsLabel     = labels?.infoGuestsLabel       ?? "N° de Invitados:";
  const statusTitle     = labels?.infoStatusTitle       ?? "Estado de Confirmaciones";
  const mainGuestLabel  = labels?.infoMainGuest         ?? "Invitado principal:";
  const companionsLabel = labels?.infoCompanions        ?? "Acompañantes confirmados:";
  const totalLabel      = labels?.infoTotal             ?? "Total confirmados:";
  const continueButton  = labels?.infoContinueButton    ?? "Volver a ver invitación";
  const viewButton      = labels?.infoViewButton        ?? "Ver Invitación Completa";

  // ── Theme ─────────────────────────────────────────────────────────────────
  const t = (event?.theme ?? {}) as Record<string, string>;
  const primaryColor = t.primaryColor || "#162b4e";
  const accentColor  = t.accentColor  || "#bfa15a";
  const actionColor  = t.actionColor  || "#466691";
  const textColor    = t.textColor    || "#374151";

  // ── Background ────────────────────────────────────────────────────────────
  const bgImage = (event?.assets as Record<string, string>)?.infoBg?.trim()
    || event?.photo2Url
    || event?.heroPhotoUrl
    || "/fondo.png";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <div className="bg-white/30 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">

          {/* Nombre del invitado */}
          <div className="mb-6">
            <div className="flex flex-col items-center gap-2">
              <span
                className="text-2xl font-serif font-semibold"
                style={{ color: primaryColor }}
              >
                {guest.name.split(",").map((name, index) => (
                  <div key={index} className="mb-1">{name.trim().toUpperCase()}</div>
                ))}
              </span>

              {/* Badge confirmado */}
              {guest.confirmed && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border"
                  style={{
                    backgroundColor: accentColor + "25",
                    color: primaryColor,
                    borderColor: accentColor + "60",
                  }}
                >
                  <CheckCircle className="w-4 h-4" style={{ color: accentColor }} />
                  {confirmedBadge}
                </div>
              )}
            </div>

            <p className="my-4 whitespace-pre-line text-sm" style={{ color: textColor }}>
              {guest.confirmed ? confirmedMsg : pendingMsg}
            </p>
          </div>

          {/* N° de invitados */}
          <div className="bg-white/50 rounded-lg p-2 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-5 h-5" style={{ color: actionColor }} />
              <span className="font-semibold" style={{ color: primaryColor }}>{guestsLabel}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: actionColor }}>{totalGuests}</div>
          </div>

          {/* Estado de confirmaciones */}
          {guest.confirmed && (
            <div
              className="mb-6 p-4 rounded-lg border-l-4 text-left"
              style={{
                backgroundColor: primaryColor + "12",
                borderLeftColor: accentColor,
              }}
            >
              <div className="text-sm" style={{ color: primaryColor }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="font-medium">{statusTitle}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>{mainGuestLabel}</span>
                    <span className="font-medium" style={{ color: accentColor }}>✓ Confirmado</span>
                  </div>

                  {guest.companions.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>{companionsLabel}</span>
                        <span className="font-medium">
                          {guest.companions.filter((c: Companion) => c.confirmed).length}/
                          {guest.companions.length}
                        </span>
                      </div>

                      {guest.companions.map((companion: Companion) => (
                        <div key={companion.id} className="flex justify-between pl-2 opacity-75">
                          <span>• {companion.name}:</span>
                          <span
                            className="font-medium"
                            style={{ color: companion.confirmed ? accentColor : "#d97706" }}
                          >
                            {companion.confirmed ? "✓ Confirmado" : "⏳ Pendiente"}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  <div
                    className="flex justify-between pt-1 border-t"
                    style={{ borderColor: accentColor + "40" }}
                  >
                    <span className="font-medium">{totalLabel}</span>
                    <span className="font-bold" style={{ color: actionColor }}>
                      {totalConfirmed}/{totalGuests}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={onContinue}
            className="w-full !py-4 !text-white !rounded-full"
            style={{ backgroundColor: actionColor }}
          >
            {guest.confirmed ? continueButton : viewButton}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GuestInfo;
